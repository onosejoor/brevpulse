import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';
import { MailWorker } from 'src/workers/mail.worker';

@Module({
  providers: [MailService, MailWorker],
  imports: [
    JwtModule.register({ global: true }),
    BullModule.registerQueue({
      name: 'email-queue',
      connection: {
        url: process.env.REDIS_URL,
      },
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  exports: [MailService],
})
export class MailModule {}
