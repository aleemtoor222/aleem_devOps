// Everything here is computed from profile.ts, so counts, filters and menus never drift from the data.
import { certifications, experience, pipeline, profile, projects, skills, type Category, type Skill, type SkillGroup, type SkillPart, type Stage } from './profile';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Leaf skills in a group: a skill with sub-badges counts each badge, otherwise it counts once. */
export const skillCount = (g: SkillGroup) => g.items.reduce((n, it) => n + (it.parts?.length ?? 1), 0);
export const toolCount = skills.reduce((n, g) => n + skillCount(g), 0);

export const partName = (p: SkillPart) => (typeof p === 'string' ? p : p.name);
const partTerms = (p: SkillPart) => (typeof p === 'string' ? [p] : [p.name, ...p.aliases]);
const skillTerms = (s: Skill) => [s.name, ...(s.aliases ?? [])];

/** Slugs of the projects whose stack mentions any of the given names. */
export function projectsUsing(terms: string[]): string[] {
  const wanted = new Set(terms.map(norm));
  return projects.filter((p) => p.stack.some((s) => wanted.has(norm(s)))).map((p) => p.slug);
}
export const skillProjects = (s: Skill) => projectsUsing(skillTerms(s));
export const partProjects = (p: SkillPart) => projectsUsing(partTerms(p));

/** Filter tabs for Work, in a fixed order, only for categories that have projects. */
const CATEGORY_ORDER: Category[] = ['Orchestration', 'CI/CD', 'Observability', 'Security', 'Networking'];
export const categories: Category[] = CATEGORY_ORDER.filter((c) => projects.some((p) => p.categories.includes(c)));

/** Tools per pipeline stage, from the `stages` tags on skills. */
export const stageTools: Record<Stage, string[]> = Object.fromEntries(
  pipeline.map((st) => [st.id, skills.flatMap((g) => g.items.filter((it) => it.stages?.includes(st.id)).map((it) => it.name))]),
) as Record<Stage, string[]>;

export const stats = [
  { value: 11, suffix: '+', label: 'servers monitored' }, // from the Infrastructure Monitoring Stack project
  { value: projects.length, suffix: '', label: 'projects shipped' },
  { value: toolCount, suffix: '', label: 'tools in the stack' },
];

export const hasExperience = experience.length > 0 || certifications.length > 0;

/** Main navigation, numbered in page order. Hidden sections drop out automatically. */
export const sections = [
  { id: 'work', label: 'Work' },
  { id: 'stack', label: 'Stack' },
  ...(hasExperience ? [{ id: 'experience', label: 'Experience' }] : []),
  { id: 'contact', label: 'Contact' },
].map((s, i) => ({ ...s, index: String(i + 1).padStart(2, '0') }));

/** Short, stable pseudo commit hash for the git-log styled timeline (decoration only). */
export function shortHash(input: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

export const firstName = profile.firstName;
