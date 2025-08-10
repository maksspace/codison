import 'dotenv/config';

import { Codison } from '@/codison';
import { AI_CODE_REVIEW_INSTRUCTIONS } from '@/instructions';

async function main() {
  const codison = new Codison({
    instructions: AI_CODE_REVIEW_INSTRUCTIONS,
  });

  const resonse = await codison.run({
    prompt:
      'Review commits in the current branch agains main. only include commits written by stefanprvulovic - junior dev with 4 months of experience.',
  });

  console.log(resonse);
}

main().catch(console.error);
