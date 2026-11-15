import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface MangaPreloaderProps {
  onComplete: () => void;
}

export function MangaPreloader({ onComplete }: MangaPreloaderProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const curtainRef = useRef<HTMLDivElement | null>(null);
  const accentCurtainRef = useRef<HTMLDivElement | null>(null);
  const emblemRef = useRef<SVGSVGElement | null>(null);
  const wordLeftRef = useRef<HTMLSpanElement | null>(null);
  const wordRightRef = useRef<HTMLSpanElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const lineFillRef = useRef<HTMLDivElement | null>(null);
  const centerGroupRef = useRef<HTMLDivElement | null>(null);

  const [exiting, setExiting] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const triggerExit = () => {
    if (exiting) return;
    setExiting(true);

    if (!rootRef.current || !curtainRef.current || !accentCurtainRef.current) {
      onCompleteRef.current();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => onCompleteRef.current(),
    });

    if (centerGroupRef.current) {
      tl.to(centerGroupRef.current, {
        y: -24,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
      });
    }

    tl.to(
      curtainRef.current,
      {
        yPercent: -102,
        duration: 0.62,
        ease: 'power4.inOut',
      },
      '-=0.05'
    ).to(
      accentCurtainRef.current,
      {
        yPercent: -102,
        duration: 0.56,
        ease: 'power4.inOut',
      },
      '-=0.48'
    );
  };

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      onCompleteRef.current();
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1. Emblem clean snap
      tl.fromTo(
        emblemRef.current,
        { scale: 0.8, rotate: -6, opacity: 0 },
        { scale: 1, rotate: 0, opacity: 1, duration: 0.36, ease: 'back.out(1.7)' }
      );

      // 2. "Manga" and "Forge" typographic reveal
      tl.fromTo(
        [wordLeftRef.current, wordRightRef.current],
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.46, stagger: 0.08, ease: 'power3.out' },
        '-=0.18'
      );

      // 3. Subtitle fade + tracking settle
      tl.fromTo(
        subtitleRef.current,
        { opacity: 0, letterSpacing: '0.38em' },
        { opacity: 1, letterSpacing: '0.24em', duration: 0.45, ease: 'power2.out' },
        '-=0.25'
      );

      // 4. Sleek vermilion hairline fill
      tl.fromTo(
        lineFillRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.68, ease: 'power2.inOut' },
        '-=0.45'
      );

      // 5. Lift ink curtain + crimson trailing edge to reveal the Hero
      tl.to(
        centerGroupRef.current,
        { y: -28, opacity: 0, duration: 0.28, ease: 'power2.in' },
        '+=0.18'
      )
        .to(
          curtainRef.current,
          { yPercent: -102, duration: 0.66, ease: 'power4.inOut' },
          '-=0.05'
        )
        .to(
          accentCurtainRef.current,
          {
            yPercent: -102,
            duration: 0.6,
            ease: 'power4.inOut',
            onComplete: () => onCompleteRef.current(),
          },
          '-=0.5'
        );
    }, rootRef);

    const safetyTimer = window.setTimeout(() => {
      onCompleteRef.current();
    }, 3200);

    return () => {
      window.clearTimeout(safetyTimer);
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      role="status"
      aria-label="Opening MangaForge Studio"
      className="fixed inset-0 z-[120] overflow-hidden select-none pointer-events-auto"
    >
      {/* Trailing Vermilion Editorial Wipe Layer */}
      <div
        ref={accentCurtainRef}
        className="absolute inset-0 bg-[#E63946] will-change-transform"
        aria-hidden="true"
      />

      {/* Primary Seamless Deep Ink Curtain */}
      <div
        ref={curtainRef}
        className="absolute inset-0 bg-[#141414] flex flex-col items-center justify-center px-6 will-change-transform"
      >
        {/* Subtle atmospheric halftone & corner crop marks */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#FAF9F6 1px, transparent 1px)',
            backgroundSize: '14px 14px',
          }}
        />
        <div className="absolute top-6 left-6 w-5 h-5 border-t-2 border-l-2 border-[#FAF9F6]/25 pointer-events-none" />
        <div className="absolute top-6 right-6 w-5 h-5 border-t-2 border-r-2 border-[#FAF9F6]/25 pointer-events-none" />
        <div className="absolute bottom-6 left-6 w-5 h-5 border-b-2 border-l-2 border-[#FAF9F6]/25 pointer-events-none" />
        <div className="absolute bottom-6 right-6 w-5 h-5 border-b-2 border-r-2 border-[#FAF9F6]/25 pointer-events-none" />

        {/* Center Typography & Emblem */}
        <div ref={centerGroupRef} className="relative z-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-4 sm:gap-5">
            <svg
              ref={emblemRef}
              width="48"
              height="48"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="w-10 h-10 sm:w-12 sm:h-12 shrink-0"
            >
              <rect x="2" y="2" width="32" height="27" fill="#141414" stroke="#FAF9F6" strokeWidth="2.4" />
              <path d="M10 29L7 35L17 29H10Z" fill="#141414" stroke="#FAF9F6" strokeWidth="2.2" strokeLinejoin="round" />
              <path d="M11 28.5H16.5" stroke="#141414" strokeWidth="3" />
              <line x1="18" y1="5" x2="18" y2="26" stroke="#FAF9F6" strokeWidth="1.8" />
              <line x1="5" y1="15" x2="18" y2="15" stroke="#FAF9F6" strokeWidth="1.8" />
              <rect x="20.5" y="5.5" width="10.5" height="9.5" fill="#E63946" />
              <line x1="21" y1="19.5" x2="30" y2="19.5" stroke="#FAF9F6" strokeWidth="1.8" />
              <line x1="21" y1="23.5" x2="27" y2="23.5" stroke="#FAF9F6" strokeWidth="1.8" />
            </svg>

            <h1 className="font-display text-4xl sm:text-6xl tracking-tight leading-none overflow-hidden flex items-baseline">
              <span ref={wordLeftRef} className="inline-block text-[#FAF9F6]">
                Manga
              </span>
              <span ref={wordRightRef} className="inline-block text-[#E63946]">
                Forge
              </span>
            </h1>
          </div>

          <p
            ref={subtitleRef}
            className="font-mono text-[11px] sm:text-xs uppercase text-[#A3A3A3] mt-4 tracking-[0.24em]"
          >
            マンガフォージ · AI MANGA STUDIO
          </p>

          {/* Sleek Hairline Vermilion Ink Line */}
          <div className="mt-6 w-52 sm:w-68 h-[2px] bg-[#FAF9F6]/15 overflow-hidden">
            <div
              ref={lineFillRef}
              className="h-full w-full bg-[#E63946] origin-left scale-x-0"
            />
          </div>
        </div>

        {/* Minimal Skip Control */}
        <button
          type="button"
          onClick={triggerExit}
          className="absolute bottom-7 right-7 font-mono text-xs text-[#A3A3A3] hover:text-[#FAF9F6] transition-colors cursor-pointer"
        >
          Skip →
        </button>
      </div>
    </div>
  );
}
