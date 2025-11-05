import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { GmailConnectService } from '../integrations/services/gmail.service';
import { GeminiService } from '../gemini/gemini.service';
import { Model } from 'mongoose';
import { User, UserDocument } from '@/mongodb/schemas/user.schema';
import { GeminiInputs } from '../gemini/types/gemini.type';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DigestPayload } from '@repo/shared-types/globals';
import { ApiResDTO } from '@/dtos/api.response.dto';
import { Digest, DigestDocument } from '@/mongodb/schemas/digest.schema';
import { CryptoService } from '@/common/services/crypto.service';
import { RedisService } from '../redis/redis.service';
import { getBufferKey } from '@/utils/utils';
import { CalendarConnectService } from '../integrations/services/calendar.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class DigestService {
  constructor(
    private gmailService: GmailConnectService,
    private calendarService: CalendarConnectService,
    private geminiService: GeminiService,
    private cryptoService: CryptoService,
    private redisService: RedisService,

    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Digest.name)
    private digestModel: Model<DigestDocument>,
    @InjectQueue('email-queue')
    private readonly emailQueue: Queue,
  ) {}

  async getUserDigests(userId: string, limit: number = 10, page: number = 1) {
    const cacheKey = `user:${userId}:digests:all:page:${page}:limit:${limit}`;

    const cachedData = await this.redisService.getParsedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const [digests, encryptionKey] = await Promise.all([
      this.digestModel
        .find({ userId: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.cryptoService.getUserKey(userId),
    ]);

    const decodedData = this.cryptoService.decryptMany(
      digests,
      getBufferKey(encryptionKey),
    );

    const res = {
      status: 'success',
      data: decodedData,
    };

    await this.redisService.set(cacheKey, JSON.stringify(res));

    return res;
  }

  @Cron('0 8 * * *') // 8:00 AM UTC
  async sendFreeDigests() {
    const freeUsers = await this.userModel
      .find({ subscription: 'free' })
      .lean();

    await Promise.all(
      freeUsers.map((u) =>
        Promise.resolve(
          this.emailQueue.add('send-digest', {
            type: 'send-digest',
            data: {
              user: { ...u, id: u._id },
            },
          }),
        ),
      ),
    );
  }

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
                user: { ...u, id: u._id },
              },
            }),
          ),
        ),
      );

      return {
        status: 'success',
        message: `email queue added: ${users.map((u) => u.email).join(', ')}`,
      };
    } catch (err) {
      console.error('Error enqueuing daily digest jobs', err);
      throw new InternalServerErrorException(' Internal Server Error');
    }
  }

  async saveDigest(payload: DigestPayload, userId: string): Promise<ApiResDTO> {
    const { encrypted, iv, authTag } = await this.cryptoService.encrypt(
      payload,
      userId,
    );

    await this.digestModel.create({
      userId,
      content: encrypted,
      iv,
      authTag,
      deliveryChannels: ['email'],
      summary: payload.summary,
    });

    await this.redisService.deleteByPattern(`user:${userId}:digests:all`);

    return {
      status: 'success',
      message: 'Digest successfully saved',
    };
  }

  async generateWithGemini(user: AuthTokenPayload): Promise<DigestPayload> {
    const userDoc = await this.userModel
      .findById(user.id)
      .select('tokens subscription')
      .lean()
      .exec();

    if (!userDoc) {
      throw new BadRequestException('User not found');
    }

    const activeTokens = userDoc.tokens
      .filter((token) => !token.isDisabled)
      .map((token) => token.provider);

    const serviceMap: Record<string, () => Promise<any>> = {
      gmail: () => this.gmailService.getGmailData(user.id),
      calendar: () => this.calendarService.getCalendarData(user.id),
    };

    // Only run promises for active integrations
    const promises = activeTokens
      .filter((provider) => provider in serviceMap)
      .map((provider) => serviceMap[provider]());

    const results = await Promise.allSettled(promises);

    const integrations = results
      .filter((res) => res.status === 'fulfilled')
      .map((res) => res.value.data);

    const input: GeminiInputs = {
      rawData: integrations.flat(),
      period: 'daily',
      plan: userDoc.subscription,
    };

    return this.geminiService.generateDigest(input);
  }
}
