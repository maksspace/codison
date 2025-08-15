import { logger } from '@/logger';
import { Tool } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class GetDependeciesTool implements Tool {
  name = 'getDependencies';
  description =
    'Retrieves the "dependencies" list (with versions) from the package.json file of a given Node.js project path. Returns an empty object if no production dependencies are found.';
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

      if (json && json.dependencies) {
        return JSON.stringify(json.dependencies);
      }

      logger.info('No dependencies found.');
      return JSON.stringify({});
    } catch (err) {
      logger.error(
        `[DependenciesTool] Error: Couldn't read package.json: ${err.message}`,
      );
    }
  }
}
