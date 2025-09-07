import 'dotenv/config';
import * as readline from 'readline/promises';
import chalk from 'chalk';
import { program } from 'commander';
import * as fs from 'node:fs';
import * as path from 'path';

import { Codison } from '@/codison';
import { stdin, stdout } from 'process';
import { logger } from '@/logger';
import { ConsoleOutputHandler } from '@/output/console';

async function main() {
  program.option('-i, --instruction <string>');
  program.parse();

  const { instruction } = program.opts();
  let instructionStr;

  if (instruction) {
    try {
      const filePath = path.resolve(
        '.codison/instructions',
        instruction + '.md',
      );
      instructionStr = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
      throw new Error(`instruction ${instruction} not found.`);
    }
  }

  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  const codison = new Codison({ instructions: instructionStr });
  const channel = codison.getOutputChannel();
  const outputHandler = new ConsoleOutputHandler(channel);

  let keepRunning = true;
  while (keepRunning) {
    try {
      const promptInput = await rl.question(chalk.green('You: '));
      const prompt = promptInput.trim();

      if (!prompt.length) {
        continue;
      }

      if (prompt.toLowerCase() === 'exit' || prompt.toLowerCase() === 'quit') {
        keepRunning = false;
        break;
      }

      channel.input$.next({ prompt });
    } catch (error) {
      logger.error('An error occurred during interaction:', error);
    }
  }

  rl.close();
  outputHandler.stop();
}

main().catch(console.error);
