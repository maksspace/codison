import { Content, FunctionDeclaration, GoogleGenAI, Part } from '@google/genai';
import { v4 as uuid } from 'uuid';
import { Observable } from 'rxjs';

import { Tool } from '@/tools';
import { SYSTEM_PROMPT } from '@/prompt';
import { logger } from '@/logger';

<<<<<<< HEAD
import { Provider, ProviderEvent, StreamOptions } from './provider';

export interface CreateGeminiProviderOptions {
  apiKey: string;
  tools: Tool[];
}
=======
const MODEL_NAME = 'gemini-2.0-flash-001'; // 'gemini-1.5-flash', 'gemini-2.0-flash-001'
const PROVIDER_NAME = 'google';
>>>>>>> 723abbc (feat(CG-63): Events created and added to Gemini, resolved comments)

export class GeminiProvider implements Provider {
  private genAI: GoogleGenAI;
  private tools: FunctionDeclaration[];

<<<<<<< HEAD
  constructor(options: CreateGeminiProviderOptions) {
    this.genAI = new GoogleGenAI({ apiKey: options.apiKey });
    this.tools = options.tools?.map((tool) => ({
=======
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set.');
    }

    this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    this.tools = availableTools.map((tool) => ({
>>>>>>> 723abbc (feat(CG-63): Events created and added to Gemini, resolved comments)
      name: tool.name,
      description: tool.description,
      parameters: tool.schema,
    }));
  }

  async stream(options: StreamOptions) {
    try {
      const content: Content[] = [];
<<<<<<< HEAD
      let prevMessage: Content;
=======
      let currentContent: Content;
>>>>>>> 723abbc (feat(CG-63): Events created and added to Gemini, resolved comments)

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
<<<<<<< HEAD
        model: 'gemini-2.0-flash-001',
=======
        model: MODEL_NAME,
>>>>>>> 723abbc (feat(CG-63): Events created and added to Gemini, resolved comments)
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

        (async () => {
          try {
            for await (const chunk of stream) {
              if (cancelled) break;

              logger.info('GENAI EVENT CHUNK:', JSON.stringify(chunk, null, 2));

              if (!responseId) {
                responseId = chunk.responseId;
                observer.next({ type: 'startText', id: responseId });
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
                    type: 'startTool',
                    name: part.functionCall.name,
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
                  observer.next({
                    type: 'endTool',
                    callId: part.functionCall.id,
                  });
                }
              }
            }
            if (fullText) {
              observer.next({ type: 'fullText', content: fullText });
              observer.next({ type: 'endText', id: responseId });
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
