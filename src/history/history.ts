import { ProviderMessage } from '@/provider';
import { ConversationTurn, TokenUsage } from './types';

export class History {
  private messages: ProviderMessage[];
  private conversationTurns: ConversationTurn[];

  private currentTurnTokenUsage: TokenUsage;
  private totalSessionTokenUsage: TokenUsage;

  constructor(
    initialMessages: ProviderMessage[] = [],
    initialTurns: ConversationTurn[] = [],
  ) {
    this.messages = initialMessages;
    this.conversationTurns = initialTurns;
    this.currentTurnTokenUsage = this.getEmptyTokenUsage();
    this.totalSessionTokenUsage = this.getEmptyTokenUsage();
  }

  private getEmptyTokenUsage(): TokenUsage {
    return {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costUSD: 0,
      modelName: undefined,
      providerName: undefined,
    };
  }

  addMessage(message: ProviderMessage): void {
    this.messages.push(message);
  }

  getMessages(): ProviderMessage[] {
    return [...this.messages];
  }

  addConversationTurn(turn: ConversationTurn): void {
    this.conversationTurns.push(turn);
  }

  getConversationTurns(): ConversationTurn[] {
    return [...this.conversationTurns];
  }

  resetCurrentTurnTokenUsage(): void {
    this.currentTurnTokenUsage = this.getEmptyTokenUsage();
  }

  accumulateTokenUsage(usage: TokenUsage): void {
    this.currentTurnTokenUsage.promptTokens += usage.promptTokens;
    this.currentTurnTokenUsage.completionTokens += usage.completionTokens;
    this.currentTurnTokenUsage.totalTokens += usage.totalTokens;
    this.currentTurnTokenUsage.costUSD =
      (this.currentTurnTokenUsage.costUSD || 0) + (usage.costUSD || 0);

    if (usage.modelName) this.currentTurnTokenUsage.modelName = usage.modelName;
    if (usage.providerName)
      this.currentTurnTokenUsage.providerName = usage.providerName;

    this.totalSessionTokenUsage.promptTokens += usage.promptTokens;
    this.totalSessionTokenUsage.completionTokens += usage.completionTokens;
    this.totalSessionTokenUsage.totalTokens += usage.totalTokens;
    this.totalSessionTokenUsage.costUSD =
      (this.totalSessionTokenUsage.costUSD || 0) + (usage.costUSD || 0);

    if (usage.modelName && !this.totalSessionTokenUsage.modelName)
      this.totalSessionTokenUsage.modelName = usage.modelName;
    if (usage.providerName && !this.totalSessionTokenUsage.providerName)
      this.totalSessionTokenUsage.providerName = usage.providerName;
  }

  getCurrentTurnTokenUsage(): TokenUsage {
    return { ...this.currentTurnTokenUsage };
  }

  getOverallSessionTokenUsage(): TokenUsage {
    return { ...this.totalSessionTokenUsage };
  }

  clear(): void {
    this.messages = [];
    this.conversationTurns = [];
    this.currentTurnTokenUsage = this.getEmptyTokenUsage();
    this.totalSessionTokenUsage = this.getEmptyTokenUsage();
  }
}
