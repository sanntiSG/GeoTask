import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTasks, useCreateTask, useCompleteTask, useDeleteTask } from '../hooks/useTasks.js';
import { useLocations, useCreateLocation } from '../hooks/useLocations.js';
import { TaskCard } from '../components/tasks/TaskCard.js';
import { Modal } from '../components/ui/Modal.js';
import { Button } from '../components/ui/Button.js';
import { LocationSearch } from '../components/locations/LocationSearch.js';
import { Spinner } from '../components/ui/Spinner.js';
import { Task, TaskStatus, TaskPriority, Location, PhotonFeature } from '../types/index.js';
import { revealList, prefersReducedMotion } from '../utils/animations.js';
import styles from './TasksPage.module.css';

const EMOJI_OPTIONS = ['📍', '🛒', '💊', '📦', '🍽️', '🏋️', '📚', '💼', '🔧', '🎯', '🏠', '✈️', '🚗', '💰', '📱'];
const COLORS = ['#0a84ff', '#30d158', '#ff9f0a', '#ff453a', '#bf5af2', '#32ade6', '#ffd60a'];

type Filter = TaskStatus | 'all';

export function TasksPage() {
  const [searchParams]        = useSearchParams();
  const [filter, setFilter]   = useState<Filter>('all');
  const [showForm, setShowForm] = useState(searchParams.get('new') === '1');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks = [], isLoading } = useTasks(filter === 'all' ? undefined : { status: filter });
  const { data: locations = [] }        = useLocations();
  const completeTask = useCompleteTask();
  const deleteTask   = useDeleteTask();
  const listRef      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current || prefersReducedMotion()) return;
    const cards = listRef.current.querySelectorAll('[data-task-card]');
    if (cards.length) revealList(Array.from(cards));
  }, [tasks.length, filter]);

  const FILTERS: { label: string; value: Filter }[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Pendientes', value: 'pending' },
    { label: 'Hechas', value: 'done' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tareas</h1>
        <button className={styles.addBtn} onClick={() => setShowForm(true)} aria-label="Nueva tarea">
          <PlusIcon />
        </button>
      </div>

      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={[styles.filter, filter === f.value ? styles.filterActive : ''].join(' ')}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div ref={listRef} className={styles.list}>
        {isLoading ? (
          <div className={styles.loading}><Spinner /></div>
        ) : tasks.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyEmoji}>📋</span>
            <p className={styles.emptyText}>
              {filter === 'done' ? 'Aún no completaste ninguna tarea.' : 'No hay tareas. ¡Creá una!'}
            </p>
          </div>
        ) : (
          tasks.map((task, i) => (
            <div key={task._id} data-task-card>
              <TaskCard
                task={task}
                index={i}
                onComplete={(id) => completeTask.mutate(id)}
                onPress={(t) => setSelectedTask(t)}
              />
            </div>
          ))
        )}
      </div>

      {/* Create task modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nueva tarea" size="sheet">
        <TaskForm
          locations={locations}
          onClose={() => setShowForm(false)}
        />
      </Modal>

      {/* Task detail modal */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={selectedTask.emoji + ' ' + selectedTask.title}
          size="sheet"
        >
          <TaskDetail
            task={selectedTask}
            onDelete={(id) => {
              deleteTask.mutate(id);
              setSelectedTask(null);
            }}
            onClose={() => setSelectedTask(null)}
          />
        </Modal>
      )}
    </div>
  );
}

/* ---- Task Form ---- */
interface TaskFormProps {
  locations: Location[];
  onClose: () => void;
}

