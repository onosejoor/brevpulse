import { AuthGuard } from '@/common/guards/auth.guard';
import { Controller, Get, HttpCode, Req, UseGuards } from '@nestjs/common';
import { DigestService } from './digest.service';

@Controller('digest')
@UseGuards(AuthGuard)
export class DigestController {
  constructor(private digestService: DigestService) {}

  @Get('all')
  @HttpCode(200)
  getAllConnectedProvidersDigest(@Req() req: UserRequest) {
    const { user } = req;
    return this.digestService.generateDigest(user.id);
  }
}
