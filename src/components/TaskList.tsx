'use client';

import { useState } from 'react';
import { CATEGORIES, PRIORITIES, type Task, type Category, type Priority } from '@/lib/types';

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onRefresh: () => void;
}

const priorityColor: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export default function TaskList({ tasks, onEdit, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | ''>('');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
  const [filterCompleted, setFilterCompleted] = useState<'all' | 'active' | 'done'>('all');

  const filtered = tasks.filter((t) => {
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterCompleted === 'active' && t.completed) return false;
    if (filterCompleted === 'done' && !t.completed) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(t.description ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  async function toggleComplete(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    });
    onRefresh();
  }

  async function handleDelete(task: Task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
    onRefresh();
  }

  const selectClass =
    'rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[120px] rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select className={selectClass} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as Category | '')}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className={selectClass} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as Priority | '')}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className={selectClass} value={filterCompleted} onChange={(e) => setFilterCompleted(e.target.value as 'all' | 'active' | 'done')}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="done">Done</option>
        </select>
      </div>

      <p className="text-xs text-gray-500">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>

      <ul className="flex flex-col gap-2 overflow-y-auto">
        {filtered.length === 0 && (
          <li className="text-sm text-gray-400 text-center py-8">No tasks match your filters.</li>
        )}
        {filtered.map((task) => (
          <li
            key={task.id}
            className={`rounded-xl border p-3 flex flex-col gap-1 ${task.completed ? 'opacity-60 bg-gray-50' : 'bg-white'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleComplete(task)}
                  className="mt-0.5 shrink-0 h-4 w-4 accent-blue-600"
                />
                <span className={`text-sm font-medium truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {task.title}
                </span>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => onEdit(task)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(task)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
            {task.description && (
              <p className="text-xs text-gray-500 pl-6 line-clamp-2">{task.description}</p>
            )}
            <div className="flex gap-1.5 pl-6 flex-wrap">
              <span className="text-xs text-gray-400">{task.category}</span>
              <span className={`text-xs px-1.5 rounded ${priorityColor[task.priority]}`}>{task.priority}</span>
              <span className="text-xs text-gray-400">{task.radius}m radius</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
