import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OAuth2Client } from 'google-auth-library';
import { Model } from 'mongoose';
import { User, UserDocument, UserToken } from 'src/mongodb/schemas/user.schema';
import { UserTokenService } from '@/modules/users/common/user-token.service';
import { ApiResDTO } from '@/dtos/api.response.dto';
import { google } from 'googleapis';
import { RedisService } from '@/modules/redis/redis.service';

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
    this.oauth2Client = new OAuth2Client({
      clientId: process.env.G_CLIENT_ID,
      clientSecret: process.env.G_CLIENT_SECRET,
      redirectUri: process.env.GMAIL_REDIRECT_URI,
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

      const existingIndex = user.tokens.findIndex(
        (t) => t.provider === 'gmail',
      );
      const expiryDate = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : null;

      if (existingIndex !== -1) {
        await this.userTokenService.updateToken(userId, 'gmail', {
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

  async getGmailData(userId: string): Promise<ApiResDTO> {
    const user = await this.userModel
      .findById(userId)
      .select('+tokens +tokens.accessToken +tokens.refreshToken');

    if (!user) throw new NotFoundException('User not found');

    const gmailToken = user.tokens.find((t) => t.provider === 'gmail');
    if (!gmailToken) {
      throw new BadRequestException('No Gmail account connected');
    }

    const results: GmailRes[] = [];

    this.oauth2Client.setCredentials({
      access_token: gmailToken.accessToken,
      refresh_token: gmailToken.refreshToken,
    });

    await this.ensureFreshToken(userId, gmailToken);

    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    const { data } = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread newer_than:2d',
      // maxResults: 10,
    });

    if (!data.messages || !data.messages.length) {
      return {
        status: 'success',
        data: [],
      };
    }

    const messages = await Promise.all(
      data.messages.map(async (m) => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: m.id!,
        });
        const headers = msg.data.payload?.headers || [];

        const subject =
          headers.find((h) => h.name === 'Subject')?.value || '(No Subject)';
        const from =
          headers.find((h) => h.name === 'From')?.value || '(Unknown Sender)';
        const date =
          headers.find((h) => h.name === 'Date')?.value || '(Unknown Date)';

        return {
          id: m.id,
          subject,
          from,
          date,
          snippet: msg.data.snippet,
        };
      }),
    );

    results.push({
      account: gmailToken.provider,
      messages: messages,
    });

    return {
      data: results,
      status: 'success',
    };
  }

  private async ensureFreshToken(
    userId: string,
    token: UserToken,
  ): Promise<UserToken> {
    if (!token.expiryDate || new Date() < token.expiryDate) return token;

    if (!token.refreshToken)
      throw new BadRequestException(
        'Your Gmail connection needs to be reauthorized. Please reconnect Gmail.',
      );

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      const updated: UserToken = {
        ...token,
        accessToken: credentials.access_token!,
        refreshToken: credentials.refresh_token || token.refreshToken,
        expiryDate: new Date(credentials.expiry_date!),
      };

      this.oauth2Client.setCredentials({
        access_token: updated.accessToken,
        refresh_token: updated.refreshToken,
      });

      await this.userTokenService.updateToken(userId, 'gmail', updated);
      return updated;
    } catch (err) {
      console.error('Gmail token refresh failed:', err.message);
      throw new Error('Gmail token refresh failed');
    }
  }
}
