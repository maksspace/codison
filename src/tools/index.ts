import { ShellTool } from './shell';
import { ReadTool } from './read';
import { WriteTool } from './write';
import { SearchTool } from './search-files';
import { Tool } from './types';
import { LsTool } from './ls';
import { PatchTool } from './patch';
import { GetProjectInfoTool } from './get-project-info';
import { GetDependenciesTool } from './get-dependencies';

export const availableTools: Tool[] = [
  new ShellTool(),
  new WriteTool(),
  new ReadTool(),
  new SearchTool(),
  new LsTool(),
  new PatchTool(),
  new GetDependenciesTool(),
  new GetProjectInfoTool(),
];

export { Tool };
