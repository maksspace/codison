import 'dotenv/config';

import * as readline from 'readline/promises';
import { stdin, stdout } from 'process';

import { OpenAIProvider } from '@/provider/openai';
import { Agent } from '@/agent/agent';
import { History } from '@/history/history';
import { Channel } from '@/channel/channel';
import { ConsoleOutputHandler } from '@/output/console';
import { availableTools } from '@/tools';
import { logger } from '@/logger';
import { GeminiProvider } from './provider/gemini';

async function main() {
  logger.info('Starting AI Agent Interactive CLI...\n');
  logger.info(
    "Type your questions below. Type 'exit' or 'quit' to end the session.",
  );

  const provider = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    tools: availableTools,
  });
  // const provider = new GeminiProvider({
  //   apiKey: process.env.GEMINI_API_KEY,
  //   tools: availableTools,
  // });
  const history = new History();
  const agent = new Agent({ provider, history, tools: availableTools });
  const channel = new Channel(agent);
  const outputHandler = new ConsoleOutputHandler(channel);

  const rl = readline.createInterface({ input: stdin, output: stdout });

  let keepRunning = true;

  while (keepRunning) {
    try {
      const userInput = await rl.question('You: ');

      if (!userInput.trim()) {
        continue;
      }

      if (
        userInput.toLowerCase() === 'exit' ||
        userInput.toLowerCase() === 'quit'
      ) {
        keepRunning = false;
        logger.info('Exiting AI Agent CLI. Goodbye!');

        // const sessionTotals = history.getOverallSessionTokenUsage();
        // logger.info('\n[TokenUsage] Session:');
        // logger.info(`  Prompt Tokens: ${sessionTotals.promptTokens}`);
        // logger.info(`  Completion Tokens: ${sessionTotals.completionTokens}`);
        // logger.info(`  Total Tokens: ${sessionTotals.totalTokens}`);
        // logger.info(`  Total Cost (USD): $${sessionTotals.costUSD.toFixed(6)}`);

        history.clear();

        break;
      }

      if (userInput.toLocaleLowerCase() === 'history') {
        console.log(history.getMessages());
        continue;
      }

      channel.input$.next({ prompt: userInput });
    } catch (error) {
      logger.error('An error occurred during interaction:', error);
    }
  }

  rl.close();
  outputHandler.stop();
}

main().catch(console.error);
