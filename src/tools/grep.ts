import { logger } from '../logger';
import { ShellTool } from './shell';
import { Tool } from './types';
import * as fs from 'fs';

export class GrepTool implements Tool {
  name = 'grep';
  description =
    'Searches for patterns within files using the system grep command. Can be used to find specific text in one or multiple files/directories. Supports regular expressions. Specify a file_path for a single file or a directory for recursive search. Supports options like "-i" for case-insensitive, "-n" for line numbers, "-l" for file names only, "-E" for extended regex. All standard grep options are supported.';
  schema = {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'The regular expression or string to search for.',
      },
      file_path: {
        type: 'string',
        description:
          'The path to the file or directory to search within. If a directory, it will search recursively (implies -r).',
      },
      options: {
        type: 'string',
        description:
          'Optional flags for the grep command (e.g., "-i" for case-insensitive, "-n" for line numbers, "-l" for file names only, "-E" for extended regex). Combine flags if needed, e.g., "-inE". Defaults to "" if not provided.',
      },
    },
    required: ['pattern', 'file_path', 'options'],
    additionalProperties: false,
  };

  private shellTool: ShellTool;

  constructor() {
    this.shellTool = new ShellTool();
  }

  async execute(args: {
    pattern: string;
    file_path: string;
    options?: string;
  }): Promise<string> {
    const { pattern, file_path, options } = args;
    logger.info(
      `[GrepTool] Preparing to execute system grep for "${pattern}" in "${file_path}" with options "${options || ''}"`,
    );

    const resolvedPath = file_path;

    let actualOptions = options || '';
    try {
      const stats = await fs.promises.stat(resolvedPath); //  Check if the path is a directory
      if (stats.isDirectory() && !actualOptions.includes('-r')) {
        actualOptions += ' -r'; // Automatically add recursive flag if it's a directory
      }
    } catch (e) {
      return `Failed executing grep command: ${e.message}`;
    }

    const quotedPattern = `'${pattern.replace(/'/g, "'\\''")}'`;
    const quotedFilePath = `'${resolvedPath.replace(/'/g, "'\\''")}'`;
    const grepCommand = `grep ${actualOptions} ${quotedPattern} ${quotedFilePath}`;

    try {
      const output = await this.shellTool.execute({ command: grepCommand });
      if (!output) {
        return `No matches found for pattern "${pattern}" in "${file_path}".`;
      }
      return output;
    } catch (error: any) {
      if (
        error.message.includes('No such file or directory') ||
        error.message.includes('Is a directory')
      ) {
        return `Error: Path "${file_path}" is not a valid file or accessible directory for grep.`;
      }
      return `Error executing grep command: ${grepCommand}\nDetails: ${error.message}`;
    }
  }
}
