import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/mongodb/schemas/user.schema';
import { Model } from 'mongoose';
import { omitObjKeyVal } from 'src/utils/utils';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private redisService: RedisService,
  ) {}

  async findOne(id: string) {
    const cacheKey = `users:${id}`;

    const cachedData = await this.redisService.getParsedData(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const user = await this.userModel.findById(id).select('+tokens').lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const synchedTokens = user.tokens.map((token) => token.provider);
    const newObj = omitObjKeyVal(user, ['tokens']);

    const responseData = {
      status: 'success',
      data: {
        ...newObj,
        synchedTokens,
      },
    };

    await this.redisService.set(cacheKey, JSON.stringify(responseData));

    return responseData;
  }

  async update(
    id: string,
    updateUserDto: Partial<Pick<User, 'avatar' | 'name'>>,
  ) {
    await this.userModel.updateOne({ _id: id }, updateUserDto);

    return { status: 'success', message: 'User updated successfully' };
  }
}
