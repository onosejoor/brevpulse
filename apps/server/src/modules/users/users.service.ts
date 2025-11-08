import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/mongodb/schemas/user.schema';
import { Model } from 'mongoose';
import { omitObjKeyVal } from 'src/utils/utils';
import { RedisService } from '../redis/redis.service';
import { UpdateUserDto } from '@/dtos/update-user.dto';
import { UserSchedulerService } from './common/services/user_scheduler.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectQueue('email-queue') private emailQueue: Queue,
    private redisService: RedisService,
    private userScheduler: UserSchedulerService,
  ) {}

  async findOne(id: string) {
    const cacheKey = `users:${id}`;

    const cachedData = await this.redisService.getParsedData(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const user = await this.userModel.findById(id).select('+tokens').lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const synchedTokens = user.tokens.map((token) => token.provider);
    const newObj = omitObjKeyVal(user, ['tokens']);

    const responseData = {
      status: 'success',
      data: {
        ...newObj,
        synchedTokens,
      },
    };

    await this.redisService.set(cacheKey, JSON.stringify(responseData));

    return responseData;
  }

  async update(
    id: string,
    subscription: User['subscription'],
    updateUserDto: UpdateUserDto,
  ) {
    if (subscription !== 'pro') {
      delete updateUserDto.preferences?.deliveryTime;
    }

    await this.userModel.updateOne({ _id: id }, updateUserDto);

    if (subscription === 'pro' && updateUserDto.preferences?.deliveryTime) {
      await this.userScheduler.scheduleUserDigest(id);
    }

    return {
      status: 'success',
      message: 'Profile update received, your new changes will reflect shortly',
    };
  }

  async downgradeToFree(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new Error('User Not Found');
    }

    user.subscription = 'free';
    await user.save();

    await this.emailQueue.removeJobScheduler(`pro-digest-${userId}`);

    console.log(`User ${userId} downgraded to Free — now uses 6:00 AM UTC`);
  }
}
