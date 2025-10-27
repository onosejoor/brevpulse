import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
} from '@google/generative-ai';
import {
  DIGEST_GENERATION_SYSTEM_PROMPT,
  DIGEST_GENERATION_USER_PROMPT,
} from './gemini.prompts';
import { GeminiInputs } from './types/gemini.type';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async generateDigest(input: GeminiInputs): Promise<any> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-lite',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
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
      let digest;
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

  async callGeminiWithRetry(input: GeminiInputs, maxRetries: number = 3) {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        const response = await this.generateDigest(input);
        return response;
      } catch (error) {
        if (
          error instanceof GoogleGenerativeAIFetchError &&
          error.status === 503
        ) {
          attempts++;
          const delay = Math.pow(2, attempts) * 1000;
          console.log(
            `503 Error, retrying in ${delay}ms... (${attempts}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error; // Rethrow non-503 errors
        }
      }
    }
    throw new Error(
      `Failed after ${maxRetries} retries due to 503 Service Unavailable`,
    );
  }
}
