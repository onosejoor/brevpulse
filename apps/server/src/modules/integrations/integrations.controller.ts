import {
  Controller,
  Get,
  HttpCode,
  Query,
  Redirect,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GmailConnectService } from './services/gmail.service';
import { AuthGuard } from '@/common/guards/auth.guard';

@Controller('connect')
export class IntegrationsController {
  constructor(private gmailConnectService: GmailConnectService) {}

  @UseGuards(AuthGuard)
  @Get('/oauth/gmail')
  @Redirect('', 307)
  sendOauthUrl(@Req() req: UserRequest) {
    const { user } = req;
    const oauthUrl = this.gmailConnectService.getGmailOauthUrl(user.id);
    return { url: oauthUrl };
  }

  @Get('/callback/gmail')
  @HttpCode(200)
  gmailConnectCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    return this.gmailConnectService.oauthCallback(code, state);
  }
}
