import * as fs from 'fs/promises';
import * as path from 'path';
import { Tool } from './types';
import ignore, { Ignore } from 'ignore';

export class SearchFilesTool implements Tool {
  name = 'searchFiles';
  description =
    'Searches for files in a given directory matching a regular expression pattern, while respecting rules specified in .gitignore. Returns a list of full file paths.';
  schema = {
    type: 'object',
    properties: {
      regex: {
        type: 'string',
        description:
          'The regular expression pattern to match against file names, provided directly by the agent.',
      },
      path: {
        type: 'string',
        description:
          'The absolute file system path of the directory to search within (e.g., C:\\Users\\...\\codison or /home/user/...). This path is determined by the agent and provided in its full form.',
      },
      maxCount: {
        type: 'number',
        description: 'The maximum number of files to return. Defaults to 50',
      },
    },
    required: ['regex', 'path', 'maxCount'],
    additionalProperties: false,
  };

  private readonly ignoreManager: Ignore;
  private readonly projectDir: string;

  constructor(projectDir: string = process.cwd()) {
    this.projectDir = projectDir;
    this.ignoreManager = ignore();
  }

  private async loadIgnoreRules(): Promise<void> {
    const defaults = ['node_modules/', '.git/', 'dist/', 'build/'];
    this.ignoreManager.add(defaults);

    try {
      const fileContent = await fs.readFile(
        path.join(this.projectDir, '.gitignore'),
        'utf-8',
      );
      this.ignoreManager.add(fileContent);
    } catch (err) {
      console.log(
        `[SearchFilesTool] .gitignore not found, proceeding with defaults: ${err}`,
      );
    }
  }

  private async searchDirectory(
    currentDir: string,
    fileRegex: RegExp,
    foundFiles: string[],
    maxCount?: number,
  ): Promise<void> {
    if (maxCount !== undefined && foundFiles.length >= maxCount) {
      return;
    }

    try {
      const folderContents = await fs.readdir(currentDir, {
        withFileTypes: true,
      });

      for (const item of folderContents) {
        const fullPath = path.join(currentDir, item.name);
        const relativePath = path
          .relative(this.projectDir, fullPath)
          .replace(/\\/g, '/');

        if (this.ignoreManager.ignores(relativePath)) {
          continue;
        }

        if (item.isDirectory()) {
          await this.searchDirectory(fullPath, fileRegex, foundFiles, maxCount);
          if (maxCount !== undefined && foundFiles.length >= maxCount) {
            return;
          }
        } else if (item.isFile()) {
          if (fileRegex.test(item.name)) {
            foundFiles.push(fullPath);
            if (maxCount !== undefined && foundFiles.length >= maxCount) {
              return;
            }
          }
        }
      }
    } catch (err) {
      throw new Error(
        `[SearchFilesTool ERROR] Error reading directory ${currentDir}: ${err}`,
      );
    }
  }

  async execute(args: Record<string, any>): Promise<string> {
    await this.loadIgnoreRules();
    console.log('[SearchFilesTool] Starting file search...');

    const regex = args.regex as string;
    const searchPath = args.path as string;
    const maxCount = args.maxCount as number;

    const filesFound: string[] = [];
    const searchRoot = searchPath;

    const fileRegex = new RegExp(regex, 'i');

    await this.searchDirectory(searchRoot, fileRegex, filesFound, maxCount);

    if (filesFound.length === 0) {
      return 'No files found matching the pattern';
    } else {
      return filesFound.join('\n');
    }
  }
}
