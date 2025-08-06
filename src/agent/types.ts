<<<<<<< HEAD
export interface AgentStartTextEvent {
  type: 'startText';
  id: string;
}

=======
>>>>>>> 723abbc (feat(CG-63): Events created and added to Gemini, resolved comments)
export interface AgentPartialTextEvent {
  type: 'partialText';
  content: string;
}

export interface AgentFullTextEvent {
  type: 'fullText';
  content: string;
}

export interface AgentEndTextEvent {
  type: 'endText';
  id: string;
}

export interface AgentStartToolEvent {
  type: 'startTool';
  callId: string;
}

export interface AgentBeginToolCall {
  type: 'beginToolCall';
  name: string;
  args: Record<string, unknown>;
}

export interface AgentToolCallEvent {
  type: 'toolCall';
  name: string;
  args: Record<string, unknown>;
}

export interface AgentToolCallOutputEvent {
  type: 'toolCallOutput';
  name: string;
  output: string;
}

export interface AgentEndToolEvent {
  type: 'endTool';
  callId: string;
}

export interface AgentErrorEvent {
  type: 'error';
  error: string;
}

export interface AgentDoneEvent {
  type: 'done';
}

export type AgentEvent =
<<<<<<< HEAD
  | AgentStartTextEvent
=======
>>>>>>> 723abbc (feat(CG-63): Events created and added to Gemini, resolved comments)
  | AgentPartialTextEvent
  | AgentFullTextEvent
  | AgentEndTextEvent
  | AgentStartToolEvent
  | AgentBeginToolCall
  | AgentToolCallEvent
  | AgentToolCallOutputEvent
  | AgentEndToolEvent
  | AgentErrorEvent
  | AgentDoneEvent;

export interface RunAgentOptions {
  prompt: string;
}
