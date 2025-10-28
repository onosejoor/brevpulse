import { AuthGuard } from '@/common/guards/auth.guard';
import { Controller, Get, HttpCode, Req, UseGuards } from '@nestjs/common';
import { DigestService } from './digest.service';

@Controller('digest')
export class DigestController {
  constructor(private digestService: DigestService) {}

  @Get('all')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  getAllConnectedProvidersDigest(@Req() req: UserRequest) {
    const { user } = req;
    return this.digestService.generateDigest(user.id);
  }

  @Get('with-ai')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  getDigestWithAi(@Req() req: UserRequest) {
    const { user } = req;
    return this.digestService.generateWithGemini(user);
  }

  @Get('with-ai-email')
  @HttpCode(200)
  getEmailDigest() {
    return this.digestService.handleDailyDigestCron();
  }
}
