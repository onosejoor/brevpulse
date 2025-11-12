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
import { Model, Connection } from 'mongoose';
import { User, UserDocument } from '@/mongodb/schemas/user.schema';
import { Paystack } from 'paystack-sdk';
import { SubscriptionCreated } from 'paystack-sdk/dist/subscription';

@Injectable()
export class SubscriptionService {
  private logger = new Logger(SubscriptionService.name);
  private paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY!);

  constructor(
    @InjectModel(Subscription.name)
    private subModel: Model<SubscriptionDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  async createFromPaystack(paystackData: any): Promise<void> {
    const userId = paystackData.metadata?.user_id;
    const plan = paystackData.plan;
    const amount = paystackData.amount;
    const customerEmail = paystackData.customer?.email;

    if (!userId || !plan?.plan_code || amount !== 400000 || !customerEmail) {
      this.logger.warn('Invalid charge.success payload');
      return;
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const subResp = await this.paystack.subscription.create({
        customer: customerEmail,
        plan: plan.plan_code,
        start_date: paystackData.paid_at,
      });

      if (!subResp.status) {
        throw new InternalServerErrorException(subResp.message);
      }

      const sub = (subResp as SubscriptionCreated).data;
      const nextPayment = sub.next_payment_date;

      // 2. Create Subscription doc
      await this.subModel.create(
        [
          {
            user: userId,
            paystackSubscriptionCode: sub.subscription_code,
            paystackEmailToken: sub.email_token,
            plan: 'pro_monthly',
            status: 'active',
            currentPeriodStart: new Date(paystackData.paid_at),
            currentPeriodEnd: new Date(nextPayment),
            amountPaidKobo: amount,
            isFirstTrial: paystackData.metadata?.is_first_trial === 'true',
          },
        ],
        { session },
      );

      await this.userModel.updateOne(
        { _id: userId },
        { $set: { subscription: 'pro' } },
        { session },
      );

      await session.commitTransaction();
    } catch (error: any) {
      await session.abortTransaction();
      this.logger.error('Failed', error.message);
      throw new InternalServerErrorException('Subscription failed');
    } finally {
      session.endSession();
    }
  }

  async cancelFromPaystack(paystackData: any): Promise<void> {
    const userId = paystackData.metadata?.user_id;
    if (!userId) return;

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await this.subModel.updateOne(
        { user: userId, status: 'active' },
        { $set: { status: 'canceled', canceledAt: new Date() } },
        { session },
      );

      await this.userModel.updateOne(
        { _id: userId },
        {
          $set: { subscription: 'free' },
        },
        { session },
      );

      await session.commitTransaction();
    } catch (error) {
      this.logger.error(
        `Failed to cancel subscription for user ${userId}`,
        error,
      );
      await session.abortTransaction();
      throw new InternalServerErrorException(
        `Failed to cancel subscription: ${error.message}`,
      );
    } finally {
      session.endSession();
    }
  }

  async handleRenewal(paystackData: any): Promise<void> {
    const subCode = paystackData.subscription?.subscription_code;
    if (!subCode) return;

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const nextPayment = paystackData.subscription?.next_payment_date;
      const paidAt = paystackData.paid_at;

      await this.subModel.updateOne(
        { paystackSubscriptionCode: subCode, status: 'active' },
        {
          $set: {
            currentPeriodStart: new Date(paidAt),
            currentPeriodEnd: new Date(nextPayment),
            amountPaidKobo: paystackData.amount,
          },
        },
        { session },
      );

      await session.commitTransaction();
    } catch (error) {
      this.logger.error(
        `Failed to handle renewal for sub ${subCode}`,
        error.stack,
      );
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  }

  async getActive(userId: string) {
    return this.subModel.findOne({ user: userId, status: 'active' });
  }
}
