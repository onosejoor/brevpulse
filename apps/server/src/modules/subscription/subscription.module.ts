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

@Module({
  imports: [
    PaystackModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: User.name, schema: UserSchema },
      { name: ProcessedEvent.name, schema: ProcessedEventSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    RedisModule,
    NotificationModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class SubscriptionModule {}
