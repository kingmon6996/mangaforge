import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

export function SpeedLinesSvg({
  className = '',
  opacity = 0.12,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <svg
      viewBox="0 0 600 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{ opacity }}
    >
      <g stroke="#222222" strokeWidth="1.2">
        <line x1="0" y1="20" x2="210" y2="165" />
        <line x1="0" y1="65" x2="185" y2="180" />
        <line x1="0" y1="120" x2="170" y2="195" />
        <line x1="0" y1="260" x2="175" y2="215" />
        <line x1="0" y1="330" x2="190" y2="235" />
        <line x1="0" y1="385" x2="215" y2="255" />
        <line x1="600" y1="15" x2="385" y2="160" />
        <line x1="600" y1="75" x2="405" y2="185" />
        <line x1="600" y1="145" x2="420" y2="200" />
        <line x1="600" y1="255" x2="420" y2="215" />
        <line x1="600" y1="320" x2="400" y2="235" />
        <line x1="600" y1="390" x2="375" y2="255" />
        <line x1="140" y1="0" x2="255" y2="145" />
        <line x1="250" y1="0" x2="285" y2="135" />
        <line x1="360" y1="0" x2="320" y2="140" />
        <line x1="465" y1="0" x2="355" y2="150" />
        <line x1="130" y1="400" x2="250" y2="265" />
        <line x1="255" y1="400" x2="285" y2="275" />
        <line x1="365" y1="400" x2="320" y2="270" />
        <line x1="475" y1="400" x2="355" y2="260" />
      </g>
    </svg>
  );
}

