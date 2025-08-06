import { Observable } from 'rxjs';
import { OpenAI } from 'openai';
import {
  FunctionTool,
  ResponseCreateParams,
} from 'openai/resources/responses/responses';

import { SYSTEM_PROMPT } from '@/prompt';
import { availableTools } from '@/tools';
import { logger } from '@/logger';

import { ProviderEvent, Provider, StreamOptions } from './provider';

const MODEL_NAME = 'gpt-4o-mini';
const PROVIDER_NAME = 'openai';

export class OpenAIProvider implements Provider {
  private openai: OpenAI;
  private tools: FunctionTool[];

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.log('OPENAI_API_KEY environment variable is not set.');
    }

    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.tools = availableTools.map((tool) => ({
      type: 'function',
      name: tool.name,
      description: tool.description,
      parameters: tool.schema,
      strict: true,
    }));
  }

  async stream(options: StreamOptions) {
    try {
      const input: ResponseCreateParams['input'] = options.messages.map(
        (message) => {
          if ('role' in message) {
            return {
              role: message.role,
              content: message.content,
            };
          } else if (message.type === 'toolCall') {
            return {
              type: 'function_call',
              call_id: message.callId,
              name: message.name,
              arguments: JSON.stringify(message.args),
            };
          } else if (message.type === 'toolCallOutput') {
            return {
              type: 'function_call_output',
              call_id: message.callId,
              output: message.output,
            };
          }
        },
      );

      const stream = await this.openai.responses.create({
        model: MODEL_NAME,
        instructions: !options.previousResponseId
          ? SYSTEM_PROMPT.template
          : undefined,
        previous_response_id: options.previousResponseId,
        input,
        tools: this.tools,
        stream: true,
      });

      const output = new Observable<ProviderEvent>((observer) => {
        let cancelled = false;

        (async () => {
          try {
            for await (const event of stream) {
              if (cancelled) break;

              logger.info('OPENAI EVENT', event);

              switch (event.type) {
                case 'response.created':
                  observer.next({ type: 'start', id: event.response.id });
                  break;
                case 'response.output_text.delta':
                  observer.next({ type: 'partialText', content: event.delta });
                  break;
                case 'response.output_text.done':
                  observer.next({ type: 'fullText', content: event.text });
                  break;
                case 'response.output_item.done':
                  if (event.item.type === 'function_call') {
                    observer.next({
                      type: 'toolCall',
                      name: event.item.name,
                      args: JSON.parse(event.item.arguments),
                      callId: event.item.call_id,
                    });
                  }

                  break;
              }
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

      return output;
    } catch (error) {
      logger.error('Error calling OpenAI LLM (Responses API):', error);

      throw new Error(
        `Failed to generate response from OpenAI (Responses API): ${error}`,
      );
    }
  }
}
