import { logger } from '@/logger';
import { Tool } from './types';
import { exec } from 'child_process';

export class ShellTool implements Tool {
  name = 'shell';
  description =
    'Runs a non-interactive shell command in the current project. Uses the OS default shell, disables pagers, and returns stdout/stderr.';
  schema = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'EShell command to run (non-interactive).',
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
