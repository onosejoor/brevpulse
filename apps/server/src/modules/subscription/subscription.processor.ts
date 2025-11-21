import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@/mongodb/schemas/user.schema';
import { Model } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
} from '@/mongodb/schemas/subscription.schema';
import { Logger } from '@nestjs/common';

@Processor('subscription')
export class SubscriptionProcessor extends WorkerHost {
  private readonly logger = new Logger(SubscriptionProcessor.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Subscription.name)
    private subModel: Model<SubscriptionDocument>,
  ) {
    super();
  }

  async process(job: Job<{ subId: string; userId: string }>) {
    switch (job.name) {
      case 'check-expiration':
        await this.handleCheckExpiration(job.data);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleCheckExpiration(data: { subId: string; userId: string }) {
    const { subId, userId } = data;
    this.logger.log(`Checking expiration for subscription ${subId}`);

    const sub = await this.subModel.findById(subId).lean();

    if (!sub) {
      this.logger.warn(
        `Subscription ${subId} not found during expiration check`,
      );
      return;
    }

    // Check if subscription is still valid
    // It is valid if status is active OR (canceled/past_due AND currentPeriodEnd > now)
    // But this job is scheduled for currentPeriodEnd, so we expect it to be expired unless renewed.
    // If renewed, currentPeriodEnd would be in the future.

    const now = new Date();
    const isExpired =
      sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) <= now;

    if (isExpired && (sub.status === 'canceled' || sub.status === 'past_due')) {
      // Downgrade user
      await this.userModel.updateOne(
        { _id: userId, subscription: 'pro' },
        { $set: { subscription: 'free' } },
      );
      this.logger.log(`User ${userId} downgraded to free due to expiration`);
    } else {
      this.logger.log(
        `Subscription ${subId} is still valid or renewed. No action taken.`,
      );
    }
  }
}
