import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useReducedMotion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

/**
 * Hero headline with left-to-right wipe swap-in on mount and swap-out/in on scroll.
 */
export function CharacterRevealHeading({
  lines,
  className = '',
  highlightWord,
}: {
  lines: string[];
  className?: string;
  highlightWord?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const fullText = lines.join(' ');

  useEffect(() => {
    if (prefersReducedMotion || !headingRef.current) return;
    const el = headingRef.current;
    const lineEls = el.querySelectorAll<HTMLElement>('.hero-line-wipe');

    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineEls,
        {
          clipPath: 'inset(0 100% 0 0)',
          x: -28,
          opacity: 0,
        },
        {
          clipPath: 'inset(0 0% 0 0)',
          x: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 95%',
            end: 'bottom 8%',
            toggleActions: 'play reverse play reverse',
          },
        }
      );
    }, headingRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <h1 ref={headingRef} className={className} aria-label={fullText} style={{ textWrap: 'balance' }}>
      {lines.map((line, lineIdx) => {
        const words = line.split(' ');
        return (
          <span key={lineIdx} className="hero-line-wipe block will-change-transform" aria-hidden="true">
            {words.map((word, wordIdx) => {
              const isHighlighted = highlightWord && word.replace(/[.,!]/g, '') === highlightWord;
              return (
                <span
                  key={wordIdx}
                  className={`inline-block mr-[0.26em] last:mr-0 ${
                    isHighlighted ? 'text-[#E63946]' : ''
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </span>
        );
      })}
    </h1>
  );
}

/**
 * GSAP ScrollTrigger left-to-right clip-path reveal that swaps in as the heading
 * enters the viewport and swaps out when scrolled away (`play reverse play reverse`).
 */
export function ScrollRevealHeading({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'left' | 'right';
}) {
  const prefersReducedMotion = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion || !wrapperRef.current || !headingRef.current) return;
    const triggerEl = wrapperRef.current;
    const headingEl = headingRef.current;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingEl,
        {
          clipPath: 'inset(0 100% 0 0)',
          x: -36,
          opacity: 0,
        },
        {
          clipPath: 'inset(0 0% 0 0)',
          x: 0,
          opacity: 1,
          duration: 0.68,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: triggerEl,
            start: 'top 90%',
            end: 'bottom 8%',
            toggleActions: 'play reverse play reverse',
            invalidateOnRefresh: true,
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <h2 className={className} style={{ textWrap: 'balance' }}>
        {children}
      </h2>
    );
  }

  return (
    <div ref={wrapperRef} className="overflow-hidden">
      <h2
        ref={headingRef}
        className={`${className} will-change-transform`}
        style={{ textWrap: 'balance' }}
      >
        {children}
      </h2>
    </div>
  );
}

/** Scroll-triggered manga ink highlight bar that swaps in & out with its heading */
export function AnimatedInkUnderline({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const barRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion || !ref.current || !barRef.current) return;
    const triggerEl = ref.current;
    const barEl = barRef.current;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        barEl,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.55,
          delay: 0.14,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: triggerEl,
            start: 'top 90%',
            end: 'bottom 8%',
            toggleActions: 'play reverse play reverse',
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <span ref={ref} className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <span
        ref={barRef}
        className="absolute left-0 right-0 bottom-0.5 h-[7px] bg-[#FFB703]/70 origin-left -z-0 border-b-2 border-[#E63946]"
      />
    </span>
  );
}

/** Scroll-triggered Manga Panel Card wrapper */
export function MangaScrollCard({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <article className={className}>{children}</article>;
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{
        duration: 0.42,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.article>
  );
}
