import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model, type Types } from 'mongoose';
import { User, UserDocument } from '@/mongodb/schemas/user.schema';

@Injectable()
export class UserSchedulerService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectQueue('email-queue') private emailQueue: Queue,
  ) {}

  async scheduleUserDigest(userId: string | Types.ObjectId) {
    const user = await this.userModel.findById(userId).lean();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const [hour, minute] = user.preferences.deliveryTime.split(':');
    const cronPattern = `${minute} ${hour} * * *`;

    const jobId = `pro-digest-${user._id.toString()}`;

    await this.emailQueue.removeJobScheduler(jobId);

    await this.emailQueue.add(
      'send-digest',
      {
        type: 'send-digest',
        data: {
          user: { ...user, id: user._id },
        },
      },
      {
        repeat: {
          pattern: cronPattern,
          tz: user.preferences.timezone || 'UTC',
        },
        jobId,
      },
    );

    console.log(
      `Scheduled digest for ${user._id.toString()} at ${cronPattern}`,
    );
  }
}
