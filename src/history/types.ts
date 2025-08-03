import { BaseMessage, HumanMessage } from '@langchain/core/messages';

// storing token usage and cost information for an LLM interaction
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUSD?: number;
  modelName?: string;
  providerName?: string;
}

// represents a complete turn in the conversation, from user input to agent's final response (including any intermediate tool calls and LLM steps)
export interface ConversationTurn {
  turnId: string;
  timestamp: Date;
  userMessage: HumanMessage;
  agentMessages: BaseMessage[];
  tokenUsage?: TokenUsage;
}
