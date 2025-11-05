import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Model } from 'mongoose';
import {
  User,
  UserDocument,
  UserPreferences,
} from '@/mongodb/schemas/user.schema';

@Injectable()
export class UserSchedulerService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectQueue('email-queue') private emailQueue: Queue,
    private schedulerRegistry: SchedulerRegistry,
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

  scheduleUser(userId: string, prefs: UserPreferences) {
    const time = prefs.deliveryTime; // "08:00"
    const tz = prefs.timezone || 'UTC';
    const [hour, minute] = time.split(':');

    const cronPattern = `${minute} ${hour} * * *`;

    this.schedulerRegistry.deleteCronJob(userId);

    const job = new CronJob(
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

    this.schedulerRegistry.addCronJob(userId, job);
    job.start();
  }

  unscheduleUser(userId: string) {
    try {
      const job = this.schedulerRegistry.getCronJob(userId);
      job.stop();
      this.schedulerRegistry.deleteCronJob(userId);
    } catch {
      // No job found, safe to ignore
    }
  }

  async reschedule(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('_id subscription preferences')
      .lean();

    if (!user) return;

    if (user.subscription === 'pro') {
      this.scheduleUser(userId, user.preferences);
    } else {
      this.unscheduleUser(userId);
    }
  }
}
