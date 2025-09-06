import * as xlsx from 'xlsx';
import { promises as fs } from 'fs';
import { Tool } from '@/tools';
import { logger } from '@/logger';

export class ReadSheetTool implements Tool {
  name = 'readSheet';
  description = 'Reads excel sheet full content in json format';
  schema = {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute path to the file',
      },
      name: {
        type: 'string',
        description: 'Name of the sheet',
      },
    },
    required: ['path', 'name'],
    additionalProperties: false,
  };

  async execute(args: { path: string; name: string }): Promise<string> {
    const { path: filePath, name } = args;
    logger.info(`[ReadSheetTool] Reading file: "${args.path}"`);

    try {
      await fs.access(filePath);

      const book = xlsx.readFile(filePath);
      const sheet = book.Sheets[name];

      return JSON.stringify(xlsx.utils.sheet_to_json(sheet), null, 2);
    } catch (err) {
      logger.error(`Error reading sheet ${args.path}:`, err);
      return `Error: Could not read sheet: ${err.message}`;
    }
  }
}
