import { RegisterQueueOptions } from '@nestjs/bullmq';

export function forRootFactory() {
  return {
    connection: {
      url: process.env.REDIS_URL,
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
  return {
    ...(options?.name && { name: options.name }),
    connection: {
      url: process.env.REDIS_URL,
    },

    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    },
  };
}
