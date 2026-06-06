const PB_URL = 'http://127.0.0.1:8090';

export class APIHelpers {
  constructor(private authToken: string, private userId: string) {}

  private async fetchPB(path: string, options: RequestInit = {}) {
    const res = await fetch(`${PB_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authToken,
        ...options.headers,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API Error ${res.status}: ${text}`);
    }
    if (res.status !== 204) {
      return res.json();
    }
  }

  // Goal CRUD
  async createGoal(title: string, opts: any = {}): Promise<string> {
    const data = await this.fetchPB('/api/collections/goals/records', {
      method: 'POST',
      body: JSON.stringify({
        name: title,
        user: this.userId,
        ...opts,
      }),
    });
    return data.id;
  }

  async getGoal(goalId: string): Promise<any> {
    return this.fetchPB(`/api/collections/goals/records/${goalId}`);
  }

  async updateGoal(goalId: string, data: any): Promise<void> {
    await this.fetchPB(`/api/collections/goals/records/${goalId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteGoal(goalId: string): Promise<void> {
    try {
      const subtasksRes = await this.fetchPB(`/api/collections/subtasks/records?filter=(goal='${goalId}')&perPage=500`);
      const subtasks = subtasksRes?.items || [];
      for (const sub of subtasks) {
        await this.fetchPB(`/api/collections/subtasks/records/${sub.id}`, { method: 'DELETE' });
      }
    } catch (e) {
      // ignore
    }
    await this.fetchPB(`/api/collections/goals/records/${goalId}`, {
      method: 'DELETE',
    });
  }

  async getAllGoals(): Promise<any[]> {
    const res = await this.fetchPB(`/api/collections/goals/records?filter=(user='${this.userId}')&perPage=500`);
    return res.items || [];
  }

  async deleteAllGoals(): Promise<void> {
    const goals = await this.getAllGoals();
    for (const goal of goals) {
      try {
        const subtasksRes = await this.fetchPB(`/api/collections/subtasks/records?filter=(goal='${goal.id}')&perPage=500`);
        const subtasks = subtasksRes.items || [];
        for (const sub of subtasks) {
          await this.fetchPB(`/api/collections/subtasks/records/${sub.id}`, { method: 'DELETE' });
        }
      } catch (e) {
        // ignore if subtasks fetch fails
      }
      await this.deleteGoal(goal.id);
    }
  }

  // Subtask CRUD
  async createSubtask(goalId: string, title: string, opts: { effort?: number; notes?: string; completed?: boolean } = {}): Promise<string> {
    const data = await this.fetchPB('/api/collections/subtasks/records', {
      method: 'POST',
      body: JSON.stringify({
        goal: goalId,
        name: title,
        user: this.userId,
        ...opts,
      }),
    });
    return data.id;
  }

  async getSubtasks(goalId: string): Promise<any[]> {
    const res = await this.fetchPB(`/api/collections/subtasks/records?filter=(goal='${goalId}' && user='${this.userId}')`);
    return res.items || [];
  }

  async updateSubtask(subtaskId: string, data: any): Promise<void> {
    await this.fetchPB(`/api/collections/subtasks/records/${subtaskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSubtask(subtaskId: string): Promise<void> {
    await this.fetchPB(`/api/collections/subtasks/records/${subtaskId}`, {
      method: 'DELETE',
    });
  }

  // Category CRUD
  async createCategory(name: string, opts: any = {}): Promise<string> {
    const data = await this.fetchPB('/api/collections/categories/records', {
      method: 'POST',
      body: JSON.stringify({
        name,
        user: this.userId,
        ...opts,
      }),
    });
    return data.id;
  }

  async getAllCategories(): Promise<any[]> {
    const res = await this.fetchPB(`/api/collections/categories/records?filter=(user='${this.userId}')`);
    return res.items || [];
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await this.fetchPB(`/api/collections/categories/records/${categoryId}`, { method: 'DELETE' });
  }

  async deleteAllCategories(): Promise<void> {
    const cats = await this.getAllCategories();
    for (const cat of cats) {
      await this.deleteCategory(cat.id);
    }
  }
}
