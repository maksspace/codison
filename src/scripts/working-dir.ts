import { Codison } from '@/codison';

(async () => {
  const codison = new Codison({
    workingDir: '/Users/maksim/Documents/easyplanning',
  });

  const out = await codison.run({
    prompt: 'What is your working directory?',
  });

  console.log(out);
})();
