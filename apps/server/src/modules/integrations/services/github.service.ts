import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '@/mongodb/schemas/user.schema';
import appConfig from '@/common/config/app.config';
import { AuthorizationCode } from 'simple-oauth2';
import { TOKEN_STRING } from '@/utils/utils';
import { ApiResDTO } from '@/dtos/api.response.dto';
import axios from 'axios';

@Injectable()
export class GitHubConnectService {
  private readonly logger = new Logger(GitHubConnectService.name);
  private readonly githubOAuth: AuthorizationCode<'client_id'>;

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    const config = appConfig();

    this.githubOAuth = new AuthorizationCode({
      client: {
        id: config.GITHUB_CLIENT_ID!,
        secret: config.GITHUB_CLIENT_SECRET!,
      },
      auth: {
        tokenHost: 'https://github.com',
        tokenPath: '/login/oauth/access_token',
        authorizePath: '/login/oauth/authorize',
      },
    });
  }

  getGitHubOauthUrl(userId: string): string {
    const authorizationUri = this.githubOAuth.authorizeURL({
      redirect_uri: appConfig().GITHUB_REDIRECT_URI,
      scope: 'repo',
      state: userId,
    });

    return authorizationUri;
  }

  async oauthCallback(code: string, state: string) {
    if (!code || !state) {
      throw new BadRequestException('Missing code or state');
    }

    const user = await this.userModel.findById(state);
    if (!user) {
      throw new BadRequestException('Invalid user state');
    }

    if (user.tokens.some((t) => t.provider === 'github')) {
      return { success: true, message: 'GitHub already connected' };
    }

    try {
      const result = await this.githubOAuth.getToken({
        code,
        redirect_uri: appConfig().GITHUB_REDIRECT_URI!,
      });

      const tokenData = result.token;

      const newToken = {
        provider: 'github' as const,
        accessToken: tokenData.access_token as string,
        refreshToken: undefined,
        expiryDate: undefined,
        isDisabled: false,
      };

      await this.userModel.updateOne(
        { _id: user._id },
        { $push: { tokens: newToken } },
      );

      this.logger.log(`GitHub connected for user: ${user.email}`);
      return { success: true, message: 'GitHub connected successfully!' };
    } catch (error: any) {
      this.logger.error('GitHub OAuth failed:', error.message);
      throw new BadRequestException(
        `GitHub connection failed: ${error.message || 'Unknown error'}`,
      );
    }
  }

  async getGitHubData(userId: string): Promise<ApiResDTO> {
    const user = await this.userModel
      .findById(userId)
      .select(TOKEN_STRING)
      .lean();

    if (!user) {
      return {
        status: 'success',
        data: { account: 'github', notifications: [], repos: [] },
        message: 'User not found',
      };
    }

    const github = user.tokens.find((t) => t.provider === 'gmail');
    if (!github || github.isDisabled) {
      return {
        status: 'success',
        data: { account: 'gmail', messages: [] },
        message: 'Gmail account disabled or not connected',
      };
    }

    try {
      const headers = {
        Authorization: `Bearer ${github.accessToken}`,
        'User-Agent': 'Brevpulse-App',
        Accept: 'application/vnd.github.v3+json',
      };

      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      const notifRes = await axios.get(
        `https://api.github.com/notifications?participating=true&per_page=100&since=${twoMonthsAgo.toISOString()}`,
        { headers },
      );

      const notifications = notifRes.data.map((n: any) => ({
        id: n.id,
        reason: n.reason,
        type: n.subject.type,
        title: n.subject.title,
        url: n.subject.url
          .replace('api.github.com/repos', 'github.com')
          .replace('/pulls/', '/pull/'),
        repo: n.repository.full_name,
        unread: n.unread,
        updated_at: n.updated_at,
      }));

      return {
        status: 'success',
        data: {
          account: 'github',
          notifications,
        },
        message: `${notifications.length} new GitHub notifications`,
      };
    } catch (error: any) {
      console.error('GitHub API Error:', error.response?.data || error.message);

      // If token expired/revoked → auto-disable
      if (error.response?.status === 401) {
        await this.userModel.updateOne(
          { _id: userId },
          { $set: { 'integrations.github.isDisabled': true } },
        );
      }

      return {
        status: 'error',
        data: { account: 'github', notifications: [], repos: [] },
        message:
          'GitHub API failed: ' +
          (error.response?.data?.message || 'Unknown error'),
      };
    }
  }
}
