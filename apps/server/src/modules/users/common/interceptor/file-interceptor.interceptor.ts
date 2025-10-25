import { UnsupportedMediaTypeException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export function fileInterceptorOptions(): MulterOptions {
  return {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/webp',
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(
          new UnsupportedMediaTypeException(
            'Invalid file type. Only JPEG, PNG, JPG, and WEBP are allowed.',
          ),
          false,
        );
      }
      cb(null, true);
    },
  };
}
