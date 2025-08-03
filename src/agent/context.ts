import { AgentContext } from './types';

export class Context {
  private contextData: AgentContext;

  constructor(initialContext: AgentContext = {}) {
    this.contextData = {
      os: initialContext.os || process.platform,
      currentDate:
        initialContext.currentDate || new Date().toISOString().split('T')[0],
      projectName: initialContext.projectName,
      workspaceLanguage: initialContext.workspaceLanguage,
      ...initialContext,
    };
  }

  public getContext(): AgentContext {
    return { ...this.contextData };
  }

  public updateContext(updates: Partial<AgentContext>): void {
    this.contextData = {
      ...this.contextData,
      ...updates,
    };
  }

  public toPromptString(): string {
    const parts: string[] = [];
    if (this.contextData.os) parts.push(`OS: ${this.contextData.os}`);
    if (this.contextData.projectName)
      parts.push(`Project: ${this.contextData.projectName}`);
    if (this.contextData.workspaceLanguage)
      parts.push(`Language: ${this.contextData.workspaceLanguage}`);
    if (this.contextData.currentDate)
      parts.push(`Current Date: ${this.contextData.currentDate}`);

    if (parts.length === 0) {
      return ''; // No context available
    }

    return `\n\nCurrent Environment Context\n${parts.join(', ')}\n\n`;
  }
}
