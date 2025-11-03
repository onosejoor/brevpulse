import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OAuth2Client } from 'google-auth-library';
import { Model } from 'mongoose';
import { ApiResDTO } from 'src/dtos/api.response.dto';
import { User, UserDocument, UserToken } from 'src/mongodb/schemas/user.schema';

@Injectable()
export class UserTokenService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async addToken(
    userId: string,
    token: Partial<UserToken>,
  ): Promise<ApiResDTO> {
    const user = await this.userModel.findById(userId).select('+tokens');
    if (!user) throw new NotFoundException('User not found');

    const exists = user.tokens.some((t) => t.provider === token.provider);
    if (exists) {
      return { status: 'error', message: 'Provider already connected' };
    }

    const pushToken: Partial<UserToken> = {
      provider: token.provider as UserToken['provider'],
      accessToken: token.accessToken || '',
      refreshToken: token.refreshToken,
      expiryDate: token.expiryDate
        ? new Date(token.expiryDate as any)
        : undefined,
      isDisabled: false,
    };

    user.tokens.push(pushToken as UserToken);
    await user.save();

    return { status: 'success', message: 'Token added' };
  }

  async removeToken(userId: string, tokenId: string): Promise<ApiResDTO> {
    const res = await this.userModel.updateOne(
      { _id: userId },
      { $pull: { 'tokens._id': tokenId } },
    );

    if (res.matchedCount === 0) throw new NotFoundException('User not found');
    if (res.modifiedCount === 0) {
      return { status: 'error', message: 'Provider token not found' };
    }

    return { status: 'success', message: 'Token removed' };
  }

  async updateToken(
    userId: string,
    tokenId: UserToken['_id'] | string,
    payload: Partial<Omit<UserToken, 'provider'>>,
  ): Promise<ApiResDTO> {
    const update = {
      ...(payload.accessToken && {
        'tokens.$.accessToken': payload.accessToken,
      }),
      ...(payload.refreshToken && {
        'tokens.$.refreshToken': payload.refreshToken,
      }),
      ...(payload.expiryDate && {
        'tokens.$.expiryDate': payload.expiryDate,
      }),
      ...(typeof payload.isDisabled === 'boolean' && {
        'tokens.$.isDisabled': payload.isDisabled,
      }),
    };

    const res = await this.userModel.updateOne(
      { _id: userId, 'tokens._id': tokenId },
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

  async ensureFreshToken(
    userId: string,
    token: UserToken,
    oauth2Client: OAuth2Client,
  ): Promise<UserToken> {
    if (!token.expiryDate || new Date() < token.expiryDate) return token;

    if (!token.refreshToken)
      throw new BadRequestException(
        `Your ${token.provider} connection needs to be reauthorized. Please reconnect ${token.provider}.`,
      );

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      const updated: UserToken = {
        ...token,
        accessToken: credentials.access_token!,
        refreshToken: credentials.refresh_token || token.refreshToken,
        expiryDate: new Date(credentials.expiry_date!),
      };

      oauth2Client.setCredentials({
        access_token: updated.accessToken,
        refresh_token: updated.refreshToken,
      });

      await this.updateToken(userId, token._id, updated);
      return updated;
    } catch (err) {
      console.error(`${token.provider} token refresh failed:`, err.message);
      throw new Error(`${token.provider} token refresh failed`);
    }
  }
}
