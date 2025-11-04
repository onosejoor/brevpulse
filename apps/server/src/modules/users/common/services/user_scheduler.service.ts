import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import {
  User,
  UserDocument,
  UserPreferences,
} from '@/mongodb/schemas/user.schema';
import { Model } from 'mongoose';
import * as cron from 'cron';

@Injectable()
export class UserSchedulerService implements OnModuleInit {
  private userCrons = new Map<string, cron.CronJob>();

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectQueue('email-queue') private emailQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.loadAllProUsers();
  }

  async loadAllProUsers() {
    const proUsers = await this.userModel
      .find({
        subscription: 'pro',
        'preferences.deliveryTime': { $exists: true },
      })
      .select('_id preferences.deliveryTime preferences.timezone')
      .lean();

    await Promise.all(
      proUsers.map((user) =>
        Promise.resolve(
          this.scheduleUser(user._id.toString(), user.preferences),
        ),
      ),
    );
  }

  async scheduleUser(userId: string, prefs: UserPreferences) {
    const time = prefs.deliveryTime; // "08:00"
    const tz = prefs.timezone || 'UTC';
    const [hour, minute] = time.split(':');

    const cronPattern = `${minute} ${hour} * * *`;

    await this.userCrons.get(userId)?.stop();

    const job = new cron.CronJob(
      cronPattern,
      async () => {
        await this.emailQueue.add('send-digest', {
          user: { id: userId },
          channel: 'email',
        });
        console.log(`Digest sent to ${userId} at ${time} ${tz}`);
      },
      null,
      true,
      tz,
    );

    this.userCrons.set(userId, job);
  }

  async unscheduleUser(userId: string) {
    await this.userCrons.get(userId)?.stop();
    this.userCrons.delete(userId);
  }

  // Call this when user updates deliveryTime
  async reschedule(userId: string) {
    const user = await this.userModel.findById(userId).lean();

    if (!user) {
      return;
    }

    if (user.subscription === 'pro') {
      await this.scheduleUser(userId, user.preferences);
    } else {
      await this.unscheduleUser(userId);
    }
  }
}
