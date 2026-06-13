import db from './db';
import type { Task, TaskInput, TaskPatch, TaskFilters } from './types';

function toTask(row: Record<string, unknown>): Task {
  return {
    ...(row as Omit<Task, 'completed'>),
    completed: row.completed === 1,
  };
}

export function listTasks(filters: TaskFilters = {}): Task[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.category !== undefined) {
    conditions.push('category = ?');
    params.push(filters.category);
  }
  if (filters.priority !== undefined) {
    conditions.push('priority = ?');
    params.push(filters.priority);
  }
  if (filters.completed !== undefined) {
    conditions.push('completed = ?');
    params.push(filters.completed ? 1 : 0);
  }
  if (filters.q) {
    conditions.push('(title LIKE ? OR description LIKE ?)');
    const like = `%${filters.q}%`;
    params.push(like, like);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM tasks ${where} ORDER BY created_at DESC`).all(...params) as Record<string, unknown>[];
  return rows.map(toTask);
}

export function getTask(id: number): Task | undefined {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return row ? toTask(row as Record<string, unknown>) : undefined;
}

export function createTask(input: TaskInput): Task {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, latitude, longitude, category, priority, radius, completed, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);
  const result = stmt.run(
    input.title,
    input.description ?? null,
    input.latitude,
    input.longitude,
    input.category,
    input.priority,
    input.radius ?? 200,
    now,
    now,
  );
  return getTask(result.lastInsertRowid as number)!;
}

export function updateTask(id: number, patch: TaskPatch): Task | undefined {
  const existing = getTask(id);
  if (!existing) return undefined;

  const fields: string[] = [];
  const params: unknown[] = [];

  if (patch.title !== undefined) { fields.push('title = ?'); params.push(patch.title); }
  if (patch.description !== undefined) { fields.push('description = ?'); params.push(patch.description); }
  if (patch.latitude !== undefined) { fields.push('latitude = ?'); params.push(patch.latitude); }
  if (patch.longitude !== undefined) { fields.push('longitude = ?'); params.push(patch.longitude); }
  if (patch.category !== undefined) { fields.push('category = ?'); params.push(patch.category); }
  if (patch.priority !== undefined) { fields.push('priority = ?'); params.push(patch.priority); }
  if (patch.radius !== undefined) { fields.push('radius = ?'); params.push(patch.radius); }
  if (patch.completed !== undefined) { fields.push('completed = ?'); params.push(patch.completed ? 1 : 0); }

  if (fields.length === 0) return existing;

  fields.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(id);

  db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return getTask(id);
}

export function deleteTask(id: number): boolean {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
}
