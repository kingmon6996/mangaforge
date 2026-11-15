import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Check,
  Clapperboard,
  FileText,
  Maximize2,
  Minimize2,
  PenSquare,
  UserCheck,
  ZoomIn,
} from 'lucide-react';
import { MANGA_ARTWORK } from '../../config/media';
import { ScrollRevealHeading } from '../manga/AnimatedTypography';
import { MangaButton } from '../manga/MangaButton';
import {
  MangaCropMarks,
  MangaImage,
  MangaStarburstBadge,
  MangaVerticalStamp,
} from '../manga/MangaDecorations';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    number: '01',
    jpStamp: '第一工程',
    title: 'Write Your Story',
    description:
      'Enter a story idea, full script, or detailed scene beat. MangaForge parses dialogue, action cues, and emotional pacing.',
    icon: FileText,
    previewTitle: 'Scene 01 — Summit Gate',
    previewBody:
      'EXT. RIDGE PASS — DUSK. Renji tightens his wrist wraps as wind tears across the stone archway. "Seven years on the lower trail. Tonight, the gate opens."',
    imageUrl: MANGA_ARTWORK.workflowStoryboard,
    secondaryLeft: MANGA_ARTWORK.heroPage,
    secondaryLeftLabel: 'Rough Beat Frame',
    secondaryRight: MANGA_ARTWORK.seinen,
    secondaryRightLabel: 'Mood & Tone Reference',
    sfxBadge: 'PLOT!',
  },
  {
    number: '02',
    jpStamp: '第二工程',
    title: 'Build Your Characters',
    description:
      'Define hairstyles, facial scars, outfits, expressions, and turnaround references to lock visual continuity.',
    icon: UserCheck,
    previewTitle: 'Cast Lock — Renji Kurogane',
    previewBody:
      'Turnaround sheet verified: spiky dark silhouette, left-cheek scar, high-collar tactical jacket, 3 expression presets.',
    imageUrl: MANGA_ARTWORK.characterTurnaround,
    secondaryLeft: MANGA_ARTWORK.shonen,
    secondaryLeftLabel: 'Action Pose Lock',
    secondaryRight: MANGA_ARTWORK.heroPage,
    secondaryRightLabel: 'Facial Ink Consistency',
    sfxBadge: 'LOCK!',
  },
  {
    number: '03',
    jpStamp: '第三工程',
    title: 'Direct Your Manga',
    description:
      'Let the AI Manga Director compose multi-panel grids, camera perspectives, screentones, and balanced dialogue bubbles.',
    icon: Clapperboard,
    previewTitle: 'Director Pass — 5-Panel Dynamic Action',
    previewBody:
      'Panel 1: Wide low-angle leap · Panel 2: Extreme close-up eyes · Panel 3: Horizontal speed-line impact.',
    imageUrl: MANGA_ARTWORK.duelSplash,
    secondaryLeft: MANGA_ARTWORK.workflowStoryboard,
    secondaryLeftLabel: 'Nemu Storyboard Grid',
    secondaryRight: MANGA_ARTWORK.fantasy,
    secondaryRightLabel: 'Perspective Horizon',
    sfxBadge: 'SNAP!',
  },
  {
    number: '04',
    jpStamp: '第四工程',
    title: 'Edit & Publish',
    description:
      'Refine panels in the canvas workspace, move speech tails, add SFX lettering, and export 300–600 DPI chapters.',
    icon: PenSquare,
    previewTitle: 'Press Export — B5 Tankobon Master',
    previewBody:
      '14-page Chapter 01 exported as grayscale 600 DPI PDF with trim marks and clean dialogue layers.',
    imageUrl: MANGA_ARTWORK.heroPage,
    secondaryLeft: MANGA_ARTWORK.scifi,
    secondaryLeftLabel: 'Screentone Pass',
    secondaryRight: MANGA_ARTWORK.duelSplash,
    secondaryRightLabel: 'Print Spread Check',
    sfxBadge: 'INK!',
  },
];

