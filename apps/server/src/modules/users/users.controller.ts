import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  Req,
  HttpCode,
  UseInterceptors,
  UploadedFile,
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

@Controller('user')
@UseGuards(AuthGuard)
@Throttle({ long: throttlerOptions.long })
export class UserController {
  constructor(
    private readonly userService: UserService,
    @InjectQueue('image-queue') private readonly imageQueue: Queue,
  ) {}

  @Get('me')
  @HttpCode(200)
  findOne(@Req() req: UserRequest) {
    const { user } = req;

    return this.userService.findOne(user.id);
  }

  @Patch('me')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('avatar', fileInterceptorOptions()))
  async update(
    @Req() req: UserRequest,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { user } = req;

    if (file) {
      await this.imageQueue.add('upload-avatar', {
        userId: user.id,
        fileBuffer: file.buffer.toString('base64'),
        fileName: file.originalname,
      });
    }

    return this.userService.update(user.id, updateUserDto);
  }
}
