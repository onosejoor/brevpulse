import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/mongodb/schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
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
    JwtModule.register({ global: true }),
    MailModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
