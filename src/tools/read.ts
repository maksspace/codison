import * as path from 'path';
import { promises as fs } from 'fs';
import { Tool } from './types';
import { logger } from '@/logger';

export class ReadTool implements Tool {
  name = 'read';
  description =
    'Reads the content of a file from the filesystem. Can read a specific portion of the file using offset and limit parameters.';
  schema = {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description:
          'The absolute file system path to the file. This path must start from the root (e.g., C:\\Users\\... or /home/user/...).',
      },
      offset: {
        type: 'number',
        description:
          'The starting line number to read from. Defaults to 0, which is the first line.',
      },
      limit: {
        type: 'number',
        description:
          'The maximum number of lines to read from the offset. Defaults to 500 lines.',
      },
    },
    required: ['path', 'offset', 'limit'],
    additionalProperties: false,
  };

  async execute(args: {
    path: string;
    offset: number;
    limit: number;
  }): Promise<string> {
    const { path: filePath, offset = 0, limit = 500 } = args;
    logger.info(`[FileReader] Reading file: "${args.path}"`);
    try {
      const absolutePath = path.resolve(filePath);

      await fs.access(absolutePath);

      const content = await fs.readFile(absolutePath, { encoding: 'utf8' });
      const lines = content.split(/\r?\n/);

      const startIndex = offset;
      const endIndex = offset + limit;

      const selectedLines = lines.slice(startIndex, endIndex);

      return `Content of '${args.path}':\n${selectedLines.join('\n')}`;
    } catch (err) {
      logger.error(`Error reading file ${args.path}:`, err);
      return `Error: Could not read file: ${err.message}`;
    }
  }
}
