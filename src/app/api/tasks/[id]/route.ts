import type { NextRequest } from 'next/server';
import { getTask, updateTask, deleteTask } from '@/lib/tasks';
import { CATEGORIES, PRIORITIES, type Category, type Priority } from '@/lib/types';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const task = getTask(Number(id));
  if (!task) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(task);
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, description, latitude, longitude, category, priority, radius, completed } =
    body as Record<string, unknown>;

  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return Response.json({ error: 'title cannot be empty' }, { status: 400 });
  }
  if (latitude !== undefined && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
    return Response.json({ error: 'latitude must be between -90 and 90' }, { status: 400 });
  }
  if (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
    return Response.json({ error: 'longitude must be between -180 and 180' }, { status: 400 });
  }
  if (category !== undefined && !CATEGORIES.includes(category as Category)) {
    return Response.json({ error: `category must be one of: ${CATEGORIES.join(', ')}` }, { status: 400 });
  }
  if (priority !== undefined && !PRIORITIES.includes(priority as Priority)) {
    return Response.json({ error: `priority must be one of: ${PRIORITIES.join(', ')}` }, { status: 400 });
  }

  const task = updateTask(Number(id), {
    title: typeof title === 'string' ? title.trim() : undefined,
    description: description !== undefined ? (typeof description === 'string' ? description : null) : undefined,
    latitude: typeof latitude === 'number' ? latitude : undefined,
    longitude: typeof longitude === 'number' ? longitude : undefined,
    category: category ? (category as Category) : undefined,
    priority: priority ? (priority as Priority) : undefined,
    radius: typeof radius === 'number' ? radius : undefined,
    completed: typeof completed === 'boolean' ? completed : undefined,
  });

  if (!task) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(task);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const deleted = deleteTask(Number(id));
  if (!deleted) return Response.json({ error: 'Not found' }, { status: 404 });
  return new Response(null, { status: 204 });
}