function TaskForm({ locations, onClose }: TaskFormProps) {
  const createTask     = useCreateTask();
  const createLocation = useCreateLocation();

  const [title, setTitle]       = useState('');
  const [emoji, setEmoji]       = useState('📍');
  const [color, setColor]       = useState('#0a84ff');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [locationId, setLocationId] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [newLocCoords, setNewLocCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [notifyAgainEnabled, setNotifyAgainEnabled] = useState(false);
  const [notifyAgainAfter, setNotifyAgainAfter]     = useState(30);
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);

  const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const handleLocationSelect = (feature: PhotonFeature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const parts = [feature.properties.name, feature.properties.city, feature.properties.country].filter(Boolean);
    setNewLocName(parts.join(', '));
    setNewLocCoords({ lat, lng });
    setLocationId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalLocationId = locationId;

    if (!finalLocationId && newLocCoords && newLocName) {
      const result = await createLocation.mutateAsync({
        name: newLocName,
        coordinates: newLocCoords,
      });
      finalLocationId = result.data._id;
    }

    if (!finalLocationId) return;

    await createTask.mutateAsync({
      title: title.trim(),
      emoji,
      color,
      priority,
      locationId: finalLocationId,
      recurrence: { enabled: recurrenceDays.length > 0, days: recurrenceDays },
      notifyAgainAfter,
      notifyAgainEnabled,
    });

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Emoji + Title */}
      <div className={styles.titleRow}>
        <div className={styles.emojiPicker}>
          <div className={styles.emojiGrid}>
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                className={[styles.emojiOpt, emoji === e ? styles.emojiSelected : ''].join(' ')}
                onClick={() => setEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <input
          type="text"
          placeholder="¿Qué tenés que hacer?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={styles.titleInput}
          maxLength={200}
          required
          autoFocus
        />
      </div>

      {/* Color */}
      <div className={styles.field}>
        <label className={styles.label}>Color</label>
        <div className={styles.colorRow}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={[styles.colorDot, color === c ? styles.colorSelected : ''].join(' ')}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      {/* Priority */}
      <div className={styles.field}>
        <label className={styles.label}>Prioridad</label>
        <div className={styles.segmented}>
          {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
            <button
              key={p}
              type="button"
              className={[styles.seg, priority === p ? styles.segActive : ''].join(' ')}
              onClick={() => setPriority(p)}
            >
              {p === 'low' ? 'Baja' : p === 'medium' ? 'Media' : p === 'high' ? 'Alta' : 'Urgente'}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className={styles.field}>
        <label className={styles.label}>Ubicación</label>
        {locations.length > 0 && (
          <select
            className={styles.select}
            value={locationId}
            onChange={(e) => { setLocationId(e.target.value); setNewLocCoords(null); setNewLocName(''); }}
          >
            <option value="">— Buscar nueva ubicación —</option>
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>{loc.name}</option>
            ))}
          </select>
        )}
        {!locationId && (
          <LocationSearch onSelect={handleLocationSelect} placeholder="Buscar lugar…" initialValue={newLocName} />
        )}
      </div>

      {/* Recurrence */}
      <div className={styles.field}>
        <label className={styles.label}>Recurrencia</label>
        <div className={styles.dayRow}>
          {DAY_LABELS.map((d, i) => (
            <button
              key={i}
              type="button"
              className={[styles.dayBtn, recurrenceDays.includes(i) ? styles.dayActive : ''].join(' ')}
              onClick={() =>
                setRecurrenceDays((prev) =>
                  prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
                )
              }
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Re-notify */}
      <div className={styles.field}>
        <label className={styles.toggleRow}>
          <span className={styles.label}>Volver a notificar si no la marco</span>
          <input
            type="checkbox"
            checked={notifyAgainEnabled}
            onChange={(e) => setNotifyAgainEnabled(e.target.checked)}
            className={styles.checkbox}
          />
        </label>
        {notifyAgainEnabled && (
          <div className={styles.renotifyRow}>
            <span className={styles.text2}>Cada</span>
            <input
              type="number"
              min={1}
              max={1440}
              value={notifyAgainAfter}
              onChange={(e) => setNotifyAgainAfter(Number(e.target.value))}
              className={styles.numInput}
            />
            <span className={styles.text2}>minutos</span>
          </div>
        )}
      </div>

      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={createTask.isPending || createLocation.isPending}
        disabled={!title.trim() || (!locationId && !newLocCoords)}
      >
        Guardar tarea
      </Button>
    </form>
  );
}

/* ---- Task Detail ---- */
function TaskDetail({ task, onDelete, onClose: _onClose }: { task: Task; onDelete: (id: string) => void; onClose: () => void }) {
  const location = typeof task.locationId === 'object' ? task.locationId : null;
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className={styles.detail}>
      <div className={styles.detailHeader}>
        <span className={styles.detailEmoji}>{task.emoji}</span>
        <div>
          <p className={styles.detailTitle}>{task.title}</p>
          {location && <p className={styles.detailLoc}>📍 {location.name}</p>}
        </div>
      </div>

      <div className={styles.detailMeta}>
        <DetailRow label="Estado" value={task.status === 'done' ? '✅ Completada' : '⏳ Pendiente'} />
        <DetailRow label="Prioridad" value={task.priority} />
        {task.recurrence.enabled && (
          <DetailRow label="Recurrencia" value={`Días: ${task.recurrence.days.join(', ')}`} />
        )}
      </div>

      {!showConfirm ? (
        <Button variant="danger" fullWidth onClick={() => setShowConfirm(true)}>
          Eliminar tarea
        </Button>
      ) : (
        <div className={styles.confirmRow}>
          <p className={styles.confirmText}>¿Eliminar esta tarea?</p>
          <div className={styles.confirmBtns}>
            <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancelar</Button>
            <Button variant="danger" onClick={() => onDelete(task._id)}>Eliminar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
