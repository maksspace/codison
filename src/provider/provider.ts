import { Observable } from 'rxjs';

export interface StartTextEvent {
<<<<<<< HEAD
  type: 'startText';
=======
  type: 'start';
>>>>>>> 723abbc (feat(CG-63): Events created and added to Gemini, resolved comments)
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
}

export interface StartToolEvent {
  type: 'startTool';
<<<<<<< HEAD
  callId: string;
=======
  name: string;
>>>>>>> 723abbc (feat(CG-63): Events created and added to Gemini, resolved comments)
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
