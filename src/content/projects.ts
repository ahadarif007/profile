import type { Project } from './types';

// Roles say what I did on each project: "led", "designed" or "contributed to".
// Numbers are kept only where the CV states them, with their source.
export const projects: Project[] = [
  {
    id: 'ekota',
    title: 'Ekota',
    tagline: 'Digital customer acquisition for microfinance organisations, built as an event-sourced platform.',
    role: 'Backend lead',
    problem:
      'Microfinance organisations needed a faster, more dependable way to acquire and onboard customers.',
    patterns: ['Domain-Driven Design', 'CQRS', 'Event Sourcing', 'Reactive services'],
    decisions: [
      'Used DDD, CQRS and event sourcing where a full audit history mattered.',
      'Chose reactive or conventional services per workload, based on throughput and concurrency needs.',
      'Led backend development through to a production platform for customer acquisition and revenue-related workflows.',
    ],
    result: { value: '46%', label: 'improvement in operational efficiency in the first three months after launch, from internal reporting' },
    visual: 'event-fork',
  },
  {
    id: 'fin-pulse',
    title: 'Fin-Pulse',
    tagline: 'Real-time monitoring of company-wide expense and income.',
    role: 'Tech lead',
    problem:
      'The organisation needed a live view of how expenses are distributed and how they line up with income across departments.',
    patterns: ['CQRS', 'Event Sourcing', 'Idempotency', 'Reactive pipelines', 'SQL + NoSQL'],
    decisions: [
      'Used CQRS and event sourcing so every figure can be traced back to the events that produced it.',
      'Made transaction processing idempotent, so retries and replays never double-count.',
      'Fed SQL and NoSQL stores through reactive pipelines for analytics, budget forecasting and reconciliation.',
    ],
    result: { label: 'Real-time analytics, forecasting and reconciliation across departments' },
    visual: 'ledger',
  },
  {
    id: 'dedup',
    title: 'Deduplication System',
    tagline: 'Stopping duplicate records across platforms.',
    role: 'Design and implementation',
    problem: 'Records from several platforms, held in relational and NoSQL stores, were being duplicated.',
    patterns: ['Idempotent pipelines', 'Distributed data', 'SQL + NoSQL'],
    decisions: [
      'Designed a cross-platform deduplication service that brings relational and NoSQL sources together.',
      'Built idempotent ingestion and processing, so the same input always ends up as the same record.',
    ],
    result: { label: 'Consistent data, with no duplicate records across connected systems' },
    visual: 'converge',
  },
  {
    id: 'validation',
    title: 'Validation Framework',
    tagline: 'One set of validation rules for reactive and blocking services.',
    role: 'Design and implementation',
    problem:
      'Enterprise services needed one consistent way to validate input across reactive and non-reactive execution models.',
    patterns: ['Domain-Driven Design', 'Reactive streams', 'Loose coupling'],
    decisions: [
      'Supported reactive and non-reactive execution from a single rule definition.',
      'Built around DDD bounded contexts so new rules plug in without touching existing ones.',
    ],
    result: { label: 'Used by several enterprise services' },
    visual: 'gates',
  },
  {
    id: 'service-template',
    title: 'Enterprise Service Template',
    tagline: 'Reusable Spring Boot building blocks for new services.',
    role: 'Design and implementation',
    problem:
      'New services kept rebuilding the same groundwork: domain boundaries, validation, event processing, idempotency and persistence.',
    patterns: ['DDD', 'CQRS', 'Event Sourcing', 'Idempotency', 'SQL + NoSQL'],
    decisions: [
      'Created reusable Spring Boot components for domain boundaries, validation, event processing, idempotency, persistence and error handling.',
      'Built on DDD, CQRS and event sourcing, with SQL and NoSQL persistence.',
    ],
    result: { label: 'A consistent starting point for teams, with less repeated implementation work' },
    visual: 'layers',
  },
  {
    id: 'employee-happiness',
    title: 'Employee Happiness',
    tagline: 'An internal HR platform that automates administrative workflows.',
    role: 'Contributor, as a Java development intern',
    problem: 'The HR team spent a large share of its time on manual administrative work.',
    patterns: ['Microservices', 'CQRS', 'Event Sourcing', 'Idempotent REST'],
    decisions: [
      'Helped build the platform as microservices with CQRS and event sourcing, keeping reads and writes separate.',
      'Worked on idempotent REST APIs over SQL and NoSQL stores.',
    ],
    result: { value: '85%', label: 'reported reduction in HR administrative work' },
    visual: 'segregation',
  },
];
