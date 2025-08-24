import { AgentEvent } from '@/agent/types';

export interface OutputHandler {
  handle(event: AgentEvent): void;
  handleError(error: unknown): void;
  handleComplete(): void;
}
