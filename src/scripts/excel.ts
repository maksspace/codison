import { Codison } from '@/codison';

(async () => {
  const codison = new Codison();

  const out = await codison.run({
    prompt: 'Tell me that does test.xlsx file is about?',
  });

  console.log(out);
})();
