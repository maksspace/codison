# Codison

Codison is an autonomous AI CLI agent that acts as a senior software developer operating directly inside your codebase. Codison executes tasks from the command line, making changes, running tests, and following your project’s conventions — always matching the existing style and architecture.

**Codison is fully open source.**

## Core Ideas
- **Build the fastest coding agent in the world** — relentless focus on speed, code quality, and reliability.
- **Great UX & UI:** Designed for both an amazing CLI experience and upcoming desktop app release.
- **Autonomous Developer:** Takes on tasks end-to-end within your project. Executes by actually editing, building, and running code, not just suggesting changes.
- **Context Awareness:** Reads from the codebase and memory to adapt to your style and project structure — never guesses, always verifies.
- **Proactive Verification:** Always runs tests, build, and lint after making code changes to confirm correctness.
- **Minimal Talk:** Outputs concise, CLI-like responses. No unnecessary explanations.
- **Memory System:** Remembers established facts about your code, conventions, and commands for future sessions.

## How to Use
1. **Start Codison** in your project’s root directory.
2. **Give Tasks** via natural language (e.g., `fix bug in auth.js`, `add tests`, `update API docs`).
3. **Codison Acts**: Reads, edits, runs tools, proposes commits — always based on your actual code and conventions.
4. **Review & Commit**: Confirm commits and pushes when prompted.

## Example Commands
```bash
# List files in a directory
list files in src

# Fix a bug
fix bug in auth.py

# Add a new feature
generate api handler for createUser
```

## Requirements
- Node.js 18+
- Internet connection (for Codison’s AI)

## Library Usage
Codison can also be used as a library:

```js
import { Codison } from 'codison';

const codison = new Codison({ projectDir: '/your/project/path' });
codison.runNonInteractive('fix bug in auth.js');
```

This allows programmatic invocation of Codison in your tools and scripts.

## Project Philosophy
Codison aims to be a seamless, trustworthy, and context-aware development teammate in your CLI. It doesn’t just give suggestions — it actually gets the work done, respecting your workflows and minimizing interruptions.
