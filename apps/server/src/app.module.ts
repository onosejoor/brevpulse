import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { mongooseConfigFactory } from './mongodb/connection.factory';
import { AuthModule } from './modules/auth/auth.module';
import { BullModule } from '@nestjs/bullmq';
import { forRootFactory } from './common/factories/redis.factory';
import { UserModule } from './modules/users/users.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { throttlerFactory } from './common/factories/throttler.factory';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      useFactory: throttlerFactory,
    }),
    BullModule.forRootAsync({
      useFactory: forRootFactory,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: mongooseConfigFactory,
    }),
    AuthModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
