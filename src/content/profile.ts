import type { Education, Profile, TimelineEntry } from './types';

export const profile: Profile = {
  name: 'Abdul Ahad',
  brand: 'AHAD.SYS',
  roles: ['Software Engineer', 'AI Researcher', 'Systems Thinker'],
  location: 'Dublin, Ireland',
  availability: 'Open to engineering roles',
  heroLines: ['I build', 'systems', 'that think.'],
  heroIntro:
    'I’m a software engineer who has spent five years building event-sourced systems for enterprise teams. I also work on deep learning research (published at IEEE ICCIT 2023), and I’m now doing an MSc in Computing in Ireland.',
  manifesto: ['Engineered with precision.', 'Questioned with science.'],
  manifestoBody:
    'I spent more than five years building enterprise systems at BRAC IT in Dhaka: event-sourced platforms, idempotent data pipelines and shared frameworks used across services. Now I’m doing an MSc in Computing at Atlantic Technological University and bringing the same care to machine learning research.',
  email: 'ahadarif555@gmail.com',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/abdul-ahad-64aa161a6/' },
    { label: 'GitHub', href: 'https://github.com/ahadarif007' },
    { label: 'Medium', href: 'https://medium.com/@ahadarif111' },
  ],
};

// TODO(ahad): confirm BRAC IT dates. The CV lists Senior SE "Jan 2024 – Present"
// and SE "May 2021 – June 2026", which overlap. Assumed values below.
export const timeline: TimelineEntry[] = [
  { start: 'Feb 2020', end: 'Apr 2020', title: 'Teaching Assistant (Intern)', org: 'American International University Bangladesh', kind: 'teaching' },
  { start: 'Oct 2020', end: 'Feb 2021', title: 'Java Development Trainee', org: 'Fast Track Future Leader', kind: 'work' },
  { start: 'Feb 2021', end: 'May 2021', title: 'Java Development Intern', org: 'BRAC IT Services', kind: 'work' },
  { start: 'May 2021', end: 'Jan 2024', title: 'Software Engineer', org: 'BRAC IT Services', kind: 'work' },
  { start: 'Jan 2024', end: 'Jun 2026', title: 'Senior Software Engineer', org: 'BRAC IT Services', kind: 'work' },
  { start: 'Jan 2026', end: 'Feb 2027', title: 'MSc in Computing', org: 'Atlantic Technological University', kind: 'study' },
];

export const education: Education[] = [
  {
    degree: 'MSc in Computing',
    institution: 'Atlantic Technological University',
    place: 'Galway, Ireland',
    period: 'Jan 2026 – Feb 2027',
    result: 'In progress',
  },
  {
    degree: 'BSc in Computer Science and Engineering',
    institution: 'American International University Bangladesh',
    place: 'Dhaka, Bangladesh',
    period: 'Graduated Jul 2020',
    result: 'CGPA 3.45 / 4.00',
  },
];

export const recognition: string[] = [
  'Awarded for leading BRAC IT’s first successful CMMI implementation in the SDLC',
  'Led development and delivery of five ERP modules',
  'Intel Edge AI Scholarship (Udacity)',
  'Commonwealth Scholarship (Coursera)',
  '500+ problems solved on online judges',
  'Programming tech blogger on Medium',
  'Second place, AIUB project showcase',
  '15+ undergraduate projects · 20+ Coursera courses',
];
