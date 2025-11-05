import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OAuth2Client } from 'google-auth-library';
import { Model } from 'mongoose';
import { User, UserDocument, UserToken } from 'src/mongodb/schemas/user.schema';
import { UserTokenService } from '@/modules/users/common/user-token.service';
import { ApiResDTO } from '@/dtos/api.response.dto';
import { google } from 'googleapis';
import { RedisService } from '@/modules/redis/redis.service';
import appConfig from '@/common/config/app.config';
import { TOKEN_STRING } from '@/utils/utils';

type GmailRes = {
  account: UserToken['provider'];
  messages: {
    id: string | null | undefined;
    subject: string;
    from: string;
    date: string;
    snippet: string | null | undefined;
  }[];
};

@Injectable()
export class GmailConnectService {
  private oauth2Client: OAuth2Client;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private redisService: RedisService,
    private userTokenService: UserTokenService,
  ) {
    const config = appConfig();
    this.oauth2Client = new OAuth2Client({
      clientId: config.G_CLIENT_ID,
      clientSecret: config.G_CLIENT_SECRET,
      redirectUri: config.GMAIL_REDIRECT_URI,
    });
  }

  getGmailOauthUrl(userId: string) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      prompt: 'consent',
      state: userId,
    });
  }

  async oauthCallback(code: string, state: string): Promise<ApiResDTO> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      const userId = state;
      if (!userId) throw new BadRequestException('User not identified');

      const user = await this.userModel
        .findById(userId)
        .select('tokens')
        .exec();
      if (!user) throw new BadRequestException('User not found');

      const existingToken = user.tokens.find((t) => t.provider === 'gmail');
      const expiryDate = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : null;

      if (existingToken) {
        await this.userTokenService.updateToken(userId, existingToken._id, {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token,
          expiryDate: expiryDate,
        } as Partial<UserToken>);
      } else {
        await this.userTokenService.addToken(userId, {
          provider: 'gmail',
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token,
          expiryDate: expiryDate,
        } as UserToken);
      }

      await this.redisService.delete(`user:${userId}`);

      return { status: 'success', message: 'Gmail connected' };
    } catch (error) {
      console.error('OAuth Callback Error:', error);
      throw new BadRequestException(
        'Failed to connect Gmail: ' + error.message,
      );
    }
  }

  async getGmailData(userId: string): Promise<ApiResDTO<GmailRes>> {
    const user = await this.userModel
      .findById(userId)
      .select(TOKEN_STRING)
      .lean();

    if (!user) {
      return {
        status: 'success',
        data: { account: 'gmail', messages: [] },
        message: 'User not found',
      };
    }

    const gmailToken = user.tokens.find((t) => t.provider === 'gmail');
    if (!gmailToken || gmailToken.isDisabled) {
      return {
        status: 'success',
        data: { account: 'gmail', messages: [] },
        message: 'Gmail account disabled or not connected',
      };
    }

    // Set credentials
    this.oauth2Client.setCredentials({
      access_token: gmailToken.accessToken,
      refresh_token: gmailToken.refreshToken,
    });

    // Refresh if needed
    await this.userTokenService.ensureFreshToken(
      userId,
      gmailToken,
      this.oauth2Client,
    );

    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    const { data } = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread newer_than:1d',
      maxResults: 100,
    });

    const mailMessages = data.messages || [];

    const messages = await Promise.all(
      mailMessages.map(async (m) => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: m.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        });

        const headers = msg.data.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h) => h.name === name)?.value;

        return {
          id: m.id!,
          threadId: msg.data.threadId,
          subject: getHeader('Subject') || '(No Subject)',
          from: getHeader('From') || '(Unknown)',
          date: getHeader('Date') || new Date().toISOString(),
          snippet: msg.data.snippet || '',
        };
      }),
    );

    return {
      status: 'success',
      data: {
        account: 'gmail',
        messages,
      },
    };
  }
}
