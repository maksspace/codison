import { logger } from '@/logger';
import { Tool } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class LsTool implements Tool {
  name = 'ls';
  description =
    'Lists files and folders in a specified directory, with a specified depth for subfolders. By default, it lists the immediate contents of the directory and its direct subfolders.';
  schema = {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description:
          'The absolute file system path to the directory. This path must start from the root (e.g., C:\\Users\\... or /home/user/...).',
      },
      depth: {
        type: 'number',
        description:
          'The maximum depth to traverse into subfolders. A depth of 0 means only list contents of the specified path. A depth of 1 means list immediate contents and the contents of their direct subfolders. Defaults to 1. Set to a higher number for deeper traversal.',
      },
    },
    required: ['path', 'depth'],
    additionalProperties: false,
  };

  async execute(args: { path: string; depth: number }): Promise<string> {
    const dirPath = args.path;
    const depth = args.depth !== undefined ? args.depth : 1;

    const results: string[] = [];

    try {
      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
        return `Error: Path '${dirPath}' is not a directory.`;
      }

      await this.traverseDirectory(dirPath, dirPath, 0, depth, results);

      if (results.length === 0) {
        return `[Ls Tool] No files or folders found in '${dirPath}'.`;
      } else {
        return results.join('\n');
      }
    } catch (err) {
      logger.error(
        `[Ls Tool] Error: Could not list directory '${dirPath}'. ${err.message}`,
      );
    }
  }

  private async traverseDirectory(
    currentAbsPath: string,
    rootDir: string,
    currentDepth: number,
    maxDepth: number,
    results: string[],
  ): Promise<void> {
    try {
      const folderContents = await fs.readdir(currentAbsPath, {
        withFileTypes: true,
      });

      for (const item of folderContents) {
        const fullPath = path.join(currentAbsPath, item.name);

        const relativePath = path.relative(rootDir, fullPath);

        results.push(relativePath);

        if (item.isDirectory() && currentDepth < maxDepth) {
          await this.traverseDirectory(
            fullPath,
            rootDir,
            currentDepth + 1,
            maxDepth,
            results,
          );
        }
      }
    } catch (err) {
      logger.error(
        `[LsTool] Could not read directory ${currentAbsPath}: ${err.message}`,
      );
      results.push(
        `[LsTool] Error accessing: ${path.relative(rootDir, currentAbsPath)}`,
      );
    }
  }
}
