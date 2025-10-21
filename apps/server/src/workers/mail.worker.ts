import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from 'src/modules/mail/mail.service';

class JobData {
  type: string;
  data: {
    token: string;
    name: string;
    email: string;
  };
}

@Processor('email-queue')
export class MailWorker extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<JobData>) {
    const {
      data: { type, data },
      name,
    } = job;

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
          }

          break;

        default:
          console.log('Job type is unknown');
          break;
      }
    } catch (error) {
      console.log('Error processing job: ', error);
    }
  }
}
