'use client';

import { useState } from 'react';
import { CATEGORIES, PRIORITIES, type Task, type TaskInput } from '@/lib/types';

interface Props {
  editTask?: Task | null;
  pendingCoords?: { lat: number; lng: number } | null;
  onSaved: () => void;
  onCancel: () => void;
}

// State is initialized from props; the parent passes a key to remount when task changes.
export default function TaskForm({ editTask, pendingCoords, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState(editTask?.title ?? '');
  const [description, setDescription] = useState(editTask?.description ?? '');
  const [latitude, setLatitude] = useState(() => {
    if (editTask) return String(editTask.latitude);
    if (pendingCoords) return pendingCoords.lat.toFixed(6);
    return '';
  });
  const [longitude, setLongitude] = useState(() => {
    if (editTask) return String(editTask.longitude);
    if (pendingCoords) return pendingCoords.lng.toFixed(6);
    return '';
  });
  const [category, setCategory] = useState(editTask?.category ?? CATEGORIES[0]);
  const [priority, setPriority] = useState(editTask?.priority ?? PRIORITIES[1]);
  const [radius, setRadius] = useState(String(editTask?.radius ?? 200));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload: TaskInput = {
      title: title.trim(),
      description: description.trim() || null,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      category,
      priority,
      radius: parseInt(radius, 10),
    };

    try {
      const url = editTask ? `/api/tasks/${editTask.id}` : '/api/tasks';
      const method = editTask ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to save task');
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-xs font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="font-semibold text-gray-800">{editTask ? 'Edit Task' : 'New Task'}</h2>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label className={labelClass}>Title *</label>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          required
        />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          className={`${inputClass} resize-none`}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Latitude *</label>
          <input
            className={inputClass}
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="-34.603"
            required
          />
        </div>
        <div>
          <label className={labelClass}>Longitude *</label>
          <input
            className={inputClass}
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="-58.381"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Category</label>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Priority</label>
          <select className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Alert radius (meters)</label>
        <input
          className={inputClass}
          type="number"
          min={1}
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : editTask ? 'Save Changes' : 'Create Task'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
