import type { Project } from './types';

export const projects: Project[] = [
  {
    id: 'ekota',
    title: 'EKOTA',
    tagline: 'Customer acquisition for microfinance, rebuilt as an event-sourced platform.',
    role: 'Software Engineer · Launch lead',
    problem:
      'Microfinance organisations needed a faster, more dependable way to acquire and onboard customers.',
    patterns: ['Domain-Driven Design', 'CQRS', 'Event Sourcing', 'Reactive services'],
    decisions: [
      'Modelled the domain with DDD and split commands from queries with CQRS, persisting state as an event stream.',
      'Ran reactive and non-reactive service layers side by side to match each workload’s throughput and concurrency profile.',
      'Took the platform from concept to a revenue-generating production system.',
    ],
    result: { value: '46%', label: 'efficiency boost within the first three months of launch' },
    visual: 'event-fork',
  },
  {
    id: 'fin-pulse',
    title: 'Fin-Pulse',
    tagline: 'Real-time monitoring of company-wide expense and income.',
    role: 'Tech Lead',
    problem:
      'The organisation needed a live view of how expenses are distributed and how they align with income across departments.',
    patterns: ['CQRS', 'Event Sourcing', 'Idempotency', 'Reactive pipelines', 'SQL + NoSQL'],
    decisions: [
      'Used CQRS and event sourcing so every figure can be traced back to the events that produced it.',
      'Idempotent transaction processing, so retries and replays never double-count.',
      'Reactive pipelines feed SQL and NoSQL stores for real-time analytics, budget forecasting and expense-to-revenue reconciliation.',
    ],
    result: { label: 'Real-time analytics, forecasting and reconciliation across departments' },
    visual: 'ledger',
  },
  {
    id: 'dedup',
    title: 'Deduplication System',
    tagline: 'Stopping duplicate records across platforms.',
    role: 'Independent design & architecture',
    problem:
      'Records arriving from multiple platforms, across SQL and NoSQL stores, were producing duplicates at scale.',
    patterns: ['Idempotent pipelines', 'Distributed data', 'SQL + NoSQL'],
    decisions: [
      'Designed and architected the system end to end, spanning relational and document stores.',
      'Built idempotent processing pipelines so the same input always converges to the same record.',
    ],
    result: { label: 'Consistent data and eliminated duplicates at scale' },
    visual: 'converge',
  },
  {
    id: 'validation',
    title: 'Validation Framework',
    tagline: 'One set of validation rules for reactive and blocking services.',
    role: 'Independent design & delivery',
    problem:
      'Enterprise services needed one consistent way to validate input across reactive and non-reactive execution models.',
    patterns: ['Domain-Driven Design', 'Reactive streams', 'Loose coupling'],
    decisions: [
      'Supported both reactive and non-reactive execution with one rule definition.',
      'Designed around DDD bounded contexts for extensibility and loose coupling.',
    ],
    result: { label: 'Adopted as a standard across multiple enterprise services' },
    visual: 'gates',
  },
  {
    id: 'service-template',
    title: 'Enterprise Service Template',
    tagline: 'A production-ready DDD blueprint for new services.',
    role: 'Design & implementation',
    problem:
      'Teams lacked a proven starting point for DDD, CQRS and Event Sourcing, an architectural skill gap in the local industry.',
    patterns: ['DDD', 'CQRS', 'Event Sourcing', 'Idempotency', 'SQL + NoSQL'],
    decisions: [
      'Made DDD, CQRS and Event Sourcing the foundation rather than an afterthought.',
      'Built in idempotency handling, reactive streams and a dual-database persistence strategy.',
    ],
    result: { label: 'A reusable enterprise blueprint for new services' },
    visual: 'layers',
  },
  {
    id: 'employee-happiness',
    title: 'Employee Happiness',
    tagline: 'An internal engagement platform on event-sourced microservices.',
    role: 'Led design & delivery',
    problem: 'HR processes were heavy on administrative work and light on employee engagement.',
    patterns: ['Microservices', 'CQRS', 'Event Sourcing', 'Idempotent REST'],
    decisions: [
      'Microservices with CQRS and event sourcing for clean read/write segregation.',
      'Idempotent REST APIs over integrated SQL and NoSQL stores.',
    ],
    result: { value: '85%', label: 'reduction in administrative tasks; 95% increase in employee satisfaction' },
    visual: 'segregation',
  },
];
