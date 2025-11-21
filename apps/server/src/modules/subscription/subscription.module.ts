import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PaystackModule } from '../paystack/paystack.module';
import {
  Subscription,
  SubscriptionSchema,
} from '@/mongodb/schemas/subscription.schema';
import { User, UserSchema } from '@/mongodb/schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProcessedEvent,
  ProcessedEventSchema,
} from '@/mongodb/schemas/processed-event.schema';
import { RedisModule } from '../redis/redis.module';
import { NotificationModule } from '../notification/notification.module';
import {
  Transaction,
  TransactionSchema,
} from '@/mongodb/schemas/transaction.schema';
import { BullModule } from '@nestjs/bullmq';
import { SubscriptionProcessor } from './subscription.processor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
      { name: ProcessedEvent.name, schema: ProcessedEventSchema },
    ]),
    RedisModule,
    PaystackModule,
    NotificationModule,
    BullModule.registerQueue({
      name: 'subscription',
    }),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionProcessor],
})
export class SubscriptionModule {}
