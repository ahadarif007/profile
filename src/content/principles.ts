import type { Principle } from './types';

// Draft copy for Ahad to rewrite in their own voice.
export const principles: Principle[] = [
  {
    title: 'Safe to repeat.',
    body: 'Networks drop and clients retry. If the same request arrives twice, the system should end up in the same state, so I make write paths idempotent from the start.',
  },
  {
    title: 'Every number has a history.',
    body: 'Event sourcing changed how I think about data. A balance or a total is the result of events, and if I can’t trace a figure back to them, I don’t trust it.',
  },
  {
    title: 'Reproduce, then believe.',
    body: 'This goes for research and production alike. Start from a baseline, change one thing at a time, and use an evaluation that could prove you wrong.',
  },
  {
    title: 'Trade-offs, written down.',
    body: 'Reactive or blocking, SQL or NoSQL, build or reuse. There’s rarely one right answer, so I write down why I chose what I did. Then the next engineer can disagree with a reason instead of a guess.',
  },
];
