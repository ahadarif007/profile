export interface ExternalLink {
  label: string;
  href: string;
}

export interface Profile {
  name: string;
  brand: string;
  roles: string[];
  location: string;
  availability: string;
  heroLines: string[];
  heroIntro: string;
  manifesto: [string, string];
  manifestoBody: string;
  email: string;
  links: ExternalLink[];
}

export interface TimelineEntry {
  start: string;
  end: string;
  title: string;
  org: string;
  kind: 'work' | 'study' | 'teaching';
}

export interface Education {
  degree: string;
  institution: string;
  place: string;
  period: string;
  result: string;
}

export type ProjectVisual = 'event-fork' | 'ledger' | 'converge' | 'gates' | 'layers' | 'segregation';

export interface Project {
  id: string;
  title: string;
  tagline: string;
  role: string;
  problem: string;
  patterns: string[];
  decisions: string[];
  /** Outcome exactly as stated in the CV; omitted when the CV states none. */
  result?: { value?: string; label: string };
  visual: ProjectVisual;
}

export interface Publication {
  title: string;
  status: string;
  venue?: string;
  doi?: string;
  links: ExternalLink[];
  summary: string[];
}

export interface FeaturedPaper extends Publication {
  /** Plain reference line, as listed by the publisher (no author list on the site). */
  reference: string;
  facts: { value: string; label: string }[];
  pipeline: string[];
}

export interface SkillGroup {
  id: string;
  name: string;
  items: string[];
}

export interface ArchitectureNode {
  id: string;
  label: string;
  kind: 'edge' | 'write' | 'store' | 'read' | 'ops';
  detail: string;
  usedIn: string[];
}

export interface Principle {
  title: string;
  body: string;
}
