import * as xlsx from 'xlsx';
import { promises as fs } from 'fs';
import { Tool } from '@/tools';
import { logger } from '@/logger';

export class ReadSheetsNamesTool implements Tool {
  name = 'readSheetsNames';
  description = 'Reads all sheet names of excel file.';
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

  async execute(args: { path: string }): Promise<string> {
    const { path: filePath } = args;
    logger.info(`[ReadSheetsNamesTool] Reading file: "${args.path}"`);

    try {
      await fs.access(filePath);

      const book = xlsx.readFile(filePath);

      return JSON.stringify(book.SheetNames, null, 2);
    } catch (err) {
      logger.error(`Error reading sheets names ${args.path}:`, err);
      return `Error: Could not read sheets names: ${err.message}`;
    }
  }
}
