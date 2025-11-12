import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  Param,
} from '@nestjs/common';
import { UserService } from './users.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { Throttle } from '@nestjs/throttler';
import { throttlerOptions } from '@/utils/utils';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { fileInterceptorOptions } from './common/interceptor/file-interceptor.interceptor';
import { type UpdateUserDto } from '@/dtos/update-user.dto';
import { UserTokenService } from './common/user-token.service';
import { UserToken } from '@/mongodb/schemas/user.schema';
import { User } from '@/common/decorators/user.decorator';

@Controller('user')
@UseGuards(AuthGuard)
@Throttle({ long: throttlerOptions.long })
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userTokenService: UserTokenService,
    @InjectQueue('image-queue') private readonly imageQueue: Queue,
  ) {}

  @Get('me')
  @HttpCode(200)
  findOne(@User() user: AuthTokenPayload) {
    return this.userService.findOne(user.id);
  }

  @Patch('me')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('avatar', fileInterceptorOptions()))
  async update(
    @User() user: AuthTokenPayload,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      await this.imageQueue.add('upload-avatar', {
        userId: user.id,
        subscription: user.subscription,
        fileBuffer: file.buffer.toString('base64'),
        fileName: file.originalname,
      });
    }

    return this.userService.update(user.id, user.subscription, updateUserDto);
  }

  @Patch('/tokens/:tokenId')
  @HttpCode(200)
  updateToken(
    @User() user: AuthTokenPayload,
    @Body() updateTokenDto: Partial<Omit<UserToken, 'provider'>>,
    @Param('tokenId') tokenId: string,
  ) {
    return this.userTokenService.updateToken(user.id, tokenId, updateTokenDto);
  }

  @Patch('/tokens/:tokenId')
  @HttpCode(200)
  deletToken(
    @User() user: AuthTokenPayload,
    @Param('tokenId') tokenId: string,
  ) {
    return this.userTokenService.removeToken(user.id, tokenId);
  }
}
