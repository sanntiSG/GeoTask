import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Task, TaskPriority } from '../../types/index.js';
import { checkMorph, prefersReducedMotion } from '../../utils/animations.js';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  onComplete?: (id: string) => void;
  onPress?: (task: Task) => void;
  index?: number;
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export function TaskCard({ task, onComplete, onPress, index = 0 }: TaskCardProps) {
  const cardRef    = useRef<HTMLDivElement>(null);
  const checkRef   = useRef<HTMLButtonElement>(null);
  const isDone     = task.status === 'done';
  const location   = typeof task.locationId === 'object' ? task.locationId : null;

  useEffect(() => {
    if (!cardRef.current || prefersReducedMotion()) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', delay: index * 0.08 },
    );
  }, [index]);

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDone || !checkRef.current || !onComplete) return;

    if (!prefersReducedMotion()) {
      checkMorph(checkRef.current);
    }

    setTimeout(() => onComplete(task._id), prefersReducedMotion() ? 0 : 300);
  };

  return (
    <div
      ref={cardRef}
      className={[styles.card, isDone ? styles.done : ''].join(' ')}
      style={{ '--task-color': task.color } as React.CSSProperties}
      onClick={() => onPress?.(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onPress?.(task)}
    >
      <div className={styles.colorBar} />

      <div className={styles.emoji} aria-hidden>
        {task.emoji}
      </div>

      <div className={styles.content}>
        <p className={styles.title}>{task.title}</p>
        {location && (
          <p className={styles.location}>
            <PinMiniIcon /> {location.name}
          </p>
        )}
        <div className={styles.meta}>
          <span className={[styles.badge, styles[`priority-${task.priority}`]].join(' ')}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.recurrence.enabled && (
            <span className={styles.badge}>
              <RecurIcon /> Recurrente
            </span>
          )}
        </div>
      </div>

      {!isDone && onComplete && (
        <button
          ref={checkRef}
          className={styles.check}
          onClick={handleComplete}
          aria-label={`Completar tarea: ${task.title}`}
        >
          <CheckCircle />
        </button>
      )}

      {isDone && (
        <span className={styles.doneIcon} aria-label="Completada">
          <DoneCircle />
        </span>
      )}
    </div>
  );
}

function PinMiniIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ display: 'inline' }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
    </svg>
  );
}

function RecurIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ display: 'inline' }}>
      <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor" />
    </svg>
  );
}

function CheckCircle() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="11" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function DoneCircle() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="11" fill="var(--success)" />
      <path d="M8 13l3.5 3.5L18 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
