import { Content, FunctionDeclaration, GoogleGenAI } from '@google/genai';
import { Provider, ProviderEvent, StreamOptions } from './provider';
import { availableTools } from '@/tools';
import { SYSTEM_PROMPT } from '@/prompt';
import { Observable } from 'rxjs';
import { logger } from '@/logger';

//  TODO: change to choose model
const MODEL_NAME = 'gemini-2.0-flash-001'; // 'gemini-1.5-flash', 'gemini-2.0-flash-001'
const PROVIDER_NAME = 'google';

export class GeminiProvider implements Provider {
  private genAI: GoogleGenAI;
  private modelName: string;
  private tools: FunctionDeclaration[];

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.log('GEMINI_API_KEY environment variable is not set.');
    }

    this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    this.modelName = MODEL_NAME;
    this.tools = availableTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.schema,
    }));
  }

  getModelName(): string {
    return MODEL_NAME;
  }

  getName(): string {
    return PROVIDER_NAME;
  }

  supportsPreviousResponseId(): boolean {
    return false;
  }

  async stream(options: StreamOptions) {
    try {
      const prompt: Content[] = [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT.template }] },
      ];
      // previous messages
      const content: Content[] = options.messages.map((message) => {
        if ('role' in message) {
          return {
            parts: [{ text: message.content }],
            role: message.role === 'user' ? 'user' : 'model',
          };
        } else if (message.type === 'toolCall') {
          return {
            parts: [
              {
                functionCall: {
                  args: message.args,
                  id: message.callId,
                  name: message.name,
                },
              },
            ],
            role: 'model',
          };
        } else if (message.type === 'toolCallOutput') {
          return {
            parts: [
              {
                functionResponse: {
                  id: message.callId,
                  name: message.name,
                  response: { output: message.output },
                },
              },
            ],
            role: 'tool',
          };
        }
      }) as Content[];

      const stream = await this.genAI.models.generateContentStream({
        model: this.modelName,
        contents: [...prompt, ...content],
        config: {
          tools: [{ functionDeclarations: this.tools }],
        },
      }); // returns GenerateContentResponse

      const response = new Observable<ProviderEvent>((observer) => {
        let cancelled = false;
        let fullText = '';
        let responseId: string;

        (async () => {
          try {
            for await (const chunk of stream) {
              if (cancelled) break;

              logger.info('GENAI EVENT CHUNK:', chunk);

              if (!responseId) {
                responseId = chunk.responseId;
                observer.next({ type: 'start', id: responseId });
              }

              const candidate = chunk.candidates?.[0];

              for (const part of candidate.content.parts) {
                if (part.text) {
                  observer.next({ type: 'text', content: part.text });
                  fullText += part.text;
                } else if (part.functionCall) {
                  observer.next({
                    type: 'toolCall',
                    name: part.functionCall.name,
                    args: part.functionCall.args,
                    callId: part.functionCall.id,
                  });
                }
              }
            }
            if (fullText) {
              observer.next({ type: 'fullText', content: fullText });

              observer.complete();
            }
          } catch (err) {
            observer.error(err);
          }
        })();

        return () => {
          cancelled = true;
        };
      });

      return response;
    } catch (error) {
      logger.error('Error calling Google GenAI:', error);
      throw new Error(
        `Failed to generate response from Google GenAI: ${error}`,
      );
    }
  }
}
