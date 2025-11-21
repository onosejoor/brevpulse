import {
  Notification,
  NotificationDocument,
} from '@/mongodb/schemas/notification.schema';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bullmq';
import { Model } from 'mongoose';

type JobData = {
  userId: string;
  message: string;
  type: Notification['type'];
};

@Processor('notification')
export class NotificationWorker extends WorkerHost {
  private logger = new Logger(NotificationWorker.name);
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {
    super();
  }

  async process(job: Job<JobData>) {
    const { data, name } = job;
    const { userId, message, type } = data;
    const time = Date.now();

    switch (name) {
      case 'send-notification':
        await this.sendNotification({ userId, message, type });
        break;
      default:
        throw new Error(`Unsupported notification type: ${type}`);
    }

    this.logger.log(
      `Notification processed for user ${userId} - Time: ${Date.now() - time}ms`,
    );
  }

  async sendNotification(payload: JobData) {
    const { userId, message, type } = payload;

    const notification = new this.notificationModel({
      userId,
      message,
      type,
    });

    await notification.save();
  }
}
