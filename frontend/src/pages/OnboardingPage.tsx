import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useAppStore } from '../stores/app.store.js';
import { geolocationService } from '../services/geolocation.service.js';
import { notificationService } from '../services/notification.service.js';
import { Button } from '../components/ui/Button.js';
import { prefersReducedMotion } from '../utils/animations.js';
import styles from './OnboardingPage.module.css';

type Step = 'welcome' | 'a2hs' | 'notifications' | 'location' | 'done';

export function OnboardingPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [notifBlocked, setNotifBlocked] = useState(false);
  const navigate = useNavigate();
  const { setOnboardingComplete, setPermissions } = useAppStore();
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const animateTransition = (direction: 'next' | 'prev') => {
    if (!slideRef.current || prefersReducedMotion()) return Promise.resolve();
    const x = direction === 'next' ? 30 : -30;
    return new Promise<void>((resolve) => {
      gsap.fromTo(
        slideRef.current,
        { opacity: 0, x },
        { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out', onComplete: resolve },
      );
    });
  };

  const goToStep = async (next: Step) => {
    if (!slideRef.current || prefersReducedMotion()) {
      setStep(next);
      return;
    }
    await gsap.to(slideRef.current, { opacity: 0, x: -30, duration: 0.2, ease: 'power2.in' });
    setStep(next);
    await animateTransition('next');
  };

  useEffect(() => {
    animateTransition('next');
  }, [step]);

  const handleA2HS = async () => {
    if (deferredPrompt) {
      const prompt = deferredPrompt as BeforeInstallPromptEvent;
      prompt.prompt();
      const choice = await prompt.userChoice;
      setPermissions({ installed: choice.outcome === 'accepted' });
    }
    goToStep('notifications');
  };

  const handleNotifications = async () => {
    const result = await notificationService.requestPermission();
    // Chrome may suppress the dialog and leave permission as 'default' (silent dismissal).
    // In that case stay on this step and show guidance instead of advancing silently.
    const actualPermission = Notification.permission as 'granted' | 'denied' | 'default';
    if (actualPermission !== 'granted') {
      setNotifBlocked(true);
      setPermissions({ notifications: 'denied' });
      return;
    }
    setNotifBlocked(false);
    setPermissions({ notifications: result });
    await notificationService.subscribe();
    goToStep('location');
  };

  const handleLocation = async () => {
    const result = await geolocationService.requestPermission();
    setPermissions({ geolocation: result });
    goToStep('done');
  };

  const handleFinish = () => {
    setOnboardingComplete(true);
    navigate('/home', { replace: true });
  };

  const STEPS: Record<Step, { emoji: string; title: string; description: string; action: () => void; actionLabel: string; skipLabel?: string }> = {
    welcome: {
      emoji: '👋',
      title: 'Bienvenido a GeoTask',
      description: 'Tu asistente de tareas que te avisa cuando llegás al lugar exacto. Para funcionar bien, necesita algunos permisos.',
      action: () => goToStep('a2hs'),
      actionLabel: 'Comenzar',
    },
    a2hs: {
      emoji: '📱',
      title: 'Agregá a tu inicio',
      description: 'Para recibir notificaciones cuando la app está cerrada, necesitás agregarla a tu pantalla de inicio. Es fundamental para el funcionamiento completo.',
      action: handleA2HS,
      actionLabel: 'Agregar al inicio',
      skipLabel: 'Saltear por ahora',
    },
    notifications: {
      emoji: '🔔',
      title: 'Notificaciones push',
      description: 'Te avisamos cuando llegás a una ubicación con tareas pendientes. Sin este permiso, no podrás recibir recordatorios automáticos.',
      action: handleNotifications,
      actionLabel: 'Permitir notificaciones',
      skipLabel: 'Ahora no',
    },
    location: {
      emoji: '📍',
      title: 'Ubicación en segundo plano',
      description: 'Necesitamos acceder a tu ubicación para detectar cuándo llegás a tus lugares habituales. Nunca compartimos tu ubicación con terceros.',
      action: handleLocation,
      actionLabel: 'Permitir ubicación',
      skipLabel: 'Ahora no',
    },
    done: {
      emoji: '✅',
      title: '¡Listo!',
      description: 'Todo configurado. Ahora podés crear tus primeras tareas con ubicación y empezar a usarla.',
      action: handleFinish,
      actionLabel: 'Empezar a usar GeoTask',
    },
  };

  const current = STEPS[step];
  const stepOrder: Step[] = ['welcome', 'a2hs', 'notifications', 'location', 'done'];
  const currentIdx = stepOrder.indexOf(step);

  return (
    <div className={styles.page}>
      <div className={styles.progress}>
        {stepOrder.map((s, i) => (
          <div
            key={s}
            className={[styles.dot, i <= currentIdx ? styles.dotActive : ''].join(' ')}
          />
        ))}
      </div>

      <div ref={slideRef} className={styles.slide}>
        <div className={styles.emojiWrap}>
          <span className={styles.emoji} role="img" aria-label={current.title}>{current.emoji}</span>
        </div>

        <div className={styles.text}>
          <h2 className={styles.title}>{current.title}</h2>
          <p className={styles.description}>{current.description}</p>
          {step === 'notifications' && notifBlocked && (
            <p className={styles.permissionHint}>
              🔒 El navegador ocultó el diálogo. Hacé clic en el ícono de campana o candado en la barra de direcciones y elegí <strong>Permitir</strong>, luego presioná el botón de abajo.
            </p>
          )}
        </div>

        <div className={styles.actions}>
          <Button onClick={current.action} size="lg" fullWidth>
            {step === 'notifications' && notifBlocked ? 'Reintentar' : current.actionLabel}
          </Button>
          {current.skipLabel && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setNotifBlocked(false);
                const next = stepOrder[currentIdx + 1];
                if (next) goToStep(next);
              }}
            >
              {current.skipLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Minimal type augmentation for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
