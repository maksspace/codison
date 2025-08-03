import { Observable } from 'rxjs';

export interface TextEvent {
  type: 'text';
  content: string;
}

export interface FullTextEvent {
  type: 'fullText';
  content: string;
}

export interface ToolCallEvent {
  type: 'toolCall';
  name: string;
  args: Record<string, unknown>;
  callId: string;
}

export type ProviderEvent = TextEvent | FullTextEvent | ToolCallEvent;

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
  getModelName(): string;

  getName(): string;

  supportsPreviousResponseId(): boolean;

  stream(options: StreamOptions): Promise<Observable<ProviderEvent>>;
}
