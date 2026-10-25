import type { ArchitectureNode } from './types';

export const architectureNote =
  'This is a representative design built from patterns I used in EKOTA, Fin-Pulse, Employee Happiness and the service template. It isn’t a diagram of any one production system.';

export const architectureNodes: ArchitectureNode[] = [
  {
    id: 'client',
    label: 'Client',
    kind: 'edge',
    detail: 'Field apps, dashboards and other services. Every write request carries an idempotency key.',
    usedIn: ['EKOTA', 'Fin-Pulse'],
  },
  {
    id: 'gate',
    label: 'Idempotency gate',
    kind: 'write',
    detail:
      'Checks the key before anything executes. A retried request returns the original outcome instead of running twice.',
    usedIn: ['Deduplication System', 'Fin-Pulse', 'Employee Happiness'],
  },
  {
    id: 'command',
    label: 'Command handler',
    kind: 'write',
    detail:
      'Validates the request with the shared validation framework, using the same rules whether the service is reactive or blocking.',
    usedIn: ['Validation Framework', 'Service Template'],
  },
  {
    id: 'aggregate',
    label: 'Aggregate',
    kind: 'write',
    detail:
      'The DDD consistency boundary. It decides whether a command is allowed and emits domain events; it never mutates shared state directly.',
    usedIn: ['EKOTA', 'Service Template'],
  },
  {
    id: 'events',
    label: 'Event store',
    kind: 'store',
    detail:
      'An append-only log of everything that happened. Current state is a fold over events, so every figure is auditable and replayable.',
    usedIn: ['EKOTA', 'Fin-Pulse', 'Employee Happiness'],
  },
  {
    id: 'projector',
    label: 'Projectors',
    kind: 'read',
    detail: 'Consume events and build read models. Idempotent, so replaying the stream rebuilds identical views.',
    usedIn: ['Fin-Pulse', 'Service Template'],
  },
  {
    id: 'sql',
    label: 'Read model · SQL',
    kind: 'store',
    detail: 'Relational projections for reporting, reconciliation and anything that needs joins.',
    usedIn: ['Fin-Pulse', 'Employee Happiness'],
  },
  {
    id: 'nosql',
    label: 'Read model · NoSQL',
    kind: 'store',
    detail: 'Document, cache and search projections (MongoDB, Redis, Elasticsearch) shaped for fast queries.',
    usedIn: ['Deduplication System', 'Employee Happiness'],
  },
  {
    id: 'query',
    label: 'Query API',
    kind: 'read',
    detail: 'Serves reads without touching the write side. That separation is the whole point of CQRS.',
    usedIn: ['EKOTA', 'Employee Happiness'],
  },
  {
    id: 'observe',
    label: 'Observability',
    kind: 'ops',
    detail: 'ELK and Grafana watch the whole flow. The number I watch most is projection lag: how far the read models trail the event log.',
    usedIn: ['Platform operations'],
  },
];

/** Directed edges between nodes, drawn as data paths. */
export const architectureEdges: [string, string][] = [
  ['client', 'gate'],
  ['gate', 'command'],
  ['command', 'aggregate'],
  ['aggregate', 'events'],
  ['events', 'projector'],
  ['projector', 'sql'],
  ['projector', 'nosql'],
  ['sql', 'query'],
  ['nosql', 'query'],
  ['query', 'client'],
  ['events', 'observe'],
  ['projector', 'observe'],
];

export function architectureNode(id: string): ArchitectureNode {
  const node = architectureNodes.find((n) => n.id === id);
  if (!node) throw new Error(`Unknown architecture node: ${id}`);
  return node;
}
