import { RegisterQueueOptions } from '@nestjs/bullmq';
import appConfig from '../config/app.config';

export function forRootFactory() {
  const config = appConfig();
  return {
    connection: {
      url: config.REDIS_URL,
    },
    defaultJobOptions: {
      attempts: 10,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    },
  };
}

export function registerQueueFatory(options?: Partial<RegisterQueueOptions>) {
  const config = appConfig();
  return {
    connection: {
      url: config.REDIS_URL,
    },

    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    },
    ...options,
  };
}
