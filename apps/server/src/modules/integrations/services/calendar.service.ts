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

type CalendarRes = {
  account: UserToken['provider'];
  events: {
    id: string | null | undefined;
    summary: string | null | undefined;
    description: string | null | undefined;
    start: string | null | undefined;
    end: string | null | undefined;
  }[];
};

@Injectable()
export class CalendarConnectService {
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
      redirectUri: config.CALENDAR_REDIRECT_URI,
    });
  }

  getCalenderOauthUrl(userId: string) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
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
        .lean();

      if (!user) {
        throw new BadRequestException('User not found!');
      }

      const existingToken = user.tokens.find((t) => t.provider === 'calendar');
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
          provider: 'calendar',
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token,
          expiryDate: expiryDate,
        } as UserToken);
      }

      await this.redisService.delete(`user:${userId}`);

      return { status: 'success', message: 'Calendar connected' };
    } catch (error) {
      console.error('OAuth Callback Error:', error);
      throw new BadRequestException(
        'Failed to connect Calendar: ' + error.message,
      );
    }
  }

  async getCalendarData(userId: string): Promise<ApiResDTO<CalendarRes>> {
    const user = await this.userModel.findById(userId).select(TOKEN_STRING);

    if (!user) {
      return {
        status: 'success',
        data: { account: 'calendar', events: [] },
        message: 'User not found',
      };
    }

    const calendarToken = user.tokens.find((t) => t.provider === 'calendar');
    if (!calendarToken || calendarToken.isDisabled) {
      return {
        status: 'success',
        data: { account: 'calendar', events: [] },
        message: 'Calendar not connected',
      };
    }

    this.oauth2Client.setCredentials({
      access_token: calendarToken.accessToken,
      refresh_token: calendarToken.refreshToken,
    });

    await this.userTokenService.ensureFreshToken(
      userId,
      calendarToken,
      this.oauth2Client,
    );

    const calendar = google.calendar({
      version: 'v3',
      auth: this.oauth2Client,
    });

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(
      now.getTime() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = res.data.items || [];

    // FILTER: Only events starting in next 7 days
    const upcomingEvents = events.filter((event) => {
      const start = event.start?.dateTime || event.start?.date;
      if (!start) return false;
      const eventDate = new Date(start);
      return eventDate >= now && eventDate <= new Date(timeMax);
    });

    const structuredEvents = upcomingEvents.map((event) => ({
      id: event.id!,
      summary: event.summary || '(No title)',
      description: event.description || '(No Description)',
      location: event.location || '(No Location)',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      recurrence: event.recurrence ? 'recurring' : 'one-time',
    }));

    return {
      status: 'success',
      data: {
        account: 'calendar',
        events: structuredEvents,
      },
    };
  }
}
