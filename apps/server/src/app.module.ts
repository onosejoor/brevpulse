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
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { DigestModule } from './modules/digest/digest.module';
import { ScheduleModule } from '@nestjs/schedule';
import appConfig from './common/config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
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
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    IntegrationsModule,
    DigestModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
