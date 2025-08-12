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
        description:
          'The absolute file system path to the file. This path must start from the root (e.g., C:\\Users\\... or /home/user/...).',
      },
    },
    required: ['path'],
    additionalProperties: false,
  };

  async execute(args: { path: string }): Promise<string> {
    logger.info(`[FileReader] Reading file: "${args.path}"`);
    try {
      const absolutePath = path.resolve(args.path);
      const content = await fs.readFile(absolutePath, { encoding: 'utf8' });
      return `Content of '${args.path}':\n${content}`;
    } catch (err) {
      logger.error(`Error reading file ${args.path}:`, err);
      return `Error: Could not read file '${args.path}'. ${err.message}`;
    }
  }
}
