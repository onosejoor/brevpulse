import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiResDTO } from 'src/dtos/api.response.dto';
import { User, UserDocument } from 'src/mongodb/schemas/user.schema';

type TokenInput = {
  provider: 'google' | 'outlook' | 'slack' | 'github' | 'figma';
  accessToken: string;
  refreshToken?: string;
};

@Injectable()
export class UserTokenService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async addToken(userId: string, token: TokenInput): Promise<ApiResDTO> {
    const user = await this.userModel.findById(userId).select('+tokens');
    if (!user) throw new NotFoundException('User not found');

    const exists = user.tokens.some((t) => t.provider === token.provider);
    if (exists) {
      return { status: 'error', message: 'Provider already connected' };
    }

    user.tokens.push(token);
    await user.save();

    return { status: 'success', message: 'Token added' };
  }

  async removeToken(
    userId: string,
    provider: TokenInput['provider'],
  ): Promise<ApiResDTO> {
    const res = await this.userModel.updateOne(
      { _id: userId },
      { $pull: { tokens: { provider } } },
    );

    if (res.matchedCount === 0) throw new NotFoundException('User not found');
    if (res.modifiedCount === 0) {
      return { status: 'error', message: 'Provider token not found' };
    }

    return { status: 'success', message: 'Token removed' };
  }

  async updateToken(
    userId: string,
    provider: TokenInput['provider'],
    payload: Partial<Pick<TokenInput, 'accessToken' | 'refreshToken'>>,
  ): Promise<ApiResDTO> {
    const update = {
      ...(payload.accessToken && {
        'tokens.$.accessToken': payload.accessToken,
      }),
      ...(payload.refreshToken && {
        'tokens.$.refreshToken': payload.refreshToken,
      }),
    };

    const res = await this.userModel.updateOne(
      { _id: userId, 'tokens.provider': provider },
      { $set: update },
    );

    if (res.matchedCount === 0) throw new NotFoundException('User not found');
    if (res.modifiedCount === 0) {
      return {
        status: 'error',
        message: 'Provider token not found or no changes',
      };
    }

    return { status: 'success', message: 'Token updated' };
  }
}
