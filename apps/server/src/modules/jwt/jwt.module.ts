import { Module } from '@nestjs/common';
import { JwtCustomService } from './jwt.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  providers: [JwtCustomService],
  exports: [JwtCustomService],
})
export class CustomJwtModule {}
