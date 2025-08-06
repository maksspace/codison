import { lastValueFrom, Observable, tap } from 'rxjs';

import { Provider, ToolCallEvent } from '@/provider';
import { History } from '@/history';
import { Tool } from '@/tools';

import { AgentEvent, RunAgentOptions } from './types';

export interface AgentOptions {
  provider: Provider;
  history: History;
  tools: Tool[];
}

export class Agent {
  private provider: Provider;
  private history: History;
  private tools: Map<string, Tool>;

  constructor(options: AgentOptions) {
    this.provider = options.provider;
    this.history = options.history;
    this.tools = new Map(options.tools.map((tool) => [tool.name, tool]));
  }

  public run(options: RunAgentOptions): Observable<AgentEvent> {
    this.history.addMessage({ role: 'user', content: options.query });

    return new Observable<AgentEvent>((subscriber) => {
      const step = async (): Promise<void> => {
        const messages = this.history.getMessages();
        const stream$ = await this.provider.stream({ messages });

        const toolCalls: ToolCallEvent[] = [];

        await lastValueFrom(
          stream$.pipe(
            tap((event) => {
              if (event.type === 'text') {
                subscriber.next({ type: 'text', content: event.content });
              } else if (event.type === 'fullText') {
                subscriber.next({ type: 'fullText', content: event.content });
                this.history.addMessage({
                  role: 'assistant',
                  content: event.content,
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
            this.history.addMessage({
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
