import { Tool } from './types';
import * as path from 'path';
import { promises as fs } from 'fs';
import { logger } from '@/logger';

export class WriteTool implements Tool {
  name = 'write';
  description =
    'Writes text to a file. Creates parent directories if needed and overwrites existing content.';
  schema = {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute path to the target file',
      },
      content: {
        type: 'string',
        description: 'Text to write',
      },
    },
    required: ['path', 'content'],
    additionalProperties: false,
  };

  async execute(args: { path: string; content: string }): Promise<string> {
    logger.info(
      `[FileWriter] Writing to file: "${args.path}" with content: "${args.content.substring(0, 50)}..."`,
    );
    try {
      const absolutePath = path.resolve(args.path);
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, args.content, { encoding: 'utf8' });
      return `Successfully wrote to file: '${args.path}'`;
    } catch (err) {
      logger.error(`Error writing to file ${args.path}:`, err);
      return `Error: Could not write to file '${args.path}'. ${err.message}`;
    }
  }
}
