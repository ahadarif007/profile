import type { Education, Profile, TimelineEntry } from './types';

export const profile: Profile = {
  name: 'Abdul Ahad',
  brand: 'AHAD.SYS',
  roles: ['Software Engineer', 'Machine Learning Researcher', 'MSc in Computing'],
  location: 'Dublin, Ireland',
  availability: 'Open to engineering roles',
  heroLines: ['Abdul', 'Ahad'],
  heroTagline: 'I build systems that think.',
  heroIntro:
    'Software engineer with more than five years at BRAC IT, where I went from trainee to senior engineer on Java and Spring Boot systems. I co-authored a deep learning paper at IEEE ICCIT 2023 and I’m now doing an MSc in Computing at ATU.',
  manifesto: ['Engineered with precision.', 'Questioned with science.'],
  manifestoBody:
    'At BRAC IT I worked on financial and operational systems: event-sourced platforms, idempotent data pipelines and shared Spring Boot components used across services. As a senior engineer I reviewed architecture and code, tuned performance, mentored engineers and worked through solutions with business teams.',
  email: 'ahadarif555@gmail.com',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/abdul-ahad-64aa161a6/' },
    { label: 'GitHub', href: 'https://github.com/ahadarif007' },
    { label: 'Medium', href: 'https://medium.com/@ahadarif111' },
  ],
};

// Dates follow the 2026 CV.
export const timeline: TimelineEntry[] = [
  { start: 'Feb 2020', end: 'Apr 2020', title: 'Teaching Assistant (Intern)', org: 'American International University-Bangladesh', kind: 'teaching' },
  { start: 'Oct 2020', end: 'Feb 2021', title: 'Java Development Trainee', org: 'Fast Track Future Leader', kind: 'work' },
  { start: 'Feb 2021', end: 'Apr 2021', title: 'Java Development Intern', org: 'BRAC IT Services Limited', kind: 'work' },
  { start: 'May 2021', end: 'Dec 2023', title: 'Software Engineer', org: 'BRAC IT Services Limited', kind: 'work' },
  { start: 'Jan 2024', end: 'Jul 2026', title: 'Senior Software Engineer', org: 'BRAC IT Services Limited', kind: 'work' },
  { start: 'Jan 2026', end: 'Feb 2027', title: 'MSc in Computing', org: 'Atlantic Technological University', kind: 'study' },
];

export const education: Education[] = [
  {
    degree: 'MSc in Computing',
    institution: 'Atlantic Technological University',
    place: 'Galway, Ireland',
    period: 'Jan 2026 – Feb 2027 (expected)',
    result: 'In progress',
  },
  {
    degree: 'BSc in Computer Science and Engineering',
    institution: 'American International University-Bangladesh',
    place: 'Dhaka, Bangladesh',
    period: 'Graduated Jul 2020',
    result: 'CGPA 3.45 / 4.00',
  },
];

// Only items that can be backed up; add a year and issuer to each when you have them.
export const recognition: string[] = [
  'Contributed to BRAC IT’s first successful CMMI implementation for its software development process',
  'Led the development and delivery of five ERP modules',
  'Intel Edge AI Scholarship, Udacity',
  'Second place, AIUB project showcase',
  'More than 500 algorithmic problems solved on online judges',
];
