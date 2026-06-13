export const CATEGORIES = ['work', 'personal', 'shopping', 'errand', 'other'] as const;
export const PRIORITIES = ['low', 'medium', 'high'] as const;

export type Category = (typeof CATEGORIES)[number];
export type Priority = (typeof PRIORITIES)[number];

export interface Task {
  id: number;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  category: Category;
  priority: Priority;
  radius: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  category: Category;
  priority: Priority;
  radius?: number;
}

export interface TaskPatch {
  title?: string;
  description?: string | null;
  latitude?: number;
  longitude?: number;
  category?: Category;
  priority?: Priority;
  radius?: number;
  completed?: boolean;
}

export interface TaskFilters {
  category?: Category;
  priority?: Priority;
  completed?: boolean;
  q?: string;
}
