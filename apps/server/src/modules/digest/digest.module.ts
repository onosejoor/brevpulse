import { Module } from '@nestjs/common';
import { DigestController } from './digest.controller';
import { DigestService } from './digest.service';
import { RedisModule } from '../redis/redis.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { GeminiModule } from '../gemini/gemini.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@/mongodb/schemas/user.schema';
import { BullModule } from '@nestjs/bullmq';
import { registerQueueFatory } from '@/common/factories/redis.factory';

@Module({
  imports: [
    RedisModule,
    IntegrationsModule,
    GeminiModule,
    BullModule.registerQueueAsync({
      name: 'email-queue',
      useFactory: registerQueueFatory,
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [DigestController],
  providers: [DigestService],
  exports: [DigestService],
})
export class DigestModule {}
