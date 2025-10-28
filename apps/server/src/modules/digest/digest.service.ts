import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { GmailConnectService } from '../integrations/services/gmail.service';
import { GeminiService } from '../gemini/gemini.service';
import { Model } from 'mongoose';
import { User, UserDocument } from '@/mongodb/schemas/user.schema';
import { GeminiInputs } from '../gemini/types/gemini.type';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron } from '@nestjs/schedule';
import { DigestPayload } from '@repo/shared-types/globals';
import { ApiResDTO } from '@/dtos/api.response.dto';

@Injectable()
export class DigestService {
  constructor(
    private redisService: RedisService,
    private gmailService: GmailConnectService,
    private geminiService: GeminiService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
  ) {}

  @Cron('0 6 * * *')
  async handleDailyDigestCron(): Promise<ApiResDTO> {
    try {
      const users = await this.userModel
        .find()
        .select('_id email name subscription email_verified')
        .lean();

      await Promise.all(
        users.map((u) =>
          Promise.resolve(
            this.emailQueue.add('send-digest', {
              type: 'send-digest',
              data: {
                user: {
                  id: u._id,
                  email: u.email,
                  email_verified: u.email_verified,
                  subscription: u.subscription,
                },
              },
            }),
          ),
        ),
      );

      return {
        status: 'success',
        message: `email queue added ${users.map((u) => u.email).join(', ')}`,
      };
    } catch (err) {
      console.error('Error enqueuing daily digest jobs', err);
      throw new InternalServerErrorException(' Internal Server Error');
    }
  }

  async generateDigest(userId: string) {
    const cacheKey = `user:${userId}:digests:all`;

    const cachedData = await this.redisService.getParsedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const [gmail] = await Promise.allSettled([
      this.gmailService.getGmailData(userId),
    ]);

    const integrations = [gmail]
      .filter((res) => res.status === 'fulfilled')
      .map((res) => res.value.data);

    const res = {
      status: 'success',
      data: integrations.flat(),
    };

    await this.redisService.set(cacheKey, JSON.stringify(res));

    return res;
  }

  async generateWithGemini(user: AuthTokenPayload): Promise<DigestPayload> {
    const gmailData = await this.gmailService.getGmailData(user.id);

    if (gmailData.status !== 'success') {
      throw new InternalServerErrorException(gmailData.message);
    }

    const input: GeminiInputs = {
      rawData: gmailData.data,
      period: 'daily',
      plan: user.subscription,
    };

    return this.geminiService.generateDigest(input);
  }
}
