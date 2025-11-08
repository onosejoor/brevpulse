import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '@/modules/redis/redis.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from '@/mongodb/schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationPaginationDto } from './dto/notification-pagination.dto';
import { ApiResDTO } from '@/dtos/api.response.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private readonly redisService: RedisService,
  ) {}

  private getUserNotificationsCacheKey(
    userId: string,
    page: number,
    limit: number,
  ): string {
    return `user:${userId}:notifications:page:${page}:limit:${limit}`;
  }

  private getUserUnreadCountCacheKey(userId: string): string {
    return `user:${userId}:notifications:unread-count`;
  }

  async create(
    userId: string,
    createNotificationDto: CreateNotificationDto,
  ): Promise<ApiResDTO> {
    const notification = new this.notificationModel({
      userId: new Types.ObjectId(userId),
      ...createNotificationDto,
    });
    await notification.save();

    await this.redisService.deleteByPattern(`user:${userId}:notifications:*`);

    return {
      status: 'success',
      message: 'Notification created successfully',
    };
  }

  async findAllForUser(
    userId: string,
    paginationDto: NotificationPaginationDto,
  ): Promise<ApiResDTO<Notification[]>> {
    const { page = 1, limit = 10 } = paginationDto;
    const cacheKey = this.getUserNotificationsCacheKey(userId, page, limit);

    const cachedNotifications =
      await this.redisService.getParsedData<ApiResDTO<Notification[]>>(
        cacheKey,
      );

    if (cachedNotifications) {
      return cachedNotifications;
    }

    const notifications = await this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    await this.redisService.set(cacheKey, JSON.stringify(notifications));

    return {
      status: 'success',
      data: notifications,
    };
  }

  async findOne(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel
      .findOne({ _id: notificationId, userId })
      .lean();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async update(
    notificationId: string,
    userId: string,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<ApiResDTO> {
    await this.notificationModel.updateOne(
      { _id: notificationId, userId },
      updateNotificationDto,
    );

    await this.redisService.deleteByPattern(`user:${userId}:notifications:*`);

    return {
      status: 'success',
      message: 'Notification updated successfully',
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = this.getUserUnreadCountCacheKey(userId);

    const cachedCount = await this.redisService.get(cacheKey);
    if (cachedCount) {
      return parseInt(cachedCount, 10);
    }

    const count = await this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false,
    });

    await this.redisService.set(cacheKey, count.toString()); // Cache for 5 minutes

    return count;
  }
}