type ResizeMode = 'cover' | 'contain' | 'zoom';

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [resizeMode, setResizeMode] = useState<ResizeMode>('cover');
  const containerRef = useRef<HTMLElement | null>(null);
  const timelineRailRef = useRef<HTMLDivElement | null>(null);
  const stageCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.hiw-step-item');

      if (timelineRailRef.current) {
        gsap.fromTo(
          timelineRailRef.current,
          { scaleY: 0.12 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: '.hiw-steps-list',
              start: 'top 65%',
              end: 'bottom 55%',
              scrub: 0.4,
            },
          }
        );
      }

      if (stageCardRef.current) {
        gsap.fromTo(
          stageCardRef.current,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.65,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
              trigger: stageCardRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }

      cards.forEach((card, idx) => {
        gsap.fromTo(
          card,
          { opacity: 0, x: -24 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
              trigger: card,
              start: 'top 86%',
              once: true,
            },
          }
        );

        // Screen-lock scroll sync: auto-advance the locked preview stage as steps enter view
        ScrollTrigger.create({
          trigger: card,
          start: 'top 52%',
          end: 'bottom 48%',
          onEnter: () => setActiveStep(idx),
          onEnterBack: () => setActiveStep(idx),
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const current = STEPS[activeStep];

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="relative py-20 sm:py-24 bg-[#FAF9F6] border-b-2 border-[#222222] overflow-x-clip"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-14">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-3">
              Workflow Architecture · 制作工程
            </p>
            <ScrollRevealHeading className="font-display text-2xl sm:text-4xl font-normal text-[#171717] leading-[1.15]">
              From raw script to finished manga chapter in four deliberate steps.
            </ScrollRevealHeading>
          </div>
          <p className="font-mono text-xs text-[#737373] max-w-xs">
            Scroll through each step or click any stage card to inspect storyboard, cast, and final spreads.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Interactive Timeline Steps (drives scroll-lock preview on desktop) */}
          <div className="hiw-steps-list lg:col-span-5 relative pl-0 sm:pl-5 space-y-4 sm:space-y-5">
            {/* GSAP Scroll-scrubbed Vertical Ink Progress Track */}
            <div
              aria-hidden="true"
              className="hidden sm:block absolute left-1 top-3 bottom-3 w-[3px] bg-[#222222]/15"
            >
              <div
                ref={timelineRailRef}
                className="w-full h-full bg-[#E63946] origin-top"
              />
            </div>

            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              return (
                <MangaButton
                  key={step.number}
                  sfxLabel={step.sfxBadge}
                  onClick={() => setActiveStep(idx)}
                  className={`hiw-step-item w-full text-left p-4 sm:p-5 border-2 transition-colors cursor-pointer flex items-start gap-4 ${
                    isActive
                      ? 'bg-white border-[#222222] manga-panel-shadow'
                      : 'bg-[#F1EFEA] border-[#222222]/35 hover:border-[#222222]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 shrink-0 border-2 border-[#222222] flex items-center justify-center font-mono text-sm font-bold ${
                      isActive ? 'bg-[#E63946] text-white' : 'bg-white text-[#171717]'
                    }`}
                  >
                    {step.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-editorial text-base sm:text-lg font-extrabold text-[#171717]">
                        {step.title}
                      </h3>
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#E63946]' : 'text-[#737373]'
                        }`}
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-[#525252] mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </MangaButton>
              );
            })}
          </div>

          {/* Sticky Screen-Lock Multi-Image Stage Preview */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <div
              ref={stageCardRef}
              className="relative w-full bg-white border-2 border-[#222222] p-4 sm:p-6 manga-panel-shadow space-y-4"
            >
              <MangaCropMarks />
              <MangaVerticalStamp
                label={current.jpStamp}
                className="hidden sm:inline-flex absolute -right-4 top-14 z-20"
              />
              <MangaStarburstBadge
                text={current.sfxBadge}
                bg="#FFB703"
                className="hidden sm:inline-flex absolute -top-7 right-3 z-20 w-13 h-13"
              />

              {/* Header bar + Responsive Image Resizing Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#222222] pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs font-bold text-[#171717] truncate">
                    STEP {current.number} · {current.previewTitle}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A] shrink-0">
                    <Check className="w-3.5 h-3.5" />
                    Ready
                  </span>
                </div>

                {/* Image Resize / Fit Controls */}
                <div
                  className="inline-flex items-center border-2 border-[#222222] bg-[#FAF9F6]"
                  role="group"
                  aria-label="Preview image framing"
                >
                  <button
                    type="button"
                    onClick={() => setResizeMode('cover')}
                    title="Fill Frame"
                    className={`px-2 py-1 text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer ${
                      resizeMode === 'cover' ? 'bg-[#171717] text-white' : 'text-[#171717]'
                    }`}
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Fill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResizeMode('contain')}
                    title="Fit Full Page"
                    className={`px-2 py-1 text-[10px] font-mono font-bold inline-flex items-center gap-1 border-l border-[#222222]/25 cursor-pointer ${
                      resizeMode === 'contain' ? 'bg-[#171717] text-white' : 'text-[#171717]'
                    }`}
                  >
                    <Minimize2 className="w-3 h-3" />
                    <span>Fit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResizeMode('zoom')}
                    title="Inspect Ink Detail"
                    className={`px-2 py-1 text-[10px] font-mono font-bold inline-flex items-center gap-1 border-l border-[#222222]/25 cursor-pointer ${
                      resizeMode === 'zoom' ? 'bg-[#E63946] text-white' : 'text-[#171717]'
                    }`}
                  >
                    <ZoomIn className="w-3 h-3" />
                    <span>120%</span>
                  </button>
                </div>
              </div>

              {/* Primary Responsive Manga Artwork Frame */}
              <div className="aspect-[16/10] w-full border-2 border-[#222222] overflow-hidden bg-[#F1EFEA] relative">
                <MangaImage
                  src={current.imageUrl}
                  alt={current.previewTitle}
                  fallbackTitle={current.title}
                  className={`w-full h-full transition-transform duration-300 ${
                    resizeMode === 'contain'
                      ? 'object-contain bg-[#FAF9F6]'
                      : resizeMode === 'zoom'
                        ? 'object-cover scale-120'
                        : 'object-cover'
                  }`}
                />
              </div>

              {/* Dual Supporting Manga Reference Strip (fills empty space cleanly) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border-2 border-[#222222] bg-[#FAF9F6] overflow-hidden">
                  <div className="aspect-[16/9] overflow-hidden border-b border-[#222222]">
                    <MangaImage
                      src={current.secondaryLeft}
                      alt={current.secondaryLeftLabel}
                      fallbackTitle={current.secondaryLeftLabel}
                      className={`w-full h-full transition-transform duration-300 ${
                        resizeMode === 'contain' ? 'object-contain bg-white' : 'object-cover'
                      }`}
                    />
                  </div>
                  <div className="px-2.5 py-1.5 flex items-center justify-between text-[10px] sm:text-[11px] font-mono font-bold text-[#171717]">
                    <span className="truncate">{current.secondaryLeftLabel}</span>
                    <span className="text-[#E63946]">REF A</span>
                  </div>
                </div>

                <div className="border-2 border-[#222222] bg-[#FAF9F6] overflow-hidden">
                  <div className="aspect-[16/9] overflow-hidden border-b border-[#222222]">
                    <MangaImage
                      src={current.secondaryRight}
                      alt={current.secondaryRightLabel}
                      fallbackTitle={current.secondaryRightLabel}
                      className={`w-full h-full transition-transform duration-300 ${
                        resizeMode === 'contain' ? 'object-contain bg-white' : 'object-cover'
                      }`}
                    />
                  </div>
                  <div className="px-2.5 py-1.5 flex items-center justify-between text-[10px] sm:text-[11px] font-mono font-bold text-[#171717]">
                    <span className="truncate">{current.secondaryRightLabel}</span>
                    <span className="text-[#E63946]">REF B</span>
                  </div>
                </div>
              </div>

              {/* Narrative Cue Output */}
              <div className="bg-[#FAF9F6] border-2 border-[#222222] p-3.5 sm:p-4">
                <p className="font-mono text-xs text-[#171717] leading-relaxed">
                  {current.previewBody}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
