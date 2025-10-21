import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { mongooseConfigFactory } from './mongodb/connection.factory';
import { AuthModule } from './modules/auth/auth.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: mongooseConfigFactory,
    }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL,
      },
      defaultJobOptions: {
        attempts: 10,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    AuthModule,
  ],
})
export class AppModule {}
