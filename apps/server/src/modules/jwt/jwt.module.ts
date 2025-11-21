import { Module } from '@nestjs/common';
import { JwtCustomService } from './jwt.service';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@/mongodb/schemas/user.schema';
import {
  RefreshToken,
  RefreshTokenSchema,
} from '@/mongodb/schemas/refresh-token.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
  ],
  providers: [JwtCustomService],
  exports: [JwtCustomService],
})
export class CustomJwtModule {}
