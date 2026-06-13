import { gsap } from 'gsap';

export const EASE = {
  smooth: 'power2.out',
  bounce: 'back.out(1.7)',
  spring: 'elastic.out(1, 0.75)',
  sharp: 'power3.inOut',
} as const;

export const DURATION = {
  fast: 0.2,
  normal: 0.35,
  slow: 0.6,
} as const;

export function revealList(elements: Element[], delay = 0): gsap.core.Tween {
  return gsap.fromTo(
    elements,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: DURATION.normal,
      stagger: 0.08,
      ease: EASE.smooth,
      delay,
    },
  );
}

export function revealFade(element: Element, delay = 0): gsap.core.Tween {
  return gsap.fromTo(
    element,
    { opacity: 0, scale: 0.96 },
    { opacity: 1, scale: 1, duration: DURATION.normal, ease: EASE.smooth, delay },
  );
}

export function pinEntrance(elements: Element[]): gsap.core.Tween {
  return gsap.fromTo(
    elements,
    { opacity: 0, y: -20, scale: 0 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: DURATION.slow,
      stagger: 0.05,
      ease: EASE.bounce,
    },
  );
}

export function checkMorph(element: Element): gsap.core.Timeline {
  const tl = gsap.timeline();
  tl.to(element, { scale: 0.8, duration: 0.1, ease: EASE.sharp })
    .to(element, { scale: 1.2, duration: 0.15, ease: EASE.smooth })
    .to(element, { scale: 1, duration: 0.2, ease: EASE.bounce });
  return tl;
}

export function pageEnter(element: Element): gsap.core.Tween {
  return gsap.fromTo(
    element,
    { opacity: 0, x: 20 },
    { opacity: 1, x: 0, duration: DURATION.normal, ease: EASE.smooth },
  );
}

export function pageExit(element: Element): gsap.core.Tween {
  return gsap.to(element, {
    opacity: 0,
    x: -20,
    duration: DURATION.fast,
    ease: EASE.sharp,
  });
}

export function slideUp(element: Element): gsap.core.Tween {
  return gsap.fromTo(
    element,
    { opacity: 0, y: '100%' },
    { opacity: 1, y: '0%', duration: DURATION.normal, ease: EASE.smooth },
  );
}

export function slideDown(element: Element): gsap.core.Tween {
  return gsap.to(element, {
    opacity: 0,
    y: '100%',
    duration: DURATION.fast,
    ease: EASE.sharp,
  });
}

export function pulseGlow(element: Element): gsap.core.Tween {
  return gsap.to(element, {
    '--glow-opacity': 0.8,
    duration: 0.4,
    ease: EASE.smooth,
    yoyo: true,
    repeat: 1,
  });
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
