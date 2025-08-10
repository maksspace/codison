import * as path from 'path';
import { promises as fs } from 'fs';
import { Tool } from './types';
import { logger } from '@/logger';

export class ReadTool implements Tool {
  name = 'read';
  description = 'Reads the content of a file from the filesystem';
  schema = {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute path to the file',
      },
    },
    required: ['path'],
    additionalProperties: false,
  };

  async execute(args: { filePath: string }): Promise<string> {
    logger.info(`[FileReader] Reading file: "${args.filePath}"`);
    try {
      const absolutePath = path.resolve(args.filePath);
      const content = await fs.readFile(absolutePath, { encoding: 'utf8' });
      return `Content of '${args.filePath}':\n${content}`;
    } catch (err) {
      logger.error(`Error reading file ${args.filePath}:`, err);
      return `Error: Could not read file '${args.filePath}'. ${err.message}`;
    }
  }
}
