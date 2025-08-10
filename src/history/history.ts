import { ProviderMessage } from '@/provider';

export interface HistoryOptions {
  messages?: ProviderMessage[];
}

export class History {
  private messages: ProviderMessage[];

  constructor(options?: HistoryOptions) {
    this.messages = options?.messages ?? [];
  }

  addMessage(message: ProviderMessage): void {
    this.messages.push(message);
  }

  getMessages(): ProviderMessage[] {
    return this.messages;
  }
}
