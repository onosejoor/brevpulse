import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

export function throttlerFactory(): ThrottlerModuleOptions {
  return {
    errorMessage() {
      return `Too Many Requests, try again in later`;
    },
    storage: new ThrottlerStorageRedisService(process.env.REDIS_URL),
    throttlers: [
      {
        name: 'short',
        ttl: 60000,
        limit: 5,
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ],
  };
}
