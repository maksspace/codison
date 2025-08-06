import {
  Content,
  FunctionCallingConfigMode,
  FunctionDeclaration,
  GoogleGenAI,
} from '@google/genai';
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
      // previous messages
      const content: Content[] = [];
      let currentContent: Content | null = null;

      for (const message of options.messages) {
        if ('role' in message) {
          if (
            currentContent &&
            currentContent.role === (message.role === 'user' ? 'user' : 'model')
          ) {
            currentContent.parts.push({ text: message.content });
          } else {
            currentContent = {
              parts: [{ text: message.content }],
              role: message.role === 'user' ? 'user' : 'model',
            };
            content.push(currentContent);
          }
        } else if (message.type === 'toolCall') {
          if (currentContent && currentContent.role === 'model') {
            currentContent.parts.push({
              functionCall: {
                args: message.args,
                id: message.callId,
                name: message.name,
              },
            });
          } else {
            currentContent = {
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
            content.push(currentContent);
          }
        } else if (message.type === 'toolCallOutput') {
          currentContent = {
            parts: [
              {
                functionResponse: {
                  id: message.callId,
                  name: message.name,
                  response: { output: message.output },
                },
              },
            ],
            role: 'function',
          };
          content.push(currentContent);
        }
      }

      const stream = await this.genAI.models.generateContentStream({
        model: this.modelName,
        contents: content,
        config: {
          tools: [{ functionDeclarations: this.tools }],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.AUTO,
            },
          },
          systemInstruction: SYSTEM_PROMPT.template,
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

              // logger.info('GENAI EVENT CHUNK:', chunk);

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
            }
            observer.complete();
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
