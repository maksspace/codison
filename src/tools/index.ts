import { Tool } from './types';

import { ShellTool } from './shell';
import { ReadTool } from './read';
import { WriteTool } from './write';
import { SearchFilesTool } from './search-files';
import { LsTool } from './ls';
import { PatchTool } from './patch';
import { GetProjectInfoTool } from './get-project-info';
import { GetDependenciesTool } from './get-dependencies';
import { ReadManyTool } from './read-many';
import { MemoryTool } from './memory';

import { ReadSheetsNamesTool } from './excel/read-sheets-names';
import { ReadSheetTool } from './excel/read-sheet';

export const availableTools: Tool[] = [
  new ShellTool(),
  new WriteTool(),
  new ReadTool(),
  new SearchFilesTool(),
  new LsTool(),
  new PatchTool(),
  new GetDependenciesTool(),
  new GetProjectInfoTool(),
  new ReadManyTool(),
  new MemoryTool(),
  new ReadSheetsNamesTool(),
  new ReadSheetTool(),
];

export { Tool };
