import type { SkillGroup } from './types';

export const skillGroups: SkillGroup[] = [
  {
    id: 'languages',
    name: 'Languages',
    items: ['Java', 'Python 3', 'TypeScript', 'JavaScript', 'C', 'C++', 'Shell', '8086 Assembly'],
  },
  {
    id: 'architecture',
    name: 'Architecture & backend',
    items: ['Spring Boot', 'Hibernate', 'JPA', 'Thymeleaf', 'DDD', 'CQRS', 'Event Sourcing', 'Reactive streams', 'Microservices'],
  },
  {
    id: 'data',
    name: 'Data stores',
    items: ['PostgreSQL', 'Oracle SQL', 'MySQL', 'SQLite', 'MongoDB', 'Redis', 'Elasticsearch'],
  },
  {
    id: 'ml',
    name: 'AI & machine learning',
    items: ['PyTorch', 'TensorFlow', 'Keras', 'scikit-learn', 'OpenCV', 'Hugging Face Transformers', 'NumPy', 'Pandas', 'Jupyter'],
  },
  {
    id: 'infra',
    name: 'Infrastructure & tooling',
    items: ['Docker', 'Ansible', 'GitLab CI/CD', 'Git', 'ELK Stack', 'Grafana', 'Linux'],
  },
  {
    id: 'web',
    name: 'Web',
    items: ['Angular', 'HTML', 'CSS', 'Bootstrap', 'jQuery', 'JSON', 'XML'],
  },
];

/**
 * Where a tool shows up in the work described on this page. Only tools with
 * evidence in the CV get an entry; everything else is listed without a link.
 */
export const skillEvidence: Record<string, string[]> = {
  'Spring Boot': ['Project management app (Fast Track training)'],
  Thymeleaf: ['Project management app (Fast Track training)'],
  TensorFlow: ['Tomato leaf disease paper (ICCIT 2023)'],
  'scikit-learn': ['Tomato leaf disease paper (ICCIT 2023)'],
  NumPy: ['Tomato leaf disease paper (ICCIT 2023)'],
  Jupyter: ['Tomato leaf disease paper (ICCIT 2023)'],
  '8086 Assembly': ['Teaching assistant, AIUB'],
};

/** Skill names matched against the patterns listed on each project. */
export const patternAliases: Record<string, string[]> = {
  DDD: ['Domain-Driven Design', 'DDD'],
  CQRS: ['CQRS'],
  'Event Sourcing': ['Event Sourcing'],
  'Reactive streams': ['Reactive services', 'Reactive streams', 'Reactive pipelines'],
  Microservices: ['Microservices'],
};
