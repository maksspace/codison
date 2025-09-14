import * as xlsx from 'xlsx';
import { promises as fs } from 'fs';
import { Tool } from '@/tools';
import { logger } from '@/logger';

export class ReadExcelSheetRowsTool implements Tool {
  name = 'readExcelSheetRows';
  description = 'Reads excel sheet rows in json format';
  schema = {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute path to the excel file',
      },
      name: {
        type: 'string',
        description: 'Name of the sheet',
      },
      offset: {
        type: 'number',
        description: 'Start row to read. default = 0',
      },
      limit: {
        type: 'number',
        description: 'How many rows to read. default = 0 = all rows',
      },
    },
    required: ['path', 'name', 'offset', 'limit'],
    additionalProperties: false,
  };

  async execute(args: {
    path: string;
    name: string;
    offset: number;
    limit: number;
  }): Promise<string> {
    const { path: filePath, name, offset = 0, limit = 0 } = args;
    logger.info(`[ReadSheetTool] Reading file: "${args.path}"`);

    try {
      await fs.access(filePath);

      const book = xlsx.readFile(filePath);
      const sheet = book.Sheets[name];
      const rows = xlsx.utils.sheet_to_json(sheet);

      if (!limit) {
        const t = JSON.stringify(rows.slice(offset), null, 2);
        console.log({ t });
        return t;
      } else {
        return JSON.stringify(rows.slice(offset, limit), null, 2);
      }
    } catch (err) {
      logger.error(`Error reading sheet ${args.path}:`, err);
      return `Error: Could not read sheet: ${err.message}`;
    }
  }
}
