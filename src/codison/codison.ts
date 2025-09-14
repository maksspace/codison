import { filter, lastValueFrom } from 'rxjs';

import { Agent } from '@/agent';
import { History } from '@/history';
import { OpenAIProvider, GeminiProvider, Provider } from '@/provider';
import { availableTools, Tool } from '@/tools';
import { Channel } from '@/channel/channel';
import { SYSTEM_PROMPT } from '@/prompt';

export interface CodisonOptions {
  instructions?: string;
  workingDir?: string;
  tools?: Tool[];
}

export interface CodisonRunInteractiveOptions {
  prompt: string;
}

export interface CodisonRunNonInteractiveOptions {
  prompt: string;
  schema?: unknown;
}

export class Codison {
  private readonly workingDir: string;
  private readonly agent: Agent;
  private readonly history: History;
  private readonly channel: Channel;
  private readonly provider: Provider;

  constructor(options: CodisonOptions = {}) {
    this.workingDir = options.workingDir || process.cwd();
    this.history = new History();

    const tools = options.tools
      ? [...availableTools, ...options.tools]
      : availableTools;

    this.provider = this.createProvider(tools);
    this.agent = new Agent({
      provider: this.provider,
      history: this.history,
      tools,
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

  private createProvider(tools: Tool[]) {
    let provider: Provider;

    if (process.env['OPENAI_API_KEY']) {
      provider = new OpenAIProvider({
        apiKey: process.env['OPENAI_API_KEY'],
        tools,
        systemPrompt: SYSTEM_PROMPT(this.workingDir),
      });
    } else if (process.env['GEMINI_API_KEY']) {
      provider = new GeminiProvider({
        apiKey: process.env['GEMINI_API_KEY'],
        tools,
        systemPrompt: SYSTEM_PROMPT(this.workingDir),
      });
    } else {
      throw new Error('Model api key not found in env.');
    }

    return provider;
  }

  async runNonInteractive(options: CodisonRunNonInteractiveOptions) {
    const events = this.agent.run({
      prompt: options.prompt,
    });

    const textResponse = await lastValueFrom(
      events.pipe(filter((e) => e.type === 'fullText')),
    );

    if (!textResponse) {
      throw new Error('Failed to generate model response.');
    }

    if (options.schema) {
      this.history.addMessage({
        role: 'user',
        content: 'Reply using following schema',
      });

      return await this.provider.createResponse({
        messages: this.history.getMessages(),
        schema: options.schema,
      });
    }

    return textResponse.content;
  }

  runInteractive(options: CodisonRunInteractiveOptions) {
    return this.agent.run(options);
  }

  getOutputChannel() {
    return this.channel;
  }
}
