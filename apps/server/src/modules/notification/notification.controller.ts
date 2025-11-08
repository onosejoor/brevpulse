import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationPaginationDto } from './dto/notification-pagination.dto';
import { ApiResDTO } from '@/dtos/api.response.dto';
import { Notification } from '@/mongodb/schemas/notification.schema';

@Controller('notification')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @HttpCode(201)
  async create(
    @Req() req: UserRequest,
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    return this.notificationService.create(req.user.id, createNotificationDto);
  }

  @Get()
  @HttpCode(200)
  async findAllForUser(
    @Req() req: UserRequest,
    @Query() paginationDto: NotificationPaginationDto,
  ) {
    return this.notificationService.findAllForUser(req.user.id, paginationDto);
  }

  @Patch(':id/read')
  @HttpCode(200)
  async markAsRead(
    @Req() req: UserRequest,
    @Param('id') notificationId: string,
  ) {
    const updatedNotification = await this.notificationService.update(
      notificationId,
      req.user.id,
      { read: true },
    );
    return { status: 'success', data: updatedNotification };
  }

  @Get('unread-count')
  @HttpCode(200)
  async getUnreadCount(@Req() req: UserRequest): Promise<ApiResDTO<number>> {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { status: 'success', data: count };
  }
}
