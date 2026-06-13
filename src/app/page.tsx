'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import TaskList from '@/components/TaskList';
import TaskForm from '@/components/TaskForm';
import { useProximityAlerts } from '@/hooks/useProximityAlerts';
import type { Task } from '@/lib/types';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
      Loading map…
    </div>
  ),
});

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showForm, setShowForm] = useState(false);

  useProximityAlerts(tasks);

  // Initial load via inline effect (avoids set-state-in-effect lint rule)
  useEffect(() => {
    let active = true;
    fetch('/api/tasks')
      .then((r) => r.json())
      .then((data: Task[]) => { if (active) setTasks(data); });
    return () => { active = false; };
  }, []);

  // Called from event handlers (not effects) after mutations
  const fetchTasks = useCallback(() => {
    fetch('/api/tasks')
      .then((r) => r.json())
      .then((data: Task[]) => setTasks(data));
  }, []);

  function handleMapClick(lat: number, lng: number) {
    setPendingCoords({ lat, lng });
    setEditTask(null);
    setShowForm(true);
  }

  function handleEdit(task: Task) {
    setEditTask(task);
    setPendingCoords(null);
    setShowForm(true);
  }

  function handleFormSaved() {
    setShowForm(false);
    setEditTask(null);
    setPendingCoords(null);
    fetchTasks();
  }

  function handleFormCancel() {
    setShowForm(false);
    setEditTask(null);
    setPendingCoords(null);
  }

  // Key resets the form when switching between tasks or new-task mode
  const formKey = editTask ? `edit-${editTask.id}` : pendingCoords ? `new-${pendingCoords.lat},${pendingCoords.lng}` : 'new';

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">GeoTask</h1>
        <button
          onClick={() => { setEditTask(null); setPendingCoords(null); setShowForm(true); }}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Task
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        <div className="flex-1 min-w-0 rounded-xl overflow-hidden shadow border border-gray-200">
          <MapView
            tasks={tasks}
            pendingCoords={pendingCoords}
            onMapClick={handleMapClick}
            onTaskClick={handleEdit}
          />
        </div>

        <div className="w-80 shrink-0 bg-white rounded-xl border border-gray-200 shadow overflow-y-auto p-4">
          {showForm ? (
            <TaskForm
              key={formKey}
              editTask={editTask}
              pendingCoords={pendingCoords}
              onSaved={handleFormSaved}
              onCancel={handleFormCancel}
            />
          ) : (
            <TaskList
              tasks={tasks}
              onEdit={handleEdit}
              onRefresh={fetchTasks}
            />
          )}
        </div>
      </div>

      {!showForm && (
        <p className="text-center text-xs text-gray-400 pb-2">
          Click anywhere on the map to place a new task
        </p>
      )}
    </div>
  );
}
