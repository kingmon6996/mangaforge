import type Lenis from 'lenis';

let activeLenis: Lenis | null = null;

export function setLenisInstance(instance: Lenis | null) {
  activeLenis = instance;
}

export function getLenisInstance(): Lenis | null {
  return activeLenis;
}

export function scrollToSection(sectionId: string, offset = -76) {
  const cleanId = sectionId.replace(/^#/, '');
  const target = document.getElementById(cleanId);
  if (!target) return;

  if (activeLenis) {
    activeLenis.scrollTo(target, {
      offset,
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    return;
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
