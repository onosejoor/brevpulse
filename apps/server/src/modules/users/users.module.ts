import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { UserTokenService } from './common/user-token.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User } from '@/mongodb/schemas/user.schema';
import { UserSchema } from '@/mongodb/schemas/user.schema';
import { RedisModule } from '../redis/redis.module';
import { BullModule } from '@nestjs/bullmq';
import { registerQueueFatory } from '@/common/factories/redis.factory';
import { ImageWorker } from '@/workers/image.worker';
import { UserSchedulerService } from './common/services/user_scheduler.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    BullModule.registerQueueAsync(
      {
        name: 'image-queue',
        useFactory() {
          return registerQueueFatory();
        },
      },
      {
        name: 'email-queue',
        useFactory() {
          return registerQueueFatory();
        },
      },
    ),
    RedisModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserTokenService,
    ImageWorker,
    UserTokenService,
    UserSchedulerService,
  ],
  exports: [UserTokenService],
})
export class UserModule {}
