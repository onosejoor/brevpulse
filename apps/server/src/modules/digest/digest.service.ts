import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { GmailConnectService } from '../integrations/services/gmail.service';

@Injectable()
export class DigestService {
  constructor(
    private redisService: RedisService,
    private gmailService: GmailConnectService,
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
}
