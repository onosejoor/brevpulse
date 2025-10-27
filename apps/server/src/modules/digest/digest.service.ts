import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { GmailConnectService } from '../integrations/services/gmail.service';
import { GeminiService } from '../gemini/gemini.service';
import { Model } from 'mongoose';
import { User, UserDocument } from '@/mongodb/schemas/user.schema';
import { GeminiInputs } from '../gemini/types/gemini.type';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class DigestService {
  constructor(
    private redisService: RedisService,
    private gmailService: GmailConnectService,
    private geminiService: GeminiService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

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

  async generateWithGemini(user: AuthTokenPayload) {
    const gmailData = await this.gmailService.getGmailData(user.id);

    if (gmailData.status !== 'success') {
      throw new InternalServerErrorException(gmailData.message);
    }

    const input: GeminiInputs = {
      rawData: gmailData.data,
      period: 'daily',
      plan: user.subscription,
      preferences: { maxItemsPerSource: user.subscription === 'free' ? 3 : 10 },
    };

    return this.geminiService.generateDigest(input);
  }
}
