const STORAGE_KEY = "goal-tracker-templates";

export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string | null;
  notes: string;
  subtasks: { title: string; effort: number | null }[];
  createdAt: number;
}

function readTemplates(): GoalTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GoalTemplate[];
  } catch {
    return [];
  }
}

function writeTemplates(templates: GoalTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function listTemplates(): GoalTemplate[] {
  return readTemplates();
}

export function saveTemplate(template: Omit<GoalTemplate, "id" | "createdAt">): GoalTemplate {
  const t: GoalTemplate = {
    ...template,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const all = readTemplates();
  writeTemplates([t, ...all]);
  return t;
}

export function deleteTemplate(id: string): void {
  writeTemplates(readTemplates().filter((t) => t.id !== id));
}

export function renameTemplate(id: string, name: string): void {
  writeTemplates(readTemplates().map((t) => (t.id === id ? { ...t, name } : t)));
}