/** Authentic Japanese B5 Manga Registration Crop Marks (Tombo) */
export function MangaCropMarks({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none select-none ${className}`}>
      <svg className="absolute -top-2.5 -left-2.5 w-5 h-5 text-[#E63946]" viewBox="0 0 20 20" fill="none">
        <path d="M10 0V10H0M14 4V14H4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <svg className="absolute -top-2.5 -right-2.5 w-5 h-5 text-[#E63946]" viewBox="0 0 20 20" fill="none">
        <path d="M10 0V10H20M6 4V14H16" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <svg className="absolute -bottom-2.5 -left-2.5 w-5 h-5 text-[#E63946]" viewBox="0 0 20 20" fill="none">
        <path d="M10 20V10H0M14 16V6H4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <svg className="absolute -bottom-2.5 -right-2.5 w-5 h-5 text-[#E63946]" viewBox="0 0 20 20" fill="none">
        <path d="M10 20V10H20M6 16V6H16" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

/** Dynamic Comic Starburst SFX Stamp */
export function MangaStarburstBadge({
  text,
  bg = '#FFB703',
  textColor = '#171717',
  className = '',
}: {
  text: string;
  bg?: string;
  textColor?: string;
  className?: string;
}) {
  const hasPosition = /\b(absolute|fixed|sticky)\b/.test(className);
  const hasDisplay = /\b(hidden|flex|inline-flex|block)\b/.test(className);
  return (
    <div
      aria-hidden="true"
      className={`${hasPosition ? '' : 'relative'} ${hasDisplay ? '' : 'inline-flex'} items-center justify-center w-14 h-14 select-none pointer-events-none ${className}`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[2px_2px_0px_#222222]">
        <polygon
          points="50,2 62,24 88,12 78,37 98,50 78,63 88,88 62,76 50,98 38,76 12,88 22,63 2,50 22,37 12,12 38,24"
          fill={bg}
          stroke="#222222"
          strokeWidth="3.5"
          strokeLinejoin="miter"
        />
      </svg>
      <span
        className="absolute font-comic text-xs sm:text-sm tracking-wider leading-none -rotate-6"
        style={{ color: textColor }}
      >
        {text}
      </span>
    </div>
  );
}

/** Japanese G-Pen Nib & Ink Stroke Graphic */
export function MangaPenNibGraphic({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 88 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <path
        d="M52 10L78 36L45 69L14 74L19 43L52 10Z"
        fill="#FFFFFF"
        stroke="#222222"
        strokeWidth="2.5"
      />
      <path d="M14 74L38 50" stroke="#E63946" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="40" cy="48" r="4" fill="#171717" />
      <path d="M58 16L72 30" stroke="#222222" strokeWidth="2.5" />
    </svg>
  );
}

/** Sweeping Manga Ink Brush Slash */
export function MangaInkSlash({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <path
        d="M3 17C58 7 152 4 316 11C245 15 128 19 8 22L3 17Z"
        fill="#E63946"
      />
      <path d="M22 12L284 8" stroke="#222222" strokeWidth="1.5" strokeDasharray="6 4" />
    </svg>
  );
}

/** Subtle Vertical Japanese Manga Stamp */
export function MangaVerticalStamp({
  label,
  className = '',
}: {
  label: string;
  className?: string;
}) {
  const hasDisplay = /\b(hidden|flex|inline-flex|block)\b/.test(className);
  return (
    <div
      aria-hidden="true"
      className={`${hasDisplay ? '' : 'inline-flex'} flex-col items-center px-1.5 py-2 border-2 border-[#E63946] text-[#E63946] font-mono text-[10px] font-bold leading-tight bg-white/95 select-none ${className}`}
      style={{ writingMode: 'vertical-rl' }}
    >
      {label}
    </div>
  );
}

/** Diagonal Manga Halftone Screentone Corner Accent */
export function MangaScreentoneWedge({
  corner = 'top-right',
  className = '',
}: {
  corner?: 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}) {
  const clip =
    corner === 'top-right'
      ? 'polygon(100% 0, 0 0, 100% 100%)'
      : corner === 'bottom-left'
        ? 'polygon(0 100%, 0 0, 100% 100%)'
        : 'polygon(100% 100%, 100% 0, 0 100%)';

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none manga-halftone-dense opacity-20 ${className}`}
      style={{ clipPath: clip }}
    />
  );
}

/** Japanese Katakana Brush SFX Graphic (e.g., ドン!! / ザッ!!) */
export function MangaKatakanaSfx({
  glyph = 'ドン!!',
  sub = 'IMPACT',
  className = '',
}: {
  glyph?: string;
  sub?: string;
  className?: string;
}) {
  const hasPosition = /\b(absolute|fixed|sticky)\b/.test(className);
  return (
    <div
      aria-hidden="true"
      className={`${hasPosition ? '' : 'relative'} inline-flex flex-col items-center select-none pointer-events-none ${className}`}
    >
      <span
        className="font-display text-lg sm:text-2xl leading-none text-[#171717] tracking-tighter"
        style={{ textShadow: '2px 2px 0px #E63946' }}
      >
        {glyph}
      </span>
      <span className="font-mono text-[8px] font-bold tracking-widest text-[#737373] mt-0.5">
        {sub}
      </span>
    </div>
  );
}

/** Japanese Genko B5 Manuscript Edge Ruler Ticks */
export function MangaRulerTicks({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <line x1="0" y1="9" x2="240" y2="9" stroke="#222222" strokeWidth="1" strokeOpacity="0.35" />
      {Array.from({ length: 25 }).map((_, i) => {
        const x = i * 10;
        const tall = i % 5 === 0;
        return (
          <line
            key={i}
            x1={x}
            y1={tall ? 1 : 5}
            x2={x}
            y2={9}
            stroke={tall ? '#E63946' : '#222222'}
            strokeWidth={tall ? '1.4' : '1'}
            strokeOpacity={tall ? 0.85 : 0.35}
          />
        );
      })}
    </svg>
  );
}

/** Editorial Manga Chapter Gutter Strip between sections */
export function MangaChapterDivider({
  pageNum,
  label,
}: {
  pageNum: string;
  label: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="relative bg-[#FAF9F6] border-b-2 border-[#222222] py-2.5 overflow-hidden select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-block w-3 h-3 bg-[#E63946] border border-[#222222] rotate-45 shrink-0" />
          <span className="font-mono text-[11px] font-bold tracking-widest text-[#171717] truncate">
            {pageNum} · {label}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <MangaRulerTicks className="w-40 h-2.5" />
          <span className="font-mono text-[10px] font-bold text-[#737373]">B5 · 182×257mm</span>
        </div>
      </div>
    </div>
  );
}

/** Crisp Ink Splatter & Brush Flourish Accent */
export function MangaInkSplatterSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <path
        d="M12 46C34 32 68 24 106 16C74 28 45 38 18 52L12 46Z"
        fill="#171717"
      />
      <path
        d="M28 56C54 46 84 40 112 34C88 43 60 50 32 60L28 56Z"
        fill="#E63946"
      />
      <circle cx="94" cy="14" r="3.5" fill="#171717" />
      <circle cx="109" cy="22" r="2" fill="#E63946" />
      <circle cx="20" cy="30" r="2.5" fill="#FFB703" />
    </svg>
  );
}

export function SpeechBubbleCallout({
  children,
  className = '',
  tailSide = 'left',
}: {
  children: React.ReactNode;
  className?: string;
  tailSide?: 'left' | 'right';
}) {
  return (
    <div
      className={`relative border-2 border-[#222222] bg-white px-4 py-2.5 text-sm font-medium text-[#171717] manga-panel-shadow-sm font-dialogue ${className}`}
    >
      {children}
      <svg
        width="16"
        height="12"
        viewBox="0 0 16 12"
        fill="none"
        aria-hidden="true"
        className={`absolute -bottom-3 ${tailSide === 'left' ? 'left-5' : 'right-5'}`}
      >
        <path
          d={tailSide === 'left' ? 'M1 0L3 11L13 0' : 'M3 0L13 11L15 0'}
          fill="#FFFFFF"
          stroke="#222222"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

interface MangaImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  style?: React.CSSProperties;
}

export function MangaImage({
  src,
  alt,
  className = '',
  fallbackTitle = 'Manga Panel',
  style,
}: MangaImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F1EFEA] manga-halftone-subtle text-[#171717] p-4 ${className}`}
        style={style}
        role="img"
        aria-label={alt}
      >
        <BookOpen className="w-7 h-7 text-[#222222] mb-2" strokeWidth={1.75} />
        <span className="font-display text-xs font-semibold tracking-wide text-center">
          {fallbackTitle}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      style={style}
    />
  );
}
