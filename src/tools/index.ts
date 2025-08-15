import { ShellTool } from './shell';
import { ReadTool } from './read';
import { WriteTool } from './write';
import { SearchTool } from './search-files';
import { Tool } from './types';
import { LsTool } from './ls';
import { PatchTool } from './patch';
import { GetDependeciesTool } from './get-dependecies';
import { GetProjectInfoTool } from './get-project-info';

export const availableTools: Tool[] = [
  new ShellTool(),
  new WriteTool(),
  new ReadTool(),
  new SearchTool(),
  new LsTool(),
  new PatchTool(),
  new GetDependeciesTool(),
  new GetProjectInfoTool(),
];

export { Tool };
