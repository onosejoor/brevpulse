import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
import {
  DigestHistory,
  DigestHistoryDocument,
} from '@/mongodb/schemas/digest.schema';
import { CryptoService } from '@/common/services/crypto.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class DigestService {
  constructor(
    private gmailService: GmailConnectService,
    private geminiService: GeminiService,
    private cryptoService: CryptoService,
    private redisService: RedisService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(DigestHistory.name)
    private digestModel: Model<DigestHistoryDocument>,
    @InjectQueue('email-queue')
    private readonly emailQueue: Queue,
  ) {}

  async generateDigest(userId: string, limit: number = 10, page: number = 1) {
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
        .limit(limit),
      this.cryptoService.getUserKey(userId),
    ]);

    const decodedData = this.cryptoService.decryptMany(digests, encryptionKey);

    const res = {
      status: 'success',
      digest: digests,
      data: decodedData,
    };

    await this.redisService.set(cacheKey, JSON.stringify(res));

    return res;
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

  async saveHistory(
    payload: DigestPayload,
    userId: string,
  ): Promise<ApiResDTO> {
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

    return {
      status: 'success',
      message: 'Digest successfully saved',
    };
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
