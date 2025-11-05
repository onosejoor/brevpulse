import appConfig from '@/common/config/app.config';
import { UserService } from '@/modules/users/users.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { v2 as cloudinary } from 'cloudinary';

class JobData {
  userId: string;
  fileBuffer: string;
  fileName: string;
}

@Processor('image-queue')
export class ImageWorker extends WorkerHost {
  constructor(private userService: UserService) {
    const appconf = appConfig();
    cloudinary.config({
      cloud_name: appconf.CLOUDINARY_CLOUD_NAME,
      api_key: appconf.CLOUDINARY_API_KEY,
      api_secret: appconf.CLOUDINARY_API_SECRET,
    });
    super();
  }

  async process(job: Job<JobData>): Promise<any> {
    const { userId, fileBuffer, fileName } = job.data;

    console.log(`Image Queue process recieved for file: ${fileName}`);

    const buffer = Buffer.from(fileBuffer, 'base64');
    const sanitizedFileName = fileName
      .replaceAll(' ', '_')
      .replace(/\.[^/.]+$/, '');

    try {
      const result: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'brevpulse/avatars',
            public_id: sanitizedFileName,
          },

          (error, result) => {
            if (error) {
              reject(error as Error);
              return;
            } else {
              resolve(result);
            }
          },
        );
        uploadStream.end(buffer);
      });

      await this.userService.update(userId, {
        avatar: result.secure_url,
      });
      console.log(`Avatar uploaded  for user ${userId}`);
      return result.secure_url;
    } catch (error) {
      console.error(
        `Avatar upload failed for user ${userId}`,
        error.stack || error.message,
      );
      throw error;
    }
  }
}
