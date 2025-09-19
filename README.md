# Codison

> **Codison is an open-source library for building AI-powered apps locally.**  
> It gives you a full **agent runtime** with dozens of built-in tools, JSON schema validation, and local knowledge bases — all in a single package.

Use it directly in your **TypeScript/JavaScript code** to parse files, run automations, and build AI features with validated outputs.  
No external vector DBs. No cloud dependencies. No boilerplate.

[GitHub](https://github.com/codison/codison) · [Quickstart](#quickstart)

---

## Why Codison?

- 🧩 **Agent as a library** — import it directly, compose tools, enforce schemas.
- 📄 **Structured JSON output** — no free-form LLM text, always validated.
- 📚 **Huge local knowledge bases** — feed 200MB Markdown and query it, no external DB.
- ⚡ **Local-first** — minimal dependencies, no vendor lock-in.
- 🔧 **Extensible** — add your own tools (APIs, DB lookups, file operations).

---

## Installation

```bash
npm i codison
# or
yarn add codison
# or
pnpm add codison
```

---

## API Key

Codison requires an API key for your LLM provider:

```bash
export OPENAI_API_KEY=sk-xxxx
# or
export GEMINI_API_KEY=your-gemini-key
```

---

## Quickstart (in code)

The simplest way to see Codison in action — strict JSON output in 10 lines:

```ts
import { Codison } from 'codison';

const agent = new Codison({
instructions: 'You are a math tutor.'
});

const result = await agent.runNonInteractive({
prompt: 'What is 17*19?',
schema: { type: 'number' },
});

console.log(result); // 323
```

---

## Example 1: Parse Excel → JSON

Turn messy XLSX/CSV into validated JSON objects.  
Codison calls your custom `searchCity` tool to resolve IDs and enforces a strict schema.

```ts
import { Codison } from 'codison';
import { SearchCityTool } from './tools/search-city';
import { tourOpenAPISchema } from './schemas/tour';

const codison = new Codison({
workingDir: '/tmp/excel-import',
instructions: 'Parse XLSX files and extract tours in strict JSON schema',
tools: [new SearchCityTool()],
});

const result = await codison.runNonInteractive({
prompt: 'Analyze uploaded Excel files and return all tours',
schema: tourOpenAPISchema,
});

console.log(result);
```

✅ Resolves cities with your API/tool  
✅ Normalizes & validates fields  
✅ Returns schema-conformant JSON every time

---

## Example 2: Documentation FAQ Bot

Codison includes a built-in **Knowledge Base** (RAG).  
Feed it massive text files (200–300MB Markdown), and query them locally — no external DB required.

```ts
import { Codison, KnowledgeBase } from 'codison';
import * as fs from 'fs';

const docs = fs.readFileSync('./docs/faq.md', 'utf-8');

// Create a knowledge base
const kb = new KnowledgeBase(docs, { chunkSize: 2000 });

const faqAgent = new Codison({
instructions: 'You are a documentation assistant.',
tools: [kb],
});

const answer = await faqAgent.runNonInteractive({
prompt: 'How do I import tours from Excel?',
});

console.log(answer);
```

✅ Local embeddings + in-memory vector index  
✅ Top-k retrieval blended into prompts  
✅ Perfect for FAQ bots or support assistants

---

## Extending Codison

Codison is designed for extension — write your own tools and plug them into the agent:

```ts
import { Tool } from 'codison';

class SearchCityTool implements Tool {
name = 'searchCity';
description = 'Resolve cityId from city name.';
schema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };

async execute(args: { name: string }) {
return JSON.stringify(await searchCitiesByName(args), null, 2);
}
}
```

---

## CLI (optional)

Codison also ships a CLI for one-off tasks and quick debugging.

```bash
npx codison "Fix bug in auth middleware and add tests"
```

---

## Use Cases

- **Data ingestion** → parse chaotic Excel/CSV into structured JSON
- **Support bots** → query docs, FAQs, or even your codebase
- **Automation** → validate inputs, migrate data, run local AI workflows
- **Custom AI utilities** → compose agents with your own APIs/tools

---

## Philosophy

Codison is a **developer-first agent runtime**:

- Everything is **code**
- Outputs are **structured and validated**
- Tools & memory are **composable**
- Runs **locally**, without ceremony or lock-in

Build AI features directly in your apps — fast, simple, reliable.