import { logger } from '@/logger';
import { Tool } from './types';
import { exec } from 'child_process';

export class ShellTool implements Tool {
  name = 'shell';
  description =
    'Executes a shell command. Use platform-appropriate commands based on the execution context.';
  schema = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description:
          'The shell command to execute. Use commands appropriate for the current OS and shell environment.',
      },
    },
    required: ['command'],
    additionalProperties: false,
  };

  async execute(args: { command: string }): Promise<string> {
    logger.info(`[Shell] Executing command: "${args.command}"`);
    return new Promise((resolve) => {
      exec(args.command, (error, stdout, stderr) => {
        if (error) {
          logger.error(`[Shell] exec error: ${error}`);
          resolve(
            `Command failed: ${error.message}${stderr ? '\nStderr: ' + stderr : ''}`,
          );
          return;
        }
        if (stderr && !stdout) {
          logger.warn(`[Shell] Command stderr: ${stderr}`);
          resolve(`Command produced stderr: ${stderr}`);
          return;
        }
        const result = stdout.trim();
        resolve(
          result ||
            (stderr
              ? `Command completed with stderr: ${stderr}`
              : 'Command completed successfully'),
        );
      });
    });
  }
}
