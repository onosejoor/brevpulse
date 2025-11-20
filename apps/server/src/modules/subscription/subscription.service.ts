import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import {
  Subscription,
  SubscriptionDocument,
} from '@/mongodb/schemas/subscription.schema';
import {
  Transaction,
  TransactionDocument,
} from '@/mongodb/schemas/transaction.schema';
import { User, UserDocument } from '@/mongodb/schemas/user.schema';
import { Model, Connection, ClientSession, Types } from 'mongoose';
import { Paystack } from 'paystack-sdk';
import { ApiResDTO } from '@/dtos/api.response.dto';
import { RedisService } from '../redis/redis.service';
import {
  ProcessedEvent,
  ProcessedEventDocument,
} from '@/mongodb/schemas/processed-event.schema';
import { PaystackService } from '../paystack/paystack.service';
import { NotificationService } from '../notification/notification.service';
import { PaystackEvent, ExtractEvent } from '../paystack/paystack.types';

// =======================================================

// === Types ===
type SubscriptionPlan = 'pro_monthly' | 'pro_yearly';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  // Using ! is safe here as NestJS config should ensure this exists
  private readonly paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY!);

  constructor(
    @InjectModel(Subscription.name)
    private readonly subModel: Model<SubscriptionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(ProcessedEvent.name)
    private readonly processedEventModel: Model<ProcessedEventDocument>,
    private redisService: RedisService,
    private paystackService: PaystackService,
    private notificationService: NotificationService,
  ) {}

  // =============================================================
  // WEBHOOK: Entry Point (Call from Controller)
  // =============================================================
  /**
   * Entry point for all Paystack subscription-related webhooks.
   * The payload is now strongly typed by PaystackEvent.
   */
  async handleWebhook(payload: PaystackEvent): Promise<{ received: true }> {
    const eventId = this.getEventId(payload);
    this.logger.log(
      `Processing event ${eventId} - Event Type: ${payload.event} - Payload: ${JSON.stringify(payload.data).substring(0, 100)}...`,
    );
    const alreadyProcessed = await this.isEventProcessed(eventId);
    if (alreadyProcessed) {
      this.logger.warn(`Event ${eventId} already processed. Skipping.`);
      return { received: true };
    }

    try {
      switch (payload.event) {
        case 'subscription.create':
          await this.handleSubscriptionCreate(payload.data);
          break;
        case 'subscription.disable':
        case 'subscription.not_renew':
          await this.handleSubscriptionDisable(payload.data);
          break;
        case 'invoice.update':
          await this.handleInvoiceUpdate(payload.data);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(payload.data);
          break;
        case 'charge.success':
          await this.handleChargeSuccess(payload);
          break;
        default:
          this.logger.log(`Unhandled event: ${(payload as any).event}`);
      }

      await this.markEventProcessed(eventId, payload.event);
    } catch (error) {
      this.logger.error(
        `Webhook processing failed for event ${payload.event}`,
        error instanceof Error ? error.stack : String(error),
      );
      // Re-throw to inform Paystack to retry (standard webhook behavior)
      throw error;
    }

    return { received: true };
  }

  // =============================================================
  // WEBHOOK HANDLERS
  // =============================================================

  /**
   * Logs a successful charge as a Transaction record.
   * @param event The full charge.success webhook event payload.
   */
  private async handleChargeSuccess(
    // The event type is known: PaystackEvent with event='charge.success'
    event: Extract<PaystackEvent, { event: 'charge.success' }>,
  ): Promise<void> {
    // event.data is now strongly typed
    const { reference, amount, currency, authorization, status, channel } =
      event.data;
    const subCode = event.data.subscription?.subscription_code;
    // User ID is expected to be nested in metadata for charge.success
    const userId = event.data.metadata?.user_id;

    if (!userId || !reference) {
      this.logger.warn('Missing required fields in charge.success', event.data);
      return;
    }

    // Using a transaction ensures atomicity
    await this.withTransaction(async (session) => {
      // 1. Find the Mongoose Subscription ID (if recurring payment)
      let subId: Types.ObjectId | undefined;
      if (subCode) {
        const sub = await this.subModel
          .findOne({ paystackSubscriptionCode: subCode })
          .select('_id')
          .lean()
          .session(session);
        subId = sub?._id;
      }

      // 2. Create the Transaction record
      await this.transactionModel.create(
        [
          {
            user: userId,
            reference: reference,
            subscription: subId, // Will be null if it's a one-off payment without a subCode
            amountPaidKobo: amount,
            currency: currency || 'NGN',
            status: status === 'success' ? 'success' : 'failed',
            authorizationCode: authorization?.authorization_code,
            cardType: authorization?.card_type,
            bank: authorization?.bank,
            channel: channel,
          },
        ],
        { session },
      );

      this.logger.log(`Transaction recorded for reference: ${reference}`);
    });
  }

  /**
   * Handles 'subscription.create' event to provision a new subscription or reactivate an old one.
   * @param data The Subscription event data payload from the webhook (type inferred by TS).
   */
  private async handleSubscriptionCreate(
    data: ExtractEvent<'subscription.create'>,
  ): Promise<void> {
    const {
      subscription_code,
      email_token,
      customer,
      plan,
      status,
      next_payment_date,
      createdAt,
    } = data;
    const userId = data.customer?.metadata?.user_id;
    const planCode = plan?.plan_code;

    if (!userId || !planCode || !customer?.email) {
      this.logger.warn('Missing required fields in subscription.create', data);
      return;
    }

    await this.withTransaction(async (session) => {
      const exists = await this.subModel
        .findOne({ paystackSubscriptionCode: subscription_code })
        .session(session)
        .lean();

      if (exists) {
        if (exists.status === 'canceled' && status === 'active') {
          await this.subModel.updateOne(
            { _id: exists._id },
            { $set: { status: 'active', canceledAt: null } },
            { session },
          );
          await this.userModel.updateOne(
            { _id: userId },
            { $set: { subscription: 'pro' } },
            { session },
          );
          this.logger.log(`Subscription reactivated: ${subscription_code}`);
        }
        return;
      }

      // Create new subscription record
      await this.subModel.create(
        [
          {
            user: userId,
            paystackSubscriptionCode: subscription_code,
            paystackEmailToken: email_token,
            plan: 'pro_monthly',
            status: status === 'active' ? 'active' : 'pending',
            currentPeriodStart: new Date(createdAt),
            currentPeriodEnd: new Date(next_payment_date),
            isFirstTrial:
              (data.customer?.metadata as any)?.is_first_trial === 'true',
          },
        ],
        { session },
      );

      // Update user status
      await this.userModel.updateOne(
        { _id: userId },
        { $set: { subscription: 'pro' } },
        { session },
      );

      this.logger.log(`Subscription created for user ${userId}`);
    });
  }

  /**
   * Handles 'subscription.disable' and 'subscription.not_renew' events.
   * Marks the subscription as canceled (non-renewing).
   * User retains access until currentPeriodEnd.
   */
  private async handleSubscriptionDisable(
    data:
      | ExtractEvent<'subscription.disable'>
      | ExtractEvent<'subscription.not_renew'>,
  ): Promise<void> {
    const userId = data.customer?.metadata?.user_id;
    if (!userId) return;

    await this.withTransaction(async (session) => {
      // Mark the MongoDB subscription as canceled
      await this.subModel.updateOne(
        { user: userId, status: 'active' },
        { $set: { status: 'canceled', canceledAt: new Date() } },
        { session },
      );

      this.logger.log(`Subscription canceled/non-renewing for user ${userId}`);
    });
  }

  /**
   * Handles 'invoice.update' event, usually for successful renewal.
   * @param data The Invoice event data payload from the webhook (type inferred by TS).
   */
  private async handleInvoiceUpdate(
    data: ExtractEvent<'invoice.update'>,
  ): Promise<void> {
    const { subscription, paid_at, next_payment_date } = data;
    const subCode = subscription?.subscription_code; // Note: subscription field is simplified in InvoiceData
    if (!subCode) {
      this.logger.log('No subscription code found in invoice.update');
      return;
    }

    await this.withTransaction(async (session) => {
      const result = await this.subModel.findOneAndUpdate(
        { paystackSubscriptionCode: subCode, status: 'active' },
        {
          $set: {
            currentPeriodStart: new Date(paid_at),
            currentPeriodEnd: new Date(next_payment_date),
          },
        },
        { session, new: true },
      );

      if (result === null) {
        this.logger.warn(
          `No active subscription found for renewal/invoice update: ${subCode}`,
        );
      } else {
        this.logger.log(`Renewal period updated for subscription: ${subCode}`);
      }
    });
  }

  /**
   * Handles 'invoice.payment_failed' event to mark the subscription as past_due.
   * @param data The Invoice event data payload from the webhook (type inferred by TS).
   */
  private async handleInvoicePaymentFailed(
    data: ExtractEvent<'invoice.payment_failed'>,
  ): Promise<void> {
    const subCode = data.subscription?.subscription_code;
    if (!subCode) return;

    await this.withTransaction(async (session) => {
      const result = await this.subModel.updateOne(
        { paystackSubscriptionCode: subCode, status: 'active' },
        { $set: { status: 'past_due' } },
        { session },
      );

      if (result.matchedCount > 0) {
        this.logger.warn(`Subscription marked past_due: ${subCode}`);
        // TODO: Trigger dunning email via NotificationService
      }
    });
  }

  // =============================================================
  // PUBLIC API
  // =============================================================

  /**
   * Retrieves the active subscription status for a user.
   */
  async getStatus(userId: string): Promise<ApiResDTO> {
    // Find active OR canceled subscriptions (canceled ones might still be in valid period)
    const sub = await this.subModel
      .findOne({
        user: userId,
        status: { $in: ['active', 'canceled', 'past_due'] },
      })
      .sort({ currentPeriodEnd: -1 }) // Get the one ending latest
      .lean();

    if (!sub) {
      return {
        status: 'error',
        message: 'No subscription found',
      };
    }

    const isValid =
      sub.status === 'active' ||
      (sub.status === 'canceled' &&
        sub.currentPeriodEnd &&
        new Date(sub.currentPeriodEnd) > new Date()) ||
      (sub.status === 'past_due' &&
        sub.currentPeriodEnd &&
        new Date(sub.currentPeriodEnd) > new Date()); // Grace period?

    if (!isValid) {
      // Lazy downgrade: If we find an invalid/expired sub but user is still marked as pro, fix it.
      // We can't easily check user status here without another query, but we can blindly ensure it's free
      // if we are sure this is their only sub.
      // For safety, let's just return error for now, or trigger a background downgrade.
      // Given the context, let's do a quick check-and-downgrade if needed.
      await this.userModel.updateOne(
        { _id: userId, subscription: 'pro' },
        { $set: { subscription: 'free' } },
      );

      return {
        status: 'error',
        message: 'Subscription expired or inactive',
      };
    }

    return { status: 'success', data: sub };
  }

  /**
   * Cancels a subscription via Paystack API and updates local DB status.
   */
  async cancelSubscription(userId: string): Promise<ApiResDTO> {
    const sub = await this.subModel
      .findOne({
        user: userId,
        status: 'active',
      })
      .lean();

    if (!sub) {
      return {
        status: 'error',
        message: 'No active subscription found to cancel',
      };
    }

    // Call Paystack API to cancel
    const resp = await this.paystackService.cancel(
      sub.paystackSubscriptionCode,
      sub.paystackEmailToken,
    );

    if (!resp.status) {
      throw new InternalServerErrorException(
        resp.message || 'Failed to cancel on Paystack',
      );
    }

    // Update local DB status inside a transaction
    await this.withTransaction(async (session) => {
      await this.subModel.updateOne(
        { _id: sub._id },
        { $set: { status: 'canceled', canceledAt: new Date() } },
        { session },
      );

      // We DO NOT downgrade the user here immediately.
      // They should retain access until currentPeriodEnd.
    });

    return {
      status: 'success',

      message: 'Subscription cancelled successfully',
    };
  }

  // =============================================================
  // HELPERS
  // =============================================================

  /**
   * Helper to execute Mongoose operations within a transaction.
   */
  private async withTransaction<T>(
    fn: (session: ClientSession) => Promise<T>,
  ): Promise<T> {
    const session = await this.connection.startSession();
    try {
      // The `withTransaction` wrapper handles commit and abort logic
      return await session.withTransaction(fn);
    } finally {
      session.endSession();
    }
  }

  private getIdempotencyKey(eventId: string): string {
    return `paystack:webhook:${eventId}`;
  }

  private async isEventProcessed(eventId: string): Promise<boolean> {
    const isProcessed = await this.redisService.exists(
      this.getIdempotencyKey(eventId),
    );
    return isProcessed === 1;
  }

  /**
   * Writes key to Redis (TTL 48h) and records the event in MongoDB for persistence.
   */
  private async markEventProcessed(
    eventId: string,
    eventType: string,
  ): Promise<void> {
    const filter = { eventId, eventType };

    await Promise.all([
      this.redisService.set(this.getIdempotencyKey(eventId), '1', 60 * 60 * 48),
      this.processedEventModel.findOneAndUpdate(
        filter,
        {
          ...filter,
          processedAt: new Date(),
        },
        {
          upsert: true,
        },
      ),
    ]);
  }

  /**
   * Helper to derive a unique ID for the event based on its type and data.
   */
  private getEventId(payload: PaystackEvent): string {
    switch (payload.event) {
      case 'subscription.create':
      case 'subscription.disable':
      case 'subscription.not_renew':
        return `sub_${payload.data.subscription_code}_${payload.event}`;
      case 'invoice.update':
      case 'invoice.payment_failed':
        return `inv_${payload.data.invoice_code}_${payload.event}`;
      case 'charge.success':
        return `chg_${payload.data.reference}`;
      default:
        // Fallback for unknown events (shouldn't happen with strict typing but good for safety)
        return `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }
  }
}
