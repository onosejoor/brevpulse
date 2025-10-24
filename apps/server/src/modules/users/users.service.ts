import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/mongodb/schemas/user.schema';
import { Model } from 'mongoose';
import { omitObjKeyVal } from 'src/utils/utils';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('+tokens').lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const synchedTokens = user.tokens.map((token) => token.provider);
    const newObj = omitObjKeyVal(user, ['tokens']);

    return {
      ...newObj,
      synchedTokens,
    };
  }

  async update(
    id: string,
    updateUserDto: Partial<Pick<User, 'avatar' | 'name'>>,
  ) {
    await this.userModel.updateOne({ _id: id }, updateUserDto);

    return { status: 'success', message: 'User updated successfully' };
  }
}
