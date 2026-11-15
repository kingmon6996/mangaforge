import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, BookOpen, Layers } from 'lucide-react';
import { MANGA_ARTWORK } from '../../config/media';
import { useAuth } from '../../store/AuthContext';
import { scrollToSection } from '../../utils/smoothScroll';
import { CharacterRevealHeading } from '../manga/AnimatedTypography';
import { MangaButton } from '../manga/MangaButton';
import {
  MangaCropMarks,
  MangaImage,
  MangaInkSlash,
  MangaInkSplatterSvg,
  MangaKatakanaSfx,
  MangaRulerTicks,
  MangaScreentoneWedge,
  MangaStarburstBadge,
  MangaVerticalStamp,
  SpeechBubbleCallout,
  SpeedLinesSvg,
} from '../manga/MangaDecorations';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const sectionRef = useRef<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const speedLinesRef = useRef<HTMLDivElement | null>(null);
  const sfxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      if (sheetRef.current) {
        gsap.fromTo(
          sheetRef.current,
          { opacity: 0, y: 24, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }
        );

        gsap.to(sheetRef.current, {
          y: -26,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.75,
          },
        });
      }

      if (speedLinesRef.current) {
        gsap.to(speedLinesRef.current, {
          y: 44,
          scale: 1.05,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.85,
          },
        });
      }

      if (sfxRef.current) {
        gsap.to(sfxRef.current, {
          y: -38,
          rotate: 6,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.65,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-24 overflow-x-clip bg-[#FAF9F6] border-b-2 border-[#222222]"
    >
      {/* Manga halftone, screentone wedge & speedline graphics */}
      <div className="absolute inset-0 manga-halftone-subtle opacity-65 pointer-events-none" />
      <MangaScreentoneWedge
        corner="top-right"
        className="absolute top-0 right-0 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96"
      />
      <MangaScreentoneWedge
        corner="bottom-left"
        className="absolute bottom-0 left-0 w-36 sm:w-56 h-36 sm:h-56"
      />
      <div ref={speedLinesRef} className="absolute inset-0 pointer-events-none will-change-transform">
        <SpeedLinesSvg
          className="absolute -right-24 top-8 w-[520px] sm:w-[760px] h-[400px] sm:h-[520px]"
          opacity={0.08}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left editorial pitch */}
        <div className="md:col-span-6 space-y-5 sm:space-y-6">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs font-bold tracking-wider text-[#737373]">
            <span className="w-6 h-[2px] bg-[#E63946]" aria-hidden="true" />
            <span>Japanese Editorial AI Manga Studio</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[#171717]">原稿 B5 STUDIO</span>
          </div>

          <CharacterRevealHeading
            lines={['Your Stories.', 'Our Canvas.', 'Infinite Manga.']}
            highlightWord="Infinite"
            className="font-display text-[1.95rem] md:text-[2.15rem] lg:text-[2.9rem] xl:text-[3.35rem] font-normal leading-[1.1] text-[#171717]"
          />

          <div className="flex items-center gap-3 -mt-1">
            <MangaInkSlash className="w-40 sm:w-56 h-4" />
            <MangaKatakanaSfx glyph="ドン!!" sub="INK ENGINE" className="hidden sm:inline-flex" />
          </div>

          <p className="text-sm lg:text-base xl:text-lg text-[#525252] max-w-xl leading-relaxed">
            Turn your imagination into professionally structured manga. Create characters, direct
            cinematic scenes, design panels, and publish entire chapters with AI.
          </p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 relative">
            <MangaButton
              sfxLabel="INK!"
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
              className="group inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-[#E63946] text-white text-xs sm:text-sm font-bold border-2 border-[#222222] manga-panel-shadow hover:bg-[#171717] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{isAuthenticated ? 'Open Studio Dashboard' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" />
            </MangaButton>

            <MangaButton
              sfxLabel="READ!"
              burstColor="#E63946"
              onClick={() => scrollToSection('showcase')}
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 bg-white text-[#171717] text-xs sm:text-sm font-bold border-2 border-[#222222] manga-panel-shadow-sm hover:bg-[#F1EFEA] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#E63946]" />
              <span>Explore Showcase</span>
            </MangaButton>

            <MangaInkSplatterSvg className="hidden xl:block w-24 h-12 opacity-75 pointer-events-none" />
          </div>

          {/* Creator social proof indicator */}
          <div className="pt-3.5 border-t border-[#222222]/15 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs text-[#737373]">
            <span className="font-bold text-[#171717] tabular-nums">14,200+ active creators</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">180,000+ panels composed</span>
            <span aria-hidden="true">·</span>
            <span>300–600 DPI B5 & A4 print masters</span>
          </div>
        </div>

        {/* Right animated multi-panel manga page composition — aspect-locked for mobile, tablet, and desktop */}
        <div className="md:col-span-6 relative py-3 sm:py-5 flex items-center justify-center">
          <div
            ref={sheetRef}
            className="relative w-full max-w-[520px] md:max-w-full lg:max-w-[540px] bg-white border-2 border-[#222222] p-3 sm:p-4 lg:p-5 manga-panel-shadow will-change-transform"
          >
            <MangaCropMarks />

            {/* Vertical Japanese manuscript stamp */}
            <MangaVerticalStamp
              label="第一話"
              className="hidden sm:inline-flex absolute -right-3.5 top-14 z-20"
            />

            {/* Starburst Comic Graphic — cleared cleanly from RTL · B5 header */}
            <div ref={sfxRef} className="hidden sm:block absolute -top-7 right-3 z-20 will-change-transform">
              <MangaStarburstBadge
                text="INK!"
                bg="#FFB703"
                className="w-13 h-13 lg:w-14 lg:h-14"
              />
            </div>

            {/* Editorial crop marks header with right clearance for starburst */}
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-[#737373] mb-2.5 pb-2 pr-14 sm:pr-16 border-b border-[#222222]/15">
              <span className="truncate">CH.01 · P.014 — B5 DRAFT</span>
              <span className="text-[#E63946] font-bold shrink-0">RTL · B5</span>
            </div>

            {/* Multi-panel responsive manga grid matching natural image aspect ratios */}
            <div className="grid grid-cols-12 gap-2 sm:gap-2.5 lg:gap-3">
              {/* Top Wide 16:9 Action Spread (1376x768 natural) */}
              <div className="col-span-12 relative aspect-[16/9] border-2 border-[#222222] overflow-hidden bg-[#F1EFEA]">
                <MangaImage
                  src={MANGA_ARTWORK.duelSplash}
                  alt="Rival swordsmen rooftop duel manga spread"
                  fallbackTitle="Action Spread"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute top-2 left-2 bg-[#E63946] text-white text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 border border-[#222222]">
                  PANEL 01 · WIDE SPREAD
                </div>
              </div>

              {/* Bottom Left 3:4 Portrait Character Page (896x1200 natural) */}
              <div className="col-span-6 relative aspect-[3/4] border-2 border-[#222222] overflow-hidden bg-[#F1EFEA]">
                <MangaImage
                  src={MANGA_ARTWORK.heroPage}
                  alt="Katana swordsman manga panel with speed lines"
                  fallbackTitle="Action Panel"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute bottom-1.5 left-1.5 bg-white/95 text-[#171717] text-[9px] font-mono font-bold px-1.5 py-0.5 border border-[#222222]">
                  P.02 · LOW ANGLE
                </div>
              </div>

              {/* Bottom Right Column: 4:3 Character Turnaround + Dialogue Beat */}
              <div className="col-span-6 flex flex-col justify-between gap-2 sm:gap-2.5">
                <div className="relative border-2 border-[#222222] overflow-hidden bg-[#FAF9F6] p-1.5 sm:p-2">
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-[#737373] mb-1">
                    <span>REF LOCK</span>
                    <Layers className="w-3 h-3 text-[#E63946]" />
                  </div>
                  <div className="aspect-[4/3] border border-[#222222] overflow-hidden bg-white">
                    <MangaImage
                      src={MANGA_ARTWORK.characterTurnaround}
                      alt="Character consistency reference sheet"
                      fallbackTitle="Character Sheet"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#171717] truncate">
                      Renji · Seed #409
                    </span>
                    <span className="font-mono text-[9px] text-[#E63946] font-bold">LOCK</span>
                  </div>
                </div>

                {/* Docked Dialogue & SFX Beat Panel (prevents floating bubble collisions on tablet) */}
                <div className="flex-1 border-2 border-[#222222] bg-[#FFFDF5] p-2 sm:p-2.5 flex flex-col justify-between min-h-[76px]">
                  <p className="font-dialogue font-bold text-[11px] sm:text-xs leading-snug text-[#171717]">
                    “Hold the ridge. Next panel cuts to close-up.”
                  </p>
                  <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-[#222222]/15 mt-1">
                    <span className="font-comic text-xs sm:text-sm tracking-wider text-[#E63946]">
                      SFX: KRAAK!!
                    </span>
                    <span className="font-mono text-[9px] text-[#737373]">LAYER 04</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom B5 Genko Manuscript Ruler */}
            <div className="mt-2.5 pt-2 border-t border-[#222222]/15 flex items-center justify-between gap-2">
              <MangaRulerTicks className="w-32 sm:w-44 h-2.5" />
              <span className="font-mono text-[9px] sm:text-[10px] text-[#737373]">
                TRIM 182×257MM
              </span>
            </div>
          </div>

          {/* Wide desktop-only floating speech bubble overhang */}
          <div className="hidden xl:block absolute -left-10 -bottom-2 max-w-[215px] z-20">
            <SpeechBubbleCallout tailSide="right" className="!bg-[#FFF3C4]">
              <p className="font-comic text-xs tracking-wider text-[#171717] whitespace-nowrap">
                CAMERA: 18MM LOW ANGLE · READY!
              </p>
            </SpeechBubbleCallout>
          </div>
        </div>
      </div>
    </section>
  );
}
