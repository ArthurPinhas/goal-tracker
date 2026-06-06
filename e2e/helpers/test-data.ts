export function uniqueName(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export function buildGoalData(overrides: any = {}): any {
  return {
    title: uniqueName('goal'),
    description: '',
    notes: '',
    ...overrides
  };
}

export function buildSubtaskData(overrides: any = {}): any {
  return {
    title: uniqueName('subtask'),
    effort: 1,
    notes: '',
    ...overrides
  };
}
