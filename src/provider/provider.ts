import { Observable } from 'rxjs';

export interface StartTextEvent {
  type: 'startText';
  id: string;
}

export interface PartialTextEvent {
  type: 'partialText';
  content: string;
}

export interface FullTextEvent {
  type: 'fullText';
  content: string;
}

export interface EndTextEvent {
  type: 'endText';
  id: string;
  usage?: Usage;
}

export interface StartToolEvent {
  type: 'startTool';
  callId: string;
}

export interface BeginToolCall {
  type: 'beginToolCall';
  name: string;
  args: Record<string, unknown>;
}

export interface ToolCallEvent {
  type: 'toolCall';
  name: string;
  args: Record<string, unknown>;
  callId: string;
}

export interface EndToolEvent {
  type: 'endTool';
  callId: string;
  usage?: Usage;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

export type ProviderEvent =
  | StartTextEvent
  | PartialTextEvent
  | FullTextEvent
  | EndTextEvent
  | StartToolEvent
  | BeginToolCall
  | ToolCallEvent
  | EndToolEvent;

export interface UserMessage {
  role: 'user';
  content: string;
}

export interface AssistantMessage {
  role: 'assistant';
  content: string;
}

export interface ToolCallMessage {
  type: 'toolCall';
  name: string;
  args: Record<string, unknown>;
  callId: string;
}

export interface ToolCallOutputMessage {
  type: 'toolCallOutput';
  callId: string;
  output: string;
  name?: string; // added because of genAI
}

export type ProviderMessage =
  | UserMessage
  | AssistantMessage
  | ToolCallMessage
  | ToolCallOutputMessage;

export interface StreamOptions {
  messages: ProviderMessage[];
  previousResponseId?: string;
}

export interface Provider {
  stream(options: StreamOptions): Promise<Observable<ProviderEvent>>;
}

export const PRICING_MODEL = {
  'gpt-4.1-mini': {
    promptPerThousandTokens: 0.0001,
    completionPerThousandTokens: 0.0003,
  },
  'gemini-2.0-flash-001': {
    promptPerThousandTokens: 0.00005,
    completionPerThousandTokens: 0.00015,
  },
};
