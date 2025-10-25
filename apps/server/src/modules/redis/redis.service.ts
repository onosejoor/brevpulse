import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL!);
  }
  async onModuleDestroy() {
    await this.client.quit();
  }
  async set(key: string, data: string) {
    await this.client.set(key, data, 'EX', 300);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async getParsedData<T = any>(key: string) {
    const data = await this.client.get(key);
    if (!data) {
      return undefined;
    }
    console.log(`Returning cache from key: ${key}`);

    return JSON.parse(data) as T;
  }

  async delete(key: string): Promise<number> {
    return this.client.del(key);
  }
}
