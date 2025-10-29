import { DigestHistory } from '@/mongodb/schemas/digest.schema';
import { User, UserDocument } from '@/mongodb/schemas/user.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Model } from 'mongoose';

type Payload = {
  encrypted: Buffer;
  iv: Buffer;
  authTag: Buffer;
};

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getUserKey(userId: string): Promise<Buffer> {
    const user = await this.userModel
      .findById(userId)
      .select('encryptionKey')
      .lean();

    if (!user?.encryptionKey) {
      throw new Error('User encryption key missing');
    }
    const key =
      user.encryptionKey instanceof Buffer
        ? user.encryptionKey
        : (user.encryptionKey as any).buffer;

    return Buffer.from(key);
  }

  /** Encrypt any object → {ciphertext, iv, authTag} */
  async encrypt<T>(payload: T, userId: string): Promise<Payload> {
    const key = await this.getUserKey(userId);
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, key, iv);

    const json = JSON.stringify(payload);
    const encrypted = Buffer.concat([
      cipher.update(json, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return { encrypted, iv, authTag };
  }

  /** Decrypt → original object */
  async decrypt<T>(
    encrypted: Buffer,
    iv: Buffer,
    authTag: Buffer,
    userId: string,
  ): Promise<T> {
    const key = await this.getUserKey(userId);
    const decipher = createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    const json = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');

    return JSON.parse(json) as T;
  }

  decryptMany<T>(payloads: DigestHistory[], key: Buffer): T[] {
    if (!(key instanceof Buffer) || key.length !== 32) {
      throw new Error('Invalid AES key: must be a 32-byte Buffer');
    }

    return payloads.map((p) => {
      const decipher = createDecipheriv(this.algorithm, key, p.iv);
      decipher.setAuthTag(p.authTag);

      const json = Buffer.concat([
        decipher.update(p.content),
        decipher.final(),
      ]).toString('utf8');

      return JSON.parse(json) as T;
    });
  }
}
