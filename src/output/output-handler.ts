import { AgentEvent } from '@/agent/types';

export interface OutputHandler {
  handle(chunk: AgentEvent): void;
  handleError(error: unknown): void;
  handleComplete(): void;
}
