import { Subscription } from 'rxjs';

import { AgentEvent } from '@/agent/types';
import { Channel } from '@/channel/channel';
import { OutputHandler } from './output-handler';

export class ConsoleOutputHandler implements OutputHandler {
  private sub: Subscription;

  constructor(channel: Channel) {
    this.sub = channel.output$.subscribe({
      next: (chunk) => this.handle(chunk),
      error: (err) => this.handleError(err),
      complete: () => this.handleComplete(),
    });
  }

  handle(event: AgentEvent): void {
    switch (event.type) {
      case 'partialText': {
        process.stdout.write(event.content);
        break;
      }

      case 'startTool': {
        process.stdout.write(`\n[Start Tool ${event.callId}]\n`);
        break;
      }

      case 'beginToolCall': {
        process.stdout.write(
          `\n[Begin Tool call: ${event.name}] ${JSON.stringify(event.args)}\n`,
        );
        break;
      }

      case 'toolCall': {
        process.stdout.write(
          `\n[Tool Requested: ${event.name}] ${JSON.stringify(event.args)}\n`,
        );
        break;
      }

      case 'endTool': {
        process.stdout.write(`\n[End Tool ${event.callId}]\n`);
        break;
      }

      case 'done':
        process.stdout.write('\n');
        break;

      case 'error':
        process.stderr.write(`\n[ERROR]: ${event.error}\n\n`);
        break;
    }
  }

  handleError(error: any): void {
    process.stderr.write(
      `\n[STREAM ERROR]: ${error.content || error.message || error}\n\n`,
    );
  }

  handleComplete(): void {
    process.stdout.write('\n\n');
  }

  stop() {
    this.sub.unsubscribe();
  }
}
