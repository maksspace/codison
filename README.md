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

## Requirements
- Node.js 18+
- Internet connection (for Codison’s AI)

## Library Usage
Codison can also be used as a library:

```js
import { Codison } from 'codison';

const codison = new Codison();
codison.runNonInteractive('fix bug in auth.js');
```

This allows programmatic invocation of Codison in your tools and scripts.

## Project Philosophy
Codison aims to be a seamless, trustworthy, and context-aware development teammate in your CLI. It doesn’t just give suggestions — it actually gets the work done, respecting your workflows and minimizing interruptions.
