import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { mongooseConfigFactory } from './mongodb/connection.factory';
import { AuthModule } from './modules/auth/auth.module';
import { BullModule } from '@nestjs/bullmq';
import { forRootFactory } from './common/factories/redis.factory';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      useFactory: forRootFactory,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: mongooseConfigFactory,
    }),
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
