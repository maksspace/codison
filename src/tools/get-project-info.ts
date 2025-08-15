import { logger } from '@/logger';
import { Tool } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class GetProjectInfoTool implements Tool {
  name = 'getProjectInfo';
  description =
    'Retrieves basic metadata (name and version) from the package.json file of a given Node.js project path. Returns a JSON string in the format { "name": "<name>", "version": "<version>" } or fields as undefined if not found.';
  schema = {
    type: 'object',
    properties: {
      projectDir: {
        type: 'string',
        description:
          'The absolute file system path to the Node.js project directory containing package.json. E.g., C:\\Users\\user\\my-project or /home/user/my-project.',
      },
    },
    required: ['projectDir'],
    additionalProperties: false,
  };

  async execute(args: { projectDir: string }): Promise<string> {
    const { projectDir } = args;

    const pckgJsonPath = path.join(projectDir, 'package.json');

    try {
      const jsonContent = await fs.readFile(pckgJsonPath, {
        encoding: 'utf-8',
      });

      const json = JSON.parse(jsonContent);

      if (json.name && json.version) {
        return JSON.stringify({
          name: json.name,
          version: json.version,
        });
      } else {
        logger.warn(
          `[ProjectInfoTool] Name or version aren't specified in package.json`,
        );
        return JSON.stringify({
          name: json.name,
          version: json.version,
        });
      }
    } catch (err) {
      logger.info(
        `[ProjectInfoTool] Error: Couldn't read name and version from package.json: ${err.message}`,
      );
    }
  }
}
