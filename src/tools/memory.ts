import { Tool } from './types';
import * as path from 'path';
import { promises as fs } from 'fs';

const MEMORY_PATH = path.resolve('.codison/memory.md');

export class MemoryTool implements Tool {
  name = 'memory';
  description =
    'Stores and recalls durable project facts (style, commands, architecture, plans) in .codison/memory.md. Read before acting; write concise bullets. Never store secrets or large blobs. On add, agent only acknowledges.';
  schema = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['add', 'read'],
        description: 'Add to memory or read memory',
      },
      content: {
        type: 'string',
        description:
          'Fact, observation, or note to add (required if action is add)',
      },
    },
    required: ['action', 'content'],
    additionalProperties: false,
  };

  async execute(args: {
    action: 'add' | 'read';
    content?: string;
  }): Promise<string> {
    if (args.action === 'read') {
      try {
        const content = await fs.readFile(MEMORY_PATH, 'utf-8');
        return content.trim() || 'Project memory is currently empty.';
      } catch (err) {
        return `Memory file could not be read: ${err.message}`;
      }
    } else if (args.action === 'add') {
      if (!args.content || !args.content.trim()) {
        return 'Error: No content provided to add to memory.';
      }
      const entry = `\n- ${args.content.trim()}`;
      try {
        await fs.appendFile(MEMORY_PATH, entry, 'utf-8');
        return 'Memory updated.';
      } catch (err) {
        return `Error updating memory: ${err.message}`;
      }
    } else {
      return 'Unknown action.';
    }
  }
}
