export interface AgentPartialTextEvent {
  type: 'partialText';
  content: string;
}

export interface AgentFullTextEvent {
  type: 'fullText';
  content: string;
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

export interface AgentErrorEvent {
  type: 'error';
  error: string;
}

export interface AgentDoneEvent {
  type: 'done';
}

export type AgentEvent =
  | AgentPartialTextEvent
  | AgentFullTextEvent
  | AgentToolCallEvent
  | AgentToolCallOutputEvent
  | AgentErrorEvent
  | AgentDoneEvent;

export interface RunAgentOptions {
  query: string;
}

export interface AgentContext {
  os?: string;
  projectName?: string;
  workspaceLanguage?: string;
  currentDate?: string;
}
