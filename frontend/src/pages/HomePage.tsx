import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useAuth } from '../hooks/useAuth.js';
import { useTasks } from '../hooks/useTasks.js';
import { useLocations } from '../hooks/useLocations.js';
import { useGeolocationSync } from '../hooks/useGeolocation.js';
import { TaskCard } from '../components/tasks/TaskCard.js';
import { useCompleteTask } from '../hooks/useTasks.js';
import { revealList, prefersReducedMotion } from '../utils/animations.js';
import styles from './HomePage.module.css';

export function HomePage() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const { data: tasks = [] }     = useTasks({ status: 'pending' });
  const { data: locations = [] } = useLocations();
  const completeTask = useCompleteTask();
  const headerRef    = useRef<HTMLDivElement>(null);
  const cardsRef     = useRef<HTMLDivElement>(null);

  useGeolocationSync();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
      );
      if (cardsRef.current) {
        const cards = cardsRef.current.querySelectorAll('[data-card]');
        if (cards.length) revealList(Array.from(cards), 0.2);
      }
    });
    return () => ctx.revert();
  }, [tasks.length]);

  const now   = new Date();
  const hour  = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = user?.name?.split(' ')[0] ?? '';

  const frequentLocations = [...locations]
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, 3);

  const todayDay = now.getDay();
  const todayTasks = tasks.filter(
    (t) => t.recurrence.enabled && t.recurrence.days.includes(todayDay),
  );

  return (
    <div className={styles.page}>
      <div ref={headerRef} className={styles.header}>
        <div className={styles.greeting}>
          <h1 className={styles.title}>
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className={styles.subtitle}>
            {tasks.length === 0
              ? 'Sin tareas pendientes 🎉'
              : `${tasks.length} tarea${tasks.length !== 1 ? 's' : ''} pendiente${tasks.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {user?.avatar && (
          <img src={user.avatar} alt={user.name} className={styles.avatar} referrerPolicy="no-referrer" />
        )}
      </div>

      <div ref={cardsRef} className={styles.content}>
        {/* Frequent locations */}
        {frequentLocations.length > 0 && (
          <section className={styles.section} data-card>
            <h2 className={styles.sectionTitle}>Lugares frecuentes</h2>
            <div className={styles.locationChips}>
              {frequentLocations.map((loc) => (
                <button
                  key={loc._id}
                  className={styles.chip}
                  onClick={() => navigate(`/map?location=${loc._id}`)}
                >
                  <span className={styles.chipIcon}>📍</span>
                  <span className={styles.chipLabel}>{loc.name}</span>
                  {tasks.filter((t) => {
                    const lid = typeof t.locationId === 'object' ? t.locationId._id : t.locationId;
                    return lid === loc._id;
                  }).length > 0 && (
                    <span className={styles.chipBadge}>
                      {tasks.filter((t) => {
                        const lid = typeof t.locationId === 'object' ? t.locationId._id : t.locationId;
                        return lid === loc._id;
                      }).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Today's recurring tasks */}
        {todayTasks.length > 0 && (
          <section className={styles.section} data-card>
            <h2 className={styles.sectionTitle}>Hoy toca</h2>
            <div className={styles.taskList}>
              {todayTasks.slice(0, 3).map((task, i) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  index={i}
                  onComplete={(id) => completeTask.mutate(id)}
                  onPress={(t) => navigate(`/tasks?id=${t._id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* All pending tasks */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Tareas pendientes</h2>
            <button className={styles.seeAll} onClick={() => navigate('/tasks')}>
              Ver todas
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className={styles.empty} data-card>
              <span className={styles.emptyEmoji}>✨</span>
              <p className={styles.emptyTitle}>Todo al día</p>
              <p className={styles.emptyText}>
                No tenés tareas pendientes. Creá una nueva tarea con una ubicación.
              </p>
              <button className={styles.createBtn} onClick={() => navigate('/tasks/new')}>
                + Nueva tarea
              </button>
            </div>
          ) : (
            <div className={styles.taskList}>
              {tasks.slice(0, 5).map((task, i) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  index={i}
                  onComplete={(id) => completeTask.mutate(id)}
                  onPress={(t) => navigate(`/tasks?id=${t._id}`)}
                />
              ))}
              {tasks.length > 5 && (
                <button className={styles.moreBtn} onClick={() => navigate('/tasks')}>
                  Ver {tasks.length - 5} más
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
