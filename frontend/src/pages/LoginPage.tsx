import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useAuth } from '../hooks/useAuth.js';
import { prefersReducedMotion } from '../utils/animations.js';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { isAuthenticated, loginUrl, isLoading } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef      = useRef<HTMLDivElement>(null);
  const contentRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo(logoRef.current, { opacity: 0, scale: 0.6, y: -20 }, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'back.out(1.7)' })
        .fromTo(contentRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3');
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className={styles.page}>
      <div className={styles.map}>
        <MapBackground />
      </div>

      <div className={styles.content}>
        <div ref={logoRef} className={styles.logo}>
          <div className={styles.logoIcon}>
            <PinIcon />
          </div>
          <span className={styles.logoText}>GeoTask</span>
        </div>

        <div ref={contentRef} className={styles.card}>
          <h1 className={styles.title}>Recordatorios<br />inteligentes</h1>
          <p className={styles.subtitle}>
            Tus tareas te avisan cuando llegas. Sin que tengas que recordar abrirla.
          </p>

          <a href={loginUrl} className={styles.googleBtn}>
            <GoogleIcon />
            <span>Continuar con Google</span>
          </a>

          <p className={styles.legal}>
            Al continuar, aceptás que GeoTask acceda a tu ubicación para enviarte notificaciones basadas en proximidad.
          </p>
        </div>
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" width="28" height="28">
      <circle cx="20" cy="17" r="7" fill="white" fillOpacity="0.9" />
      <path d="M20 4C13.37 4 8 9.37 8 16c0 9.34 12 20 12 20s12-10.66 12-20c0-6.63-5.37-12-12-12z" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.08 0-3.84-1.4-4.47-3.29H1.83v2.07A8 8 0 008.98 17z"/>
      <path fill="#FBBC05" d="M4.51 10.52A4.8 4.8 0 014.26 9c0-.52.09-1.02.25-1.52V5.41H1.83A8 8 0 001 9c0 1.3.31 2.52.83 3.59l2.68-2.07z"/>
      <path fill="#EA4335" d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.51 7.5C5.14 5.61 6.9 3.58 8.98 3.58z"/>
    </svg>
  );
}

function MapBackground() {
  return (
    <svg viewBox="0 0 390 600" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.mapSvg}>
      <defs>
        <radialGradient id="centerGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="oklch(62% 0.19 250)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width="390" height="600" fill="url(#centerGlow)" />
      {/* Simulated streets */}
      {[60, 120, 180, 240, 300, 360].map((y) => (
        <line key={`h${y}`} x1="0" y1={y} x2="390" y2={y} stroke="white" strokeOpacity="0.04" strokeWidth="1" />
      ))}
      {[60, 130, 200, 260, 330].map((x) => (
        <line key={`v${x}`} x1={x} y1="0" x2={x} y2="600" stroke="white" strokeOpacity="0.04" strokeWidth="1" />
      ))}
      {/* Accent roads */}
      <path d="M0 240 Q130 220 195 200 Q260 180 390 160" stroke="white" strokeOpacity="0.08" strokeWidth="2" fill="none" />
      <path d="M0 300 Q100 280 195 300 Q290 320 390 290" stroke="white" strokeOpacity="0.06" strokeWidth="2" fill="none" />
      {/* Pins */}
      <circle cx="195" cy="200" r="10" fill="oklch(62% 0.19 250)" fillOpacity="0.7" />
      <circle cx="195" cy="200" r="18" fill="oklch(62% 0.19 250)" fillOpacity="0.15" />
      <circle cx="120" cy="280" r="8" fill="oklch(68% 0.19 155)" fillOpacity="0.6" />
      <circle cx="280" cy="320" r="7" fill="oklch(72% 0.19 55)" fillOpacity="0.5" />
      <circle cx="90" cy="380" r="6" fill="oklch(62% 0.19 250)" fillOpacity="0.4" />
    </svg>
  );
}
