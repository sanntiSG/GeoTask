import { useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { prefersReducedMotion } from '../../utils/animations.js';
import styles from './BottomNav.module.css';

interface NavItem {
  path: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    path: '/home',
    label: 'Inicio',
    icon: (active) => <HomeIcon active={active} />,
  },
  {
    path: '/tasks',
    label: 'Tareas',
    icon: (active) => <TaskIcon active={active} />,
  },
  {
    path: '/map',
    label: 'Mapa',
    icon: (active) => <MapIcon active={active} />,
  },
  {
    path: '/trajectory',
    label: 'Trayecto',
    icon: (active) => <TrajectoryIcon active={active} />,
  },
  {
    path: '/settings',
    label: 'Ajustes',
    icon: (active) => <SettingsIcon active={active} />,
  },
];

export function BottomNav() {
  const location = useLocation();
  const navigate  = useNavigate();
  const indicatorRef = useRef<HTMLDivElement>(null);
  const itemRefs     = useRef<(HTMLButtonElement | null)[]>([]);

  const activeIndex = NAV_ITEMS.findIndex((item) => location.pathname.startsWith(item.path));

  useEffect(() => {
    const activeEl = itemRefs.current[activeIndex];
    const indicator = indicatorRef.current;
    if (!activeEl || !indicator) return;

    const rect  = activeEl.getBoundingClientRect();
    const navRect = activeEl.parentElement!.getBoundingClientRect();
    const targetX = rect.left - navRect.left + rect.width / 2 - 20;

    if (prefersReducedMotion()) {
      gsap.set(indicator, { x: targetX });
      return;
    }

    gsap.to(indicator, {
      x: targetX,
      duration: 0.4,
      ease: 'back.out(1.7)',
    });
  }, [activeIndex]);

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <div ref={indicatorRef} className={styles.indicator} />
        {NAV_ITEMS.map((item, i) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              ref={(el) => { itemRefs.current[i] = el; }}
              className={[styles.item, active ? styles.active : ''].join(' ')}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <span className={styles.iconWrap}>{item.icon(active)}</span>
              <span className={styles.label}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* Icons */
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.6}
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.15 : 0}
      />
      <path
        d="M9 22v-7h6v7"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

function TaskIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect
        x="3" y="3" width="18" height="18" rx="4"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.6}
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.15 : 0}
      />
      <path d="M7 12l3 3 7-7" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12" cy="10" r="3"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.6}
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.3 : 0}
      />
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.6}
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.12 : 0}
      />
    </svg>
  );
}

function TrajectoryIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 17 C6 17, 7 7, 12 7 C17 7, 18 17, 20 17"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.6}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="4" cy="17" r="2" fill="currentColor" fillOpacity={active ? 1 : 0.5} />
      <circle cx="20" cy="17" r="2" fill={active ? 'var(--accent)' : 'currentColor'} fillOpacity={active ? 1 : 0.5} />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12" cy="12" r="3"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.6}
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.3 : 0}
      />
      <path
        d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}
