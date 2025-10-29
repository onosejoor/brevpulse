import { AuthGuard } from '@/common/guards/auth.guard';
import { Controller, Get, HttpCode, Req, UseGuards } from '@nestjs/common';
import { DigestService } from './digest.service';

@Controller('digests')
export class DigestController {
  constructor(private digestService: DigestService) {}

  @Get('all')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  getAllConnectedProvidersDigest(@Req() req: UserRequest) {
    const { user } = req;
    const { limit, page } = req.query as {
      limit: string;
      page: string;
    };

    return this.digestService.generateDigest(
      user.id,
      parseInt(limit),
      parseInt(page),
    );
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
