import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Param,
  Query,
  Redirect,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GmailConnectService } from './services/gmail.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { UserToken } from '@/mongodb/schemas/user.schema';
import { CalendarConnectService } from './services/calendar.service';

@Controller('connect')
export class IntegrationsController {
  constructor(
    private gmailConnectService: GmailConnectService,
    private calenderConnectService: CalendarConnectService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('/oauth/:service')
  @Redirect('', 307)
  sendOauthUrl(@Req() req: UserRequest) {
    const { user } = req;
    const { service } = req.params as {
      service: UserToken['provider'];
    };

    let url: string;
    switch (service) {
      case 'calendar':
        url = this.calenderConnectService.getCalenderOauthUrl(user.id);
        break;
      case 'gmail':
        url = this.gmailConnectService.getGmailOauthUrl(user.id);
        break;
      default:
        throw new BadRequestException(
          'Service does not exist, or not available yet',
        );
    }

    return { url };
  }

  @Get('/callback/:service')
  @HttpCode(200)
  gmailConnectCallback(
    @Param('service') service: UserToken['provider'],
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    switch (service) {
      case 'calendar':
        return this.calenderConnectService.oauthCallback(code, state);
      case 'gmail':
        return this.gmailConnectService.oauthCallback(code, state);
      default:
        throw new BadRequestException(
          'Service does not exist, or not available yet',
        );
    }
  }
}
