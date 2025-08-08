import { ShellTool } from './shell';
import { ReadTool } from './read';
import { WriteTool } from './write';
import { GrepTool } from './grep';
import { SearchTool } from './search';
import { Tool } from './types';

export const availableTools: Tool[] = [
  new ShellTool(),
  new WriteTool(),
  new ReadTool(),
  // new GrepTool(),
  new SearchTool(),
];
