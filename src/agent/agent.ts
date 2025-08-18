import { lastValueFrom, Observable, tap } from 'rxjs';

import { Provider, ToolCallEvent } from '@/provider';
import { History } from '@/history';
import { Tool } from '@/tools';
import { AgentEvent, RunAgentOptions } from './types';

export interface AgentOptions {
  provider: Provider;
  history: History;
  tools?: Tool[];
  workingDir?: string;
  sessionId?: string;
}

export class Agent {
  private provider: Provider;
  private history: History;
  private tools: Map<string, Tool>;
  private sessionId: string;

  constructor(options: AgentOptions) {
    this.provider = options.provider;
    this.history = options.history;
    this.tools = new Map(options.tools.map((tool) => [tool.name, tool]));
    this.sessionId = options.sessionId;
  }

  public async run(options: RunAgentOptions): Promise<Observable<AgentEvent>> {
    await this.history.addMessage({ role: 'user', content: options.prompt });

    return new Observable<AgentEvent>((subscriber) => {
      const step = async (): Promise<void> => {
        const currentMessages = await this.history.getMessages();
        const stream$ = await this.provider.stream({
          messages: currentMessages,
        });

        const toolCalls: ToolCallEvent[] = [];

        await lastValueFrom(
          stream$.pipe(
            tap((event) => {
              if (event.type === 'startText') {
                subscriber.next({ type: 'startText', id: event.id });
              }
              if (event.type === 'partialText') {
                subscriber.next({
                  type: 'partialText',
                  content: event.content,
                });
              } else if (event.type === 'fullText') {
                subscriber.next({ type: 'fullText', content: event.content });
                this.history.addMessage({
                  role: 'assistant',
                  content: event.content,
                });
              } else if (event.type === 'endText') {
                subscriber.next({ type: 'endText', id: event.id });
              } else if (event.type === 'startTool') {
                subscriber.next({ type: 'startTool', callId: event.callId });
              } else if (event.type === 'beginToolCall') {
                subscriber.next({
                  type: 'beginToolCall',
                  name: event.name,
                  args: event.args,
                });
              } else if (event.type === 'toolCall') {
                subscriber.next({
                  type: 'toolCall',
                  name: event.name,
                  args: event.args,
                });
                this.history.addMessage({
                  type: 'toolCall',
                  callId: event.callId,
                  name: event.name,
                  args: event.args,
                });

                toolCalls.push(event);
              } else if (event.type === 'endTool') {
                subscriber.next({ type: 'endTool', callId: event.callId });
              }
            }),
          ),
        );

        if (!toolCalls.length) {
          subscriber.next({ type: 'done' });
          subscriber.complete();
          return;
        }

        await Promise.all(
          toolCalls.map(async (call) => {
            const tool = this.tools.get(call.name);
            if (!tool) {
              throw new Error(`Tool ${call.name} not found`);
            }

            const result = await tool.execute(call.args);
            subscriber.next({
              type: 'toolCallOutput',
              name: call.name,
              output: result,
            });
            await this.history.addMessage({
              type: 'toolCallOutput',
              name: call.name,
              callId: call.callId,
              output: result,
            });
          }),
        );

        await step();
      };

      step().catch((err) => {
        subscriber.error(err);
      });
    });
  }
}
