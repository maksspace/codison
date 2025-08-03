export interface Tool {
  name: string;
  description: string;
  schema: Record<string, any>;
  execute(args: Record<string, any>): Promise<string>;
}
