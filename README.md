# Codison

A fast, autonomous AI **CLI** agent that acts as a senior developer inside your repo.  
It edits code, runs tests, and follows your conventions.

> **Open source.** Built for speed, reliability, and a calm developer experience.

[GitHub](https://github.com/yourusername/codison) · [Quickstart](#quickstart)

---

## Core ideas

- **Speed-first:** minimal latency, minimal chatter.
- **Autonomous:** edits → builds → tests → verifies.
- **Context-aware:** learns your style and architecture.
- **Proactive verification:** runs tests/lint before claiming success.
- **Concise output:** CLI-friendly logs, no fluff.
- **Memory:** remembers conventions and project facts.

## Requirements

- Node.js 18+
- Internet connection (for Codison’s AI)

## Install

```bash
npm i -g codison
# or
pnpm add -g codison
# or
yarn global add codison
```

## API Key

Codison requires an API key to work with an AI provider. You can provide either:

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

Set one of these environment variables before running Codison:

```bash
export OPENAI_API_KEY=sk-xxxx
# or
export GEMINI_API_KEY=your-gemini-key
```

## Quickstart

Run a non-interactive task from your project root:

```bash
codison "Fix bug in auth middleware and add tests"
```

Codison will:

1. Parse your repo and task.
2. Edit files with minimal diff churn.
3. Build & run tests.
4. Verify and summarize the changes.

## Library usage

Use Codison programmatically in your tools/CI:

```ts
import { Codison } from 'codison';

const codison = new Codison({ projectRoot: process.cwd() });
const result = await codison.runNonInteractive('Fix bug in auth.js');
console.log('Result: ', result);
```

## Examples


### Interactive CLI

```bash
# From your project root
codison

# Then type your task when prompted
> Refactor the auth middleware to remove duplicated logic,
> add tests for token refresh, and update docs if needed.
```

### Non-interactive CLI

```bash
codison 'Fix flaky login E2E by stabilizing wait conditions and adding retry to token fetch'
```

### CI (GitHub Actions)

```yaml
name: codison

on: [pull_request]

jobs:
  codison:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm i -g codison
      - run: codison 'Review this PR: run tests, suggest safer diff if needed, and output summary'
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

### Programmatic (TypeScript)

```ts
import { Codison } from 'codison';

export async function codisonEdit(task: string, projectRoot = process.cwd()) {
  const agent = new Codison({ projectRoot });
  return agent.runNonInteractive(task);
}

// Example usage
await codisonEdit('Add input validation to /api/users and unit tests');
```

### Doc-lint example

Validate and normalize descriptions in a doc-generator pipeline:

```ts
import { Codison } from 'codison';

/**
 * Checks that JSDoc/annotations are in English, concise, and consistent.
 * Fixes minor issues and updates docs/tests accordingly.
 */
export async function lintDocsWithCodison() {
  const agent = new Codison({ projectRoot: process.cwd() });
  const result = await agent.runNonInteractive([
    'Scan annotations (TS/JS) for description quality: English language, tone consistency,',
    'and naming alignment with code. Where trivial, fix typos/grammar and update docs.',
    'Run build and tests to verify no regressions.'
  ].join(' '));
  return result;
}
```

---

## CLI options

Codison CLI accepts both flags and positional arguments:

```bash
Usage: codison [options] [task]

Options:
  -i, --instruction <string>   Provide the task/instruction file name (.codison/instructions/<name>.md)
  -w, --workingDir <string>    Path to project root (default: current working directory)
  -h, --help                   Display help
```

---

## Philosophy

Codison aims to be a trustworthy teammate in your CLI: respectful of your workflows, explicit about changes and risks, and focused on shipping — not showmanship.
