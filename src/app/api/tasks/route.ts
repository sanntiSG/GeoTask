import type { NextRequest } from 'next/server';
import { listTasks, createTask } from '@/lib/tasks';
import { CATEGORIES, PRIORITIES, type Category, type Priority } from '@/lib/types';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const category = sp.get('category');
  const priority = sp.get('priority');
  const completedParam = sp.get('completed');
  const q = sp.get('q') ?? undefined;

  if (category && !CATEGORIES.includes(category as Category)) {
    return Response.json({ error: 'Invalid category' }, { status: 400 });
  }
  if (priority && !PRIORITIES.includes(priority as Priority)) {
    return Response.json({ error: 'Invalid priority' }, { status: 400 });
  }

  const tasks = listTasks({
    category: category ? (category as Category) : undefined,
    priority: priority ? (priority as Priority) : undefined,
    completed:
      completedParam === 'true' ? true : completedParam === 'false' ? false : undefined,
    q,
  });
  return Response.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, description, latitude, longitude, category, priority, radius } = body as Record<string, unknown>;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return Response.json({ error: 'title is required' }, { status: 400 });
  }
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    return Response.json({ error: 'latitude must be a number between -90 and 90' }, { status: 400 });
  }
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    return Response.json({ error: 'longitude must be a number between -180 and 180' }, { status: 400 });
  }
  if (!CATEGORIES.includes(category as Category)) {
    return Response.json({ error: `category must be one of: ${CATEGORIES.join(', ')}` }, { status: 400 });
  }
  if (!PRIORITIES.includes(priority as Priority)) {
    return Response.json({ error: `priority must be one of: ${PRIORITIES.join(', ')}` }, { status: 400 });
  }
  if (radius !== undefined && (typeof radius !== 'number' || radius < 1)) {
    return Response.json({ error: 'radius must be a positive number' }, { status: 400 });
  }

  const task = createTask({
    title: title.trim(),
    description: typeof description === 'string' ? description : null,
    latitude,
    longitude,
    category: category as Category,
    priority: priority as Priority,
    radius: typeof radius === 'number' ? radius : 200,
  });

  return Response.json(task, { status: 201 });
}
