import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from 'src/modules/mail/mail.service';
import { DigestService } from 'src/modules/digest/digest.service';
import { generateEmailHTML } from '@/modules/digest/common/email-digest-template';

class JobData {
  type: string;
  data: any;
}

type UserPayload = AuthTokenPayload & {
  email: string;
};

@Processor('email-queue')
export class MailWorker extends WorkerHost {
  constructor(
    private readonly mailService: MailService,
    private readonly digestService: DigestService,
  ) {
    super();
  }

  async process(job: Job<JobData>) {
    const {
      data: { type, data },
      name,
    } = job;

    const now = Date.now();
    console.log(`Email Queue process recieved for job: ${name}`);

    try {
      switch (type) {
        case 'verification':
          {
            const verifyEmailTemplate =
              this.mailService.formatVerificationEmail(data.name, data.token);

            await this.mailService.sendMail(
              data.email,
              'Verify Your BrevPulse Email',
              verifyEmailTemplate,
            );

            console.log(`Job finished for email queue, type: ${type}`);
            console.log(`Job Time ${Date.now() - now}ms`);
          }

          break;

        case 'send-digest':
          {
            const user: UserPayload = data.user;

            const generated = await this.digestService.generateWithGemini(user);

            const html = generateEmailHTML(generated);

            await this.mailService.sendMail(
              user.email,
              'Your BrevPulse digest',
              html,
            );

            console.log(`Digest sent to ${user.email} (user ${user.id})`);
          }

          break;

        default:
          console.warn('Job type is unknown');
          break;
      }
      console.log(`Job Time ${Date.now() - now}ms`);
    } catch (error) {
      console.log('Error processing job: ', error);
    }
  }
}
