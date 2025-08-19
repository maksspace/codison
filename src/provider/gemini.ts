import { Content, FunctionDeclaration, GoogleGenAI, Part } from '@google/genai';
import { v4 as uuid } from 'uuid';
import { Observable } from 'rxjs';

import { SYSTEM_PROMPT } from '@/prompt';
import { logger } from '@/logger';

import {
  PRICING_MODEL,
  Provider,
  ProviderEvent,
  StreamOptions,
  Usage,
} from './provider';
import { Tool } from '@/tools';

export interface CreateGeminiProviderOptions {
  apiKey: string;
  tools: Tool[];
}

export class GeminiProvider implements Provider {
  private genAI: GoogleGenAI;
  private tools: FunctionDeclaration[];

  constructor(options: CreateGeminiProviderOptions) {
    this.genAI = new GoogleGenAI({ apiKey: options.apiKey });
    this.tools = options.tools?.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.schema,
    }));
  }

  async stream(options: StreamOptions) {
    try {
      const content: Content[] = [];
      let prevMessage: Content;

      for (const message of options.messages) {
        let newMessageRole: string;
        let newMessagePart: Part;

        if ('role' in message) {
          newMessageRole = message.role === 'user' ? 'user' : 'model';
          newMessagePart = { text: message.content };
        } else if (message.type === 'toolCall') {
          newMessageRole = 'model';
          newMessagePart = {
            functionCall: {
              args: message.args,
              id: message.callId,
              name: message.name,
            },
          };
        } else {
          newMessageRole = 'function';
          newMessagePart = {
            functionResponse: {
              id: message.callId,
              name: message.name,
              response: { output: message.output },
            },
          };
        }

        if (prevMessage && prevMessage.role === newMessageRole) {
          prevMessage.parts.push(newMessagePart);
        } else {
          const newMessage = {
            parts: [newMessagePart],
            role: newMessageRole,
          };
          content.push(newMessage);
          prevMessage = newMessage;
        }
      }

      const stream = await this.genAI.models.generateContentStream({
        model: 'gemini-2.0-flash-001',
        contents: content,
        config: {
          tools: [{ functionDeclarations: this.tools }],
          systemInstruction: SYSTEM_PROMPT,
        },
      });

      const response = new Observable<ProviderEvent>((observer) => {
        let cancelled = false;
        let fullText = '';
        let responseId: string;
        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        (async () => {
          try {
            for await (const chunk of stream) {
              if (cancelled) break;

              logger.info('GENAI EVENT CHUNK:', JSON.stringify(chunk, null, 2));

              if (!responseId) {
                responseId = chunk.responseId;
                observer.next({ type: 'startText', id: responseId });
              }

              if (chunk.usageMetadata) {
                totalInputTokens += chunk.usageMetadata.promptTokenCount || 0;
                totalOutputTokens +=
                  chunk.usageMetadata.candidatesTokenCount || 0;
              }

              const candidate = chunk.candidates?.[0];

              for (const part of candidate.content.parts) {
                if (part.text) {
                  observer.next({ type: 'partialText', content: part.text });
                  fullText += part.text;
                } else if (part.functionCall) {
                  const newCallId = uuid();
                  part.functionCall.id = newCallId;

                  observer.next({
                    type: 'startTool',
                    callId: newCallId,
                  });
                  observer.next({
                    type: 'beginToolCall',
                    name: part.functionCall.name,
                    args: part.functionCall.args,
                  });
                  observer.next({
                    type: 'toolCall',
                    name: part.functionCall.name,
                    args: part.functionCall.args,
                    callId: newCallId,
                  });
                  observer.next({
                    type: 'endTool',
                    callId: newCallId,
                  });
                }
              }
            }

            const totalTokens = totalInputTokens + totalOutputTokens;
            const modelPricing = PRICING_MODEL['gemini-2.0-flash-001'];
            const cost =
              (totalInputTokens / 1000) * modelPricing.promptPerThousandTokens +
              (totalOutputTokens / 1000) *
                modelPricing.completionPerThousandTokens;

            const usage: Usage = {
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              totalTokens: totalTokens,
              cost: cost,
            };

            if (fullText) {
              observer.next({ type: 'fullText', content: fullText });
              observer.next({
                type: 'endText',
                id: responseId,
                usage: { ...usage },
              });
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
