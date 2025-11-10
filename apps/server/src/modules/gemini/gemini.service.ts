import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  DIGEST_GENERATION_SYSTEM_PROMPT,
  DIGEST_GENERATION_USER_PROMPT,
} from './gemini.prompts';
import { GeminiInputs } from './types/gemini.type';
import { DigestPayload } from '@repo/shared-types/globals';
import { digestPayloadGenerativeSchema } from '../digest/common/digest.zod-schema';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async generateDigest(input: GeminiInputs): Promise<DigestPayload> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          responseSchema: digestPayloadGenerativeSchema,
        },
        systemInstruction: {
          role: 'user',
          parts: [{ text: DIGEST_GENERATION_SYSTEM_PROMPT }],
        },
      });

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${DIGEST_GENERATION_USER_PROMPT(input)}`,
              },
            ],
          },
        ],
      });

      const responseText = result.response.text();
      if (!responseText) {
        throw new InternalServerErrorException('No response from Gemini');
      }

      // Parse JSON (assuming Gemini returns valid JSON as per prompt)
      let digest: DigestPayload;
      try {
        digest = JSON.parse(responseText);
      } catch (parseError) {
        throw new BadRequestException(
          'Invalid JSON response from Gemini: ' + parseError.message,
        );
      }

      if (!digest.period || !digest.items || !digest.summary) {
        throw new BadRequestException('Malformed digest response');
      }

      return digest;
    } catch (error) {
      console.error('Gemini Error:', error);
      throw new BadRequestException(
        'Failed to generate digest: ' + error.message,
      );
    }
  }
}
