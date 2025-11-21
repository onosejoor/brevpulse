import { Module } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@/mongodb/schemas/user.schema';

@Module({
  providers: [PaystackService],
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  exports: [PaystackService],
})
export class PaystackModule {}
