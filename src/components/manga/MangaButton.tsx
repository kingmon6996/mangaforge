import React, { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface BurstPoint {
  id: number;
  x: number;
  y: number;
  label?: string;
}

interface MangaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  sfxLabel?: string;
  burstColor?: string;
  className?: string;
}

const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function MangaButton({
  children,
  sfxLabel,
  burstColor = '#FFB703',
  className = '',
  onClick,
  disabled,
  type = 'button',
  ...rest
}: MangaButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [bursts, setBursts] = useState<BurstPoint[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !prefersReducedMotion && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
      const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
      const id = Date.now() + Math.random();
      setBursts((prev) => [...prev.slice(-2), { id, x, y, label: sfxLabel }]);
      setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== id));
      }, 520);
    }
    onClick?.(e);
  };

  return (
    <motion.button
      ref={btnRef}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      whileHover={disabled || prefersReducedMotion ? undefined : { x: -2, y: -3, rotate: -0.4 }}
      whileTap={disabled || prefersReducedMotion ? undefined : { x: 3, y: 3, scale: 0.96, rotate: 0.4 }}
      transition={{ type: 'spring', stiffness: 520, damping: 24, mass: 0.7 }}
      className={`relative overflow-visible manga-cartoon-btn ${className}`}
      {...(rest as Record<string, unknown>)}
    >
      {children}

      {/* Comic / Manga Ink Burst Overlay on Click */}
      <AnimatePresence>
        {bursts.map((burst) => (
          <span
            key={burst.id}
            aria-hidden="true"
            className="pointer-events-none absolute z-30"
            style={{ left: burst.x, top: burst.y }}
          >
            {/* Expanding comic ring */}
            <motion.span
              initial={{ scale: 0.2, opacity: 0.95 }}
              animate={{ scale: 2.1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -left-4 -top-4 w-8 h-8 rounded-full border-2 border-[#222222]"
              style={{ backgroundColor: `${burstColor}33` }}
            />

            {/* Radial manga speed-sparks */}
            {BURST_ANGLES.map((deg, idx) => (
              <motion.span
                key={deg}
                initial={{
                  x: 0,
                  y: 0,
                  scaleY: 0.4,
                  opacity: 1,
                  rotate: deg,
                }}
                animate={{
                  x: Math.cos((deg * Math.PI) / 180) * (idx % 2 === 0 ? 28 : 20),
                  y: Math.sin((deg * Math.PI) / 180) * (idx % 2 === 0 ? 28 : 20),
                  scaleY: 1.1,
                  opacity: 0,
                }}
                transition={{ duration: 0.42, ease: 'easeOut' }}
                className="absolute -left-[1.5px] -top-2 w-[3px] h-3.5 origin-center"
                style={{ backgroundColor: idx % 2 === 0 ? '#171717' : burstColor }}
              />
            ))}

            {/* Optional comic SFX pop label */}
            {burst.label && (
              <motion.span
                initial={{ y: -4, scale: 0.5, opacity: 1, rotate: -10 }}
                animate={{ y: -28, scale: 1.05, opacity: 0, rotate: -4 }}
                transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -left-5 -top-4 font-comic text-xs px-1.5 py-0.5 bg-[#FFB703] text-[#171717] border border-[#222222] whitespace-nowrap shadow-[1px_1px_0px_#222222]"
              >
                {burst.label}
              </motion.span>
            )}
          </span>
        ))}
      </AnimatePresence>
    </motion.button>
  );
}
