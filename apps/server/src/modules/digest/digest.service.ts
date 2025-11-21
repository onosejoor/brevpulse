import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
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
import { GitHubConnectService } from '../integrations/services/github.service';

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);
  constructor(
    private gmailService: GmailConnectService,
    private calendarService: CalendarConnectService,
    private geminiService: GeminiService,
    private cryptoService: CryptoService,
    private redisService: RedisService,
    private githubService: GitHubConnectService,

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
      this.logger.log(`Cache hit for user digests: ${userId}`);
      return cachedData;
    }

    this.logger.log(
      `Cache miss for user digests: ${userId}. Fetching from DB.`,
    );
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

  @Cron('0 7 * * *') // 7:00 AM UTC
  async sendFreeDigests() {
    this.logger.log(
      `Running daily digest cron job for free users at: ${new Date(Date.now()).toISOString()}`,
    );

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
      this.logger.log('Manually triggering daily digest for all users.');
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
      this.logger.error('Error enqueuing daily digest jobs', err.stack);
      throw new InternalServerErrorException(' Internal Server Error');
    }
  }

  async saveDigest(payload: DigestPayload, userId: string): Promise<ApiResDTO> {
    this.logger.log(`Saving digest for user: ${userId}`);
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

    this.logger.log(`Clearing digest cache for user: ${userId}`);
    await this.redisService.deleteByPattern(`user:${userId}:digests:all`);

    return {
      status: 'success',
      message: 'Digest successfully saved',
    };
  }

  async generateWithGemini(user: AuthTokenPayload): Promise<DigestPayload> {
    this.logger.log(`Generating digest with Gemini for user: ${user.id}`);
    const userDoc = await this.userModel
      .findById(user.id)
      .select('tokens subscription')
      .lean()
      .exec();

    if (!userDoc) {
      throw new BadRequestException('User not found');
    }

    const isPro = userDoc.subscription === 'pro';
    const proServices = ['github', 'figma', 'slack'];

    const activeTokens = userDoc.tokens
      .filter((token) => !token.isDisabled)
      .map((token) => token.provider);

    const serviceMap: Record<string, () => Promise<ApiResDTO<any>>> = {
      gmail: () => this.gmailService.getGmailData(user.id),
      calendar: () => this.calendarService.getCalendarData(user.id),
      github: () => this.githubService.getGitHubData(user.id),
    };

    const promises = activeTokens
      .filter((provider) => {
        if (!(provider in serviceMap)) return false;
        if (proServices.includes(provider)) {
          return isPro;
        }
        return true;
      })
      .map((provider) => serviceMap[provider]());

    const results = await Promise.allSettled(promises);

    const integrations = results
      .filter((res) => res.status === 'fulfilled')
      .map((res) => res.value.data);

    this.logger.log(
      `Fetched data from ${integrations.length} integrations for user: ${user.id}`,
    );
    const input: GeminiInputs = {
      rawData: integrations.flat(),
      period: 'daily',
      plan: userDoc.subscription,
    };

    return this.geminiService.generateDigest(input);
  }
}
