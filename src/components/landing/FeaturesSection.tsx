import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Download,
  Film,
  LayoutGrid,
  MessageSquare,
  PenTool,
  Users,
} from 'lucide-react';
import { MANGA_ARTWORK } from '../../config/media';
import {
  AnimatedInkUnderline,
  ScrollRevealHeading,
} from '../manga/AnimatedTypography';
import { MangaButton } from '../manga/MangaButton';
import {
  MangaCropMarks,
  MangaImage,
  MangaKatakanaSfx,
  MangaPenNibGraphic,
  MangaScreentoneWedge,
  MangaStarburstBadge,
  SpeedLinesSvg,
} from '../manga/MangaDecorations';

gsap.registerPlugin(ScrollTrigger);

export function FeaturesSection() {
  const [activeBeat, setActiveBeat] = useState(0);
  const [bubbleMode, setBubbleMode] = useState<'speech' | 'shout' | 'thought' | 'narration'>('speech');
  const [panelSplit, setPanelSplit] = useState<'3-panel' | '5-panel'>('5-panel');
  const [exportFmt, setExportFmt] = useState<'PDF' | 'PNG'>('PDF');

  const sectionRef = useRef<HTMLElement | null>(null);
  const nibRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      if (nibRef.current) {
        gsap.fromTo(
          nibRef.current,
          { rotate: -14, y: 12 },
          {
            rotate: 14,
            y: -18,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.7,
            },
          }
        );
      }

      gsap.fromTo(
        '.feat-bento-card',
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: '.feat-bento-grid',
            start: 'top 86%',
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const beats = [
    { label: '01 Wide Establish', desc: 'Rain-soaked alley framing' },
    { label: '02 Tension Beat', desc: 'Over-shoulder silhouette' },
    { label: '03 Impact Cut', desc: 'Diagonal speed-line strike' },
  ];

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative py-20 sm:py-24 bg-[#F1EFEA] border-b-2 border-[#222222] overflow-x-clip"
    >
      <MangaScreentoneWedge
        corner="bottom-right"
        className="absolute bottom-0 right-0 w-52 sm:w-80 h-52 sm:h-80"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        {/* Top Decorative G-Pen & Katakana SFX */}
        <div
          ref={nibRef}
          className="hidden lg:flex items-center gap-3 absolute right-6 -top-8 pointer-events-none will-change-transform"
        >
          <MangaKatakanaSfx glyph="ザッ!!" sub="G-PEN INK" />
          <MangaPenNibGraphic className="w-16 h-16 opacity-90" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 sm:mb-14">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-3">
              Production Toolkit · 作画ツール
            </p>
            <ScrollRevealHeading className="font-display text-2xl sm:text-4xl lg:text-[2.6rem] font-normal text-[#171717] leading-[1.15]">
              Built like a Japanese <AnimatedInkUnderline>manga studio</AnimatedInkUnderline>, not a generic prompt box.
            </ScrollRevealHeading>
          </div>
          <p className="text-sm text-[#525252] max-w-sm leading-relaxed">
            Every panel, character sheet, speech tail, and screentone layer remains editable from
            first draft through press export.
          </p>
        </div>

        {/* Responsive Asymmetric Bento Grid */}
        <div className="feat-bento-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          {/* 1. AI Manga Director — Wide 7 cols */}
          <article
            className="feat-bento-card md:col-span-2 lg:col-span-7 bg-white border-2 border-[#222222] p-5 sm:p-7 manga-panel-shadow manga-card-interactive flex flex-col justify-between relative"
          >
            <MangaCropMarks />
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#E63946] mb-1.5">
                  <Film className="w-4 h-4" />
                  <span>01 · AI Manga Director</span>
                </div>
                <h3 className="font-editorial text-xl font-extrabold text-[#171717]">
                  Story-to-Storyboard Pacing
                </h3>
                <p className="text-sm text-[#525252] mt-1">
                  Automatically transforms prose and scripts into dramatic panel progressions.
                </p>
              </div>
              <MangaStarburstBadge
                text="PACE!"
                bg="#FFB703"
                className="hidden sm:inline-flex w-12 h-12 shrink-0"
              />
            </div>

            <div className="border-2 border-[#222222] bg-[#FAF9F6] p-3.5 sm:p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {beats.map((b, i) => (
                  <MangaButton
                    key={b.label}
                    sfxLabel="CUT!"
                    onClick={() => setActiveBeat(i)}
                    className={`px-3 py-1.5 text-xs font-bold border-2 border-[#222222] cursor-pointer whitespace-nowrap ${
                      activeBeat === i
                        ? 'bg-[#171717] text-white manga-panel-shadow-sm'
                        : 'bg-white text-[#171717] hover:bg-[#EAE7E0]'
                    }`}
                  >
                    {b.label}
                  </MangaButton>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 min-h-[7rem]">
                {beats.map((b, i) => (
                  <div
                    key={b.label}
                    className={`border-2 p-2.5 flex flex-col justify-between transition-all ${
                      activeBeat === i
                        ? 'border-[#E63946] bg-white shadow-[3px_3px_0px_#E63946]'
                        : 'border-[#222222] bg-[#F1EFEA] opacity-75'
                    }`}
                  >
                    <span className="font-mono text-[10px] font-bold text-[#737373]">
                      BEAT 0{i + 1}
                    </span>
                    <span className="text-xs font-bold text-[#171717] leading-snug mt-2">{b.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* 2. Character Consistency — 5 cols */}
          <article
            className="feat-bento-card md:col-span-1 lg:col-span-5 bg-white border-2 border-[#222222] p-5 sm:p-7 manga-panel-shadow manga-card-interactive flex flex-col justify-between"
          >
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#E63946] mb-1.5">
                <Users className="w-4 h-4" />
                <span>02 · Character Consistency</span>
              </div>
              <h3 className="font-editorial text-xl font-extrabold text-[#171717]">
                Locked Turnaround Sheets
              </h3>
              <p className="text-sm text-[#525252] mt-1">
                Preserve faces, hair silhouettes, scars, and outfits across every chapter.
              </p>
            </div>
            <div className="border-2 border-[#222222] overflow-hidden aspect-[16/10] sm:aspect-[16/9] bg-[#FAF9F6] relative">
              <MangaImage
                src={MANGA_ARTWORK.characterTurnaround}
                alt="Character turnaround consistency sheet"
                fallbackTitle="Turnaround Sheet"
                className="w-full h-full object-cover object-top"
              />
              <span className="absolute bottom-2 right-2 bg-white/95 border border-[#222222] px-2 py-0.5 font-mono text-[10px] font-bold">
                SEED #409 LOCKED
              </span>
            </div>
          </article>

          {/* 3. Intelligent Storyboarding — 4 cols */}
          <article
            className="feat-bento-card md:col-span-1 lg:col-span-4 bg-white border-2 border-[#222222] p-5 sm:p-6 manga-panel-shadow manga-card-interactive flex flex-col justify-between"
          >
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#E63946] mb-1.5">
                <LayoutGrid className="w-4 h-4" />
                <span>03 · Intelligent Storyboarding</span>
              </div>
              <h3 className="font-editorial text-lg font-extrabold text-[#171717]">
                Adaptive Scene Splitting
              </h3>
              <p className="text-sm text-[#525252] mt-1">
                Divides scripts into rhythmic gutters and weighted panels.
              </p>
            </div>

            <div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(['3-panel', '5-panel'] as const).map((mode) => (
                  <MangaButton
                    key={mode}
                    sfxLabel="GRID!"
                    onClick={() => setPanelSplit(mode)}
                    className={`px-2.5 py-1 text-xs font-bold border-2 border-[#222222] cursor-pointer ${
                      panelSplit === mode ? 'bg-[#171717] text-white' : 'bg-[#FAF9F6] text-[#171717]'
                    }`}
                  >
                    {mode === '3-panel' ? '3-Panel Drama' : '5-Panel Action'}
                  </MangaButton>
                ))}
              </div>
              <div className="h-28 border-2 border-[#222222] bg-[#FAF9F6] p-2 grid grid-cols-2 gap-1.5 relative overflow-hidden">
                <SpeedLinesSvg className="absolute inset-0 w-full h-full" opacity={0.12} />
                {panelSplit === '3-panel' ? (
                  <>
                    <div className="col-span-2 bg-white border-2 border-[#222222] z-10" />
                    <div className="bg-[#EAE7E0] border-2 border-[#222222] z-10" />
                    <div className="bg-white border-2 border-[#222222] z-10" />
                  </>
                ) : (
                  <>
                    <div className="bg-white border-2 border-[#222222] z-10" />
                    <div className="bg-[#EAE7E0] border-2 border-[#222222] z-10" />
                    <div className="col-span-2 bg-[#E63946]/15 border-2 border-[#222222] z-10" />
                    <div className="bg-white border-2 border-[#222222] z-10" />
                    <div className="bg-white border-2 border-[#222222] z-10" />
                  </>
                )}
              </div>
            </div>
          </article>

          {/* 4. Dialogue & Speech Bubbles — 4 cols */}
          <article
            className="feat-bento-card md:col-span-1 lg:col-span-4 bg-white border-2 border-[#222222] p-5 sm:p-6 manga-panel-shadow manga-card-interactive flex flex-col justify-between"
          >
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#E63946] mb-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>04 · Dialogue & Bubbles</span>
              </div>
              <h3 className="font-editorial text-lg font-extrabold text-[#171717]">
                Expressive Speech Lettering
              </h3>
              <p className="text-sm text-[#525252] mt-1">
                Place, rotate, and restyle speech, shout, thought, and narration boxes.
              </p>
            </div>

            <div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(['speech', 'shout', 'thought', 'narration'] as const).map((style) => (
                  <MangaButton
                    key={style}
                    sfxLabel="POP!"
                    onClick={() => setBubbleMode(style)}
                    className={`px-2.5 py-1 text-[11px] font-bold border-2 border-[#222222] capitalize cursor-pointer ${
                      bubbleMode === style ? 'bg-[#E63946] text-white' : 'bg-[#FAF9F6] text-[#171717]'
                    }`}
                  >
                    {style}
                  </MangaButton>
                ))}
              </div>
              <div className="h-28 border-2 border-[#222222] bg-[#FAF9F6] manga-halftone-subtle flex items-center justify-center p-3">
                <div
                  className={`px-4 py-2 bg-white border-2 border-[#222222] font-dialogue text-xs font-bold text-center transition-all ${
                    bubbleMode === 'speech'
                      ? 'rounded-2xl'
                      : bubbleMode === 'shout'
                        ? 'border-[3px] rotate-[-2deg] shadow-[3px_3px_0px_#E63946] font-comic text-sm tracking-wider'
                        : bubbleMode === 'thought'
                          ? 'rounded-full border-dashed'
                          : 'rounded-none bg-[#F1EFEA]'
                  }`}
                >
                  {bubbleMode === 'shout'
                    ? 'STOP RIGHT THERE!!'
                    : bubbleMode === 'thought'
                      ? '(Could he already know?)'
                      : bubbleMode === 'narration'
                        ? 'Midnight · Tokyo Sector 4'
                        : 'Stay behind the chalk line.'}
                </div>
              </div>
            </div>
          </article>

          {/* 5. Advanced Panel Editor & 6. Export — 4 cols */}
          <article
            className="feat-bento-card md:col-span-1 lg:col-span-4 bg-white border-2 border-[#222222] p-5 sm:p-6 manga-panel-shadow manga-card-interactive flex flex-col justify-between gap-4"
          >
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#E63946] mb-1">
                <PenTool className="w-4 h-4" />
                <span>05 · Advanced Panel Editor</span>
              </div>
              <h3 className="font-editorial text-lg font-extrabold text-[#171717]">
                Full Canvas Control
              </h3>
              <p className="text-sm text-[#525252] mt-1">
                Drag panels, adjust gutters, tune contrast, or regenerate single shots.
              </p>
            </div>

            <div className="pt-4 border-t border-[#222222]/15">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#E63946] mb-1">
                <Download className="w-4 h-4" />
                <span>06 · High-Quality Export</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-2">
                <span className="text-sm font-bold text-[#171717]">300–600 DPI Print Ready</span>
                <div className="flex gap-1">
                  {(['PDF', 'PNG'] as const).map((fmt) => (
                    <MangaButton
                      key={fmt}
                      sfxLabel={fmt}
                      onClick={() => setExportFmt(fmt)}
                      className={`px-2.5 py-1 text-xs font-mono font-bold border-2 border-[#222222] cursor-pointer ${
                        exportFmt === fmt ? 'bg-[#171717] text-white' : 'bg-[#FAF9F6] text-[#171717]'
                      }`}
                    >
                      {fmt}
                    </MangaButton>
                  ))}
                </div>
              </div>
              <p className="text-xs font-mono text-[#737373] mt-1.5">
                {exportFmt === 'PDF'
                  ? 'B5 Tankobon Chapter Master · Bleed Marks'
                  : 'Lossless Grayscale & Color Page Pack'}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
