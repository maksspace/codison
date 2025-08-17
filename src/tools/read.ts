import * as path from 'path';
import { promises as fs } from 'fs';
import { Tool } from './types';
import { logger } from '@/logger';

export class ReadTool implements Tool {
  name = 'read';
  description =
    'Reads a file. Optionally returns a slice by line offset and limit';
  schema = {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute path to the file',
      },
      offset: {
        type: 'number',
        description: 'Start line (0-based). Default: 0',
      },
      limit: {
        type: 'number',
        description: 'Max lines to return. Default: 500',
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
