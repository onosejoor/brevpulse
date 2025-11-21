import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from 'src/modules/mail/mail.service';
import { DigestService } from 'src/modules/digest/digest.service';
import { generateEmailHTML } from '@/modules/digest/common/email-digest-template';
import { NotificationService } from '@/modules/notification/notification.service';
import { Logger } from '@nestjs/common';

class JobData {
  type: string;
  data: any;
}

type UserPayload = AuthTokenPayload & {
  email: string;
};

@Processor('email-queue')
export class MailWorker extends WorkerHost {
  private readonly logger = new Logger(MailWorker.name);
  constructor(
    private readonly mailService: MailService,
    private readonly digestService: DigestService,
    private notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<JobData>) {
    const {
      data: { type, data },
      name,
    } = job;

    this.logger.log(
      `Processing job '${name}' with type '${type}' from email-queue.`,
    );

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
          }

          break;

        case 'send-digest':
          {
            this.logger.log(`Sending digest for user: ${data.user.id}`);
            const user: UserPayload = data.user;

            if (!user.email_verified) {
              this.logger.warn(
                `User ${user.id} email not verified, skipping digest.`,
              );
              return;
            }

            const generated = await this.digestService.generateWithGemini(user);

            const html = generateEmailHTML(generated);

            const { success, message } = await this.mailService.sendMail(
              user.email,
              'Your Daily Brevpulse Digest',
              html,
            );

            if (success) {
              this.logger.log(`Digest sent to ${user.email} (user ${user.id})`);

              await Promise.all([
                this.digestService.saveDigest(generated, user.id),
                this.notificationService.create(user.id, {
                  type: 'digest',
                  message: 'Your Daily Digest has been sent. check it out now',
                  title: 'New digest available',
                }),
              ]);
            } else {
              this.logger.error(
                `Error sending digest mail to ${user.email}: ${message}`,
              );
            }
          }

          break;

        default:
          this.logger.warn(`Job type '${type}' is unknown for job '${name}'.`);
          break;
      }
    } catch (error) {
      this.logger.error(`Error processing job '${name}':`, error.stack);
    }
  }
}
