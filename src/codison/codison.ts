import { filter, lastValueFrom } from 'rxjs';

import { Agent } from '@/agent';
import { History } from '@/history';
import { OpenAIProvider, GeminiProvider, Provider } from '@/provider';
import { availableTools } from '@/tools';
import { Channel } from '@/channel/channel';
import { SYSTEM_PROMPT } from '@/prompt';

export interface CodisonOptions {
  instructions?: string;
  workingDir?: string;
}

export interface CodisonRunOptions {
  prompt: string;
}

export class Codison {
  private readonly workingDir: string;
  private readonly agent: Agent;
  private readonly history: History;
  private readonly channel: Channel;

  constructor(options?: CodisonOptions) {
    this.workingDir = options.workingDir || process.cwd();
    this.history = new History();

    const provider = this.createProvider();
    this.agent = new Agent({
      provider,
      history: this.history,
      tools: availableTools,
      workingDir: options.workingDir,
    });

    this.channel = new Channel(this.agent);

    if (options.instructions) {
      this.history.addMessage({
        role: 'user',
        content: options.instructions,
      });
    }
  }

  private createProvider() {
    let provider: Provider;

    if (process.env['OPENAI_API_KEY']) {
      provider = new OpenAIProvider({
        apiKey: process.env['OPENAI_API_KEY'],
        tools: availableTools,
        systemPrompt: SYSTEM_PROMPT(this.workingDir),
      });
    } else if (process.env['GEMINI_API_KEY']) {
      provider = new GeminiProvider({
        apiKey: process.env['GEMINI_API_KEY'],
        tools: availableTools,
        systemPrompt: SYSTEM_PROMPT(this.workingDir),
      });
    } else {
      throw new Error('Model api key not found in env.');
    }

    return provider;
  }

  async run(options: CodisonRunOptions) {
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

  runInteractive(options: CodisonRunOptions) {
    return this.agent.run(options);
  }

  getOutputChannel() {
    return this.channel;
  }
}
