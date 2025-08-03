import { Tool } from './types';
export { Tool } from './types';

import { ShellTool } from './shell';
import { ReadTool } from './read';
import { WriteTool } from './write';
import { GrepTool } from './grep';

export const availableTools: Tool[] = [
  new ShellTool(),
  new WriteTool(),
  new ReadTool(),
  new GrepTool(),
];
