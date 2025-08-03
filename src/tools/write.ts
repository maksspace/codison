import { Tool } from './types';
import * as path from 'path';
import { promises as fs } from 'fs';
import { logger } from '../logger';

export class WriteTool implements Tool {
  name = 'write';
  description = 'Writes to a specified file.';
  schema = {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'The path to the file to write.',
      },
      content: {
        type: 'string',
        description: 'The content to write to the file.',
      },
    },
    required: ['filePath', 'content'],
    additionalProperties: false,
  };

  async execute(args: { filePath: string; content: string }): Promise<string> {
    logger.info(
      `[FileWriter] Writing to file: "${args.filePath}" with content: "${args.content.substring(0, 50)}..."`,
    );
    try {
      const absolutePath = path.resolve(args.filePath);
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, args.content, { encoding: 'utf8' });
      return `Successfully wrote to file: '${args.filePath}'`;
    } catch (error: any) {
      console.error(`Error writing to file ${args.filePath}:`, error);
      return `Error: Could not write to file '${args.filePath}'. ${error.message}`;
    }
  }
}
