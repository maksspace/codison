import { promises as fs } from 'fs';
import { Tool } from './types';
import { logger } from '@/logger';

export class ReadManyTool implements Tool {
  name = 'readMany';
  description =
    'Reads many files at once. Optionally returns a slice by line offset and limit';
  schema = {
    type: 'object',
    properties: {
      files: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['path', 'offset', 'limit'],
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
        },
      },
    },
    required: ['files'],
    additionalProperties: false,
  };

  async execute(args: {
    files: {
      path: string;
      offset: number;
      limit: number;
    }[];
  }): Promise<string> {
    const { files } = args;
    logger.info(`[FileReader] Reading files: "${args.files.length}"`);

    try {
      const filesContent: string[] = [];

      for (const file of files) {
        await fs.access(file.path);

        const content = await fs.readFile(file.path, {
          encoding: 'utf8',
        });
        const lines = content.split(/\r?\n/);

        const startIndex = file.offset ?? 0;
        const endIndex = startIndex + (file.limit ?? 500);

        const selectedLines = lines.slice(startIndex, endIndex);
        filesContent.push(
          `Content of '${file.path}':\n${selectedLines.join('\n')}`,
        );
      }

      return filesContent.join('\n\n');
    } catch (err) {
      logger.error(`Error reading files:`, err);
      return `Error: Could not read files: ${err.message}`;
    }
  }
}
