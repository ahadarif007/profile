import type { SkillGroup } from './types';

// Grouped by how central each tool is to my work, following the 2026 CV.
export const skillGroups: SkillGroup[] = [
  {
    id: 'languages',
    name: 'Languages',
    items: ['Java', 'Python', 'SQL', 'TypeScript', 'Shell'],
  },
  {
    id: 'backend',
    name: 'Backend',
    items: ['Spring Boot', 'Spring MVC', 'Hibernate', 'JPA', 'REST APIs', 'Thymeleaf'],
  },
  {
    id: 'architecture',
    name: 'Architecture',
    items: ['DDD', 'CQRS', 'Event Sourcing', 'Microservices', 'Reactive streams', 'Idempotent processing'],
  },
  {
    id: 'data',
    name: 'Databases and search',
    items: ['PostgreSQL', 'Oracle Database', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch'],
  },
  {
    id: 'ml',
    name: 'Machine learning and data analysis',
    items: ['PyTorch', 'TensorFlow', 'scikit-learn', 'OpenCV', 'NumPy', 'pandas', 'Jupyter Notebook'],
  },
  {
    id: 'infra',
    name: 'DevOps and observability',
    items: ['Git', 'GitLab CI/CD', 'Docker', 'Ansible', 'ELK Stack', 'Grafana', 'Linux'],
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
  'Jupyter Notebook': ['Tomato leaf disease paper (ICCIT 2023)'],
};

/** Skill names matched against the patterns listed on each project. */
export const patternAliases: Record<string, string[]> = {
  DDD: ['Domain-Driven Design', 'DDD'],
  CQRS: ['CQRS'],
  'Event Sourcing': ['Event Sourcing'],
  'Reactive streams': ['Reactive services', 'Reactive streams', 'Reactive pipelines'],
  Microservices: ['Microservices'],
  'Idempotent processing': ['Idempotency', 'Idempotent pipelines', 'Idempotent REST'],
};
