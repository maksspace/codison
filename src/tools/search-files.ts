import * as fs from 'fs/promises';
import * as path from 'path';
import { Tool } from './types';

export class SearchTool implements Tool {
  name = 'searchFiles';
  description =
    'Searches for files in the working directory matching a given pattern, ignoring directories specified in .gitignore. Returns a list of full file paths.';
  schema = {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description:
          'The regular expression pattern to match against file names.',
      },
      maxCount: {
        type: 'number',
        description:
          'The maximum number of files to return. Defaults to unlimited if not provided.',
      },
    },
    required: ['pattern', 'maxCount'],
    additionalProperties: false,
  };

  private ignorePatterns: RegExp[] = [];
  private readonly projectDir: string;
  private readonly ignorePath: string;

  constructor(projectDir: string = process.cwd()) {
    this.projectDir = projectDir;
    this.ignorePath = path.join(this.projectDir, '.gitignore');
  }

  private async loadIgnorePatterns(): Promise<void> {
    const fileContent = await fs.readFile(this.ignorePath, 'utf-8');

    this.ignorePatterns = fileContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => this.convertToRegex(line));

    const defaults = ['node_modules/', '.git/', 'dist/', 'build/'];
    defaults.forEach((pattern) => {
      const regex = this.convertToRegex(pattern);
      if (!this.ignorePatterns.some((p) => p.source === regex.source)) {
        this.ignorePatterns.push(regex);
      }
    });
  }

  private convertToRegex(pattern: string): RegExp {
    let regexString = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    regexString = regexString.replace(/\*\*\//g, '(?:[^/]+/)*');
    regexString = regexString.replace(/\*\*/g, '.*');
    regexString = regexString.replace(/\*/g, '[^/]*');
    regexString = regexString.replace(/\?/g, '.');

    if (pattern.startsWith('/')) {
      regexString = '^' + regexString.substring(1);
    } else {
      regexString = '(^|/)' + regexString;
    }

    if (pattern.endsWith('/')) {
      if (regexString.endsWith('/')) {
        regexString = regexString.substring(0, regexString.length - 1);
      }
      regexString += '(?:/.*)?$';
      return new RegExp(regexString, 'i');
    } else {
      if (!regexString.endsWith('$') && !regexString.endsWith('.*')) {
        regexString += '$';
      }
      return new RegExp(regexString, 'i');
    }
  }

  private isIgnored(fullPath: string): boolean {
    const relativePath = path.relative(this.projectDir, fullPath);
    const normalizedPath = relativePath.replace(/\\/g, '/');
    if (normalizedPath === '') {
      return false;
    }

    for (const pattern of this.ignorePatterns) {
      if (pattern.test(normalizedPath)) {
        return true;
      }
    }
    return false;
  }

  private createFileRegex(pattern: string): RegExp {
    if (pattern.startsWith('*.')) {
      const extension = pattern.substring(2);
      const escapedExt = extension.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\.${escapedExt}$`, 'i');
    }
    return new RegExp(pattern, 'i');
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
        if (this.isIgnored(fullPath)) {
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
        `[SearchTool ERROR] Error reading directory ${currentDir}: ${err}`,
      );
    }
  }

  async execute(args: Record<string, any>): Promise<string> {
    await this.loadIgnorePatterns();
    console.log('[SearchTool] Starting file search...');

    const pattern = args.pattern as string;
    const maxCount = args.maxCount as number | undefined;

    const filesFound: string[] = [];
    const fileRegex = this.createFileRegex(pattern);

    await this.searchDirectory(
      this.projectDir,
      fileRegex,
      filesFound,
      maxCount,
    );

    if (filesFound.length === 0) {
      return 'No files found matching the pattern';
    } else {
      return filesFound.join('\n');
    }
  }
}
