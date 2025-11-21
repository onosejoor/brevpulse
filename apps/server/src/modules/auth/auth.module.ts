import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/mongodb/schemas/user.schema';
import { MailModule } from '../mail/mail.module';
import { BullModule } from '@nestjs/bullmq';
import { registerQueueFatory } from 'src/common/factories/redis.factory';
import { GoogleAuthService } from './google.service';
import { CustomJwtModule } from '../jwt/jwt.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    BullModule.registerQueueAsync({
      name: 'email-queue',
      useFactory: registerQueueFatory,
    }),
    MailModule,
    CustomJwtModule,
  ],
  providers: [AuthService, GoogleAuthService],
  controllers: [AuthController],
})
export class AuthModule {}
