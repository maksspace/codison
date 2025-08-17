import { filter, lastValueFrom } from 'rxjs';

import { Agent } from '@/agent';
import { History } from '@/history';
import { OpenAIProvider, GeminiProvider, Provider } from '@/provider';
import { availableTools } from '@/tools';

export interface CodisonOptions {
  instructions?: string;
  workingDir?: string;
}

export interface CodisonRunOptions {
  prompt: string;
}

export class Codison {
  private readonly agent: Agent;
  private readonly history: History;
  protected readonly instructions?: string;

  constructor(options?: CodisonOptions) {
    let provider: Provider;

    if (process.env['OPENAI_API_KEY']) {
      provider = new OpenAIProvider({
        apiKey: process.env['OPENAI_API_KEY'],
        tools: availableTools,
      });
    } else if (process.env['GEMINI_API_KEY']) {
      provider = new GeminiProvider({
        apiKey: process.env['GEMINI_API_KEY'],
        tools: availableTools,
      });
    } else {
      throw new Error('Model api key not found in env.');
    }

    this.instructions = options?.instructions;
    this.history = new History();
    this.agent = new Agent({
      provider,
      history: this.history,
      tools: availableTools,
    });
  }

  async runNonInteractive(options: CodisonRunOptions) {
    if (this.instructions) {
      this.history.addMessage({
        role: 'user',
        content: this.instructions,
      });
    }

    const events = this.agent.run({
      prompt: options.prompt,
    });

    const textResponse = await lastValueFrom(
      events.pipe(filter((e) => e.type === 'fullText')),
    );

    if (!textResponse) {
      throw new Error('Failed to generate model response.');
    }

    return textResponse.content;
  }

  async run(options: CodisonRunOptions) {
    return this.agent.run(options);
  }
}
