import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Camera } from 'lucide-react';
import { MANGA_ARTWORK } from '../../config/media';
import type { CameraAngle } from '../../types/manga';
import { ScrollRevealHeading } from '../manga/AnimatedTypography';
import { MangaButton } from '../manga/MangaButton';
import {
  MangaCropMarks,
  MangaImage,
  MangaInkSlash,
  MangaInkSplatterSvg,
  MangaRulerTicks,
  MangaVerticalStamp,
  SpeedLinesSvg,
} from '../manga/MangaDecorations';

gsap.registerPlugin(ScrollTrigger);

const PIPELINE_STAGES = [
  'Story Script',
  'Scene Breakdown',
  'Panel Composition',
  'Final Manga Page',
] as const;

const CAMERA_ANGLES: {
  angle: CameraAngle;
  shotCode: string;
  framingNote: string;
  dialogue: string;
  imageUrl: string;
  objectPosition: string;
  scaleClass: string;
}[] = [
  {
    angle: 'Wide cinematic shot',
    shotCode: 'CAM-01 · 24MM',
    framingNote: 'Establishes rain-soaked Tokyo alley depth and lone silhouette scale.',
    dialogue: 'Narration: Three blocks north of Kabukicho, the rain erased every footprint.',
    imageUrl: MANGA_ARTWORK.seinen,
    objectPosition: 'center center',
    scaleClass: 'scale-100',
  },
  {
    angle: 'Extreme close-up',
    shotCode: 'CAM-02 · 85MM',
    framingNote: 'Tight eye-line crop isolating determination before the draw.',
    dialogue: 'Renji: "You hesitated for half a breath."',
    imageUrl: MANGA_ARTWORK.characterTurnaround,
    objectPosition: 'right 22%',
    scaleClass: 'scale-120',
  },
  {
    angle: 'Low-angle perspective',
    shotCode: 'CAM-03 · 18MM LOW',
    framingNote: 'Tilted upward horizon amplifying heroic stature against drifting sky.',
    dialogue: 'Vespera: "Look up. The citadel is descending."',
    imageUrl: MANGA_ARTWORK.fantasy,
    objectPosition: 'center 35%',
    scaleClass: 'scale-105',
  },
  {
    angle: 'Dynamic action perspective',
    shotCode: 'CAM-04 · KINETIC',
    framingNote: 'Foreshortened strike surrounded by radial speed lines and debris.',
    dialogue: 'Renji: "KRAAK!! BREAK THE SEAL!"',
    imageUrl: MANGA_ARTWORK.duelSplash,
    objectPosition: 'center center',
    scaleClass: 'scale-110',
  },
  {
    angle: 'Emotional character close-up',
    shotCode: 'CAM-05 · 50MM',
    framingNote: 'Soft visor rim reflection and quiet resolve inside the cockpit.',
    dialogue: 'Aoi: "If we miss this orbital window, no one hears the signal."',
    imageUrl: MANGA_ARTWORK.scifi,
    objectPosition: '70% 35%',
    scaleClass: 'scale-110',
  },
];

export function DirectorSection() {
  const prefersReducedMotion = useReducedMotion();
  const [stageIndex, setStageIndex] = useState(3);
  const [angleIndex, setAngleIndex] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.director-stage-reveal',
        { y: 26, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.12,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: '.director-stage-grid',
            start: 'top 86%',
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const activeCamera = CAMERA_ANGLES[angleIndex];

  return (
    <section
      id="director"
      ref={sectionRef}
      className="relative z-10 py-20 sm:py-24 bg-[#FAF9F6] border-b-2 border-[#222222] overflow-x-clip"
    >
      <SpeedLinesSvg className="absolute -left-24 top-12 w-[480px] h-[340px]" opacity={0.05} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-12">
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-3">
              AI Manga Director · 演出エンジン
            </p>
            <ScrollRevealHeading className="font-display text-2xl sm:text-4xl lg:text-[2.65rem] font-normal text-[#171717] leading-[1.15]">
              Not Just Illustration. Visual Storytelling.
            </ScrollRevealHeading>
            <MangaInkSlash className="w-44 h-3.5 mt-3" />
            <p className="text-sm sm:text-base text-[#525252] mt-4 leading-relaxed">
              MangaForge reads narrative intent—pacing quiet pauses before impact beats, selecting
              cinematographic camera lenses, and structuring balanced Japanese page rhythm.
            </p>
          </div>
          <div className="hidden lg:flex flex-col items-end gap-1.5 shrink-0">
            <MangaInkSplatterSvg className="w-28 h-14 opacity-85" />
            <MangaRulerTicks className="w-36 h-2.5" />
          </div>
        </div>

        {/* 4-stage pipeline selector */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-8">
          {PIPELINE_STAGES.map((stage, idx) => (
            <div key={stage} className="flex items-center gap-2 sm:gap-3">
              <MangaButton
                sfxLabel={`0${idx + 1}!`}
                onClick={() => setStageIndex(idx)}
                className={`px-3.5 py-2 text-xs font-bold border-2 border-[#222222] cursor-pointer whitespace-nowrap ${
                  stageIndex === idx
                    ? 'bg-[#E63946] text-white manga-panel-shadow-sm'
                    : 'bg-white text-[#171717] hover:bg-[#F1EFEA]'
                }`}
              >
                0{idx + 1}. {stage}
              </MangaButton>
              {idx < PIPELINE_STAGES.length - 1 && (
                <ArrowRight className="w-4 h-4 text-[#737373] hidden sm:block" />
              )}
            </div>
          ))}
        </div>

        {/* Main Interactive Director Stage */}
        <div className="director-stage-grid grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* Camera Angle Controls */}
          <div className="director-stage-reveal lg:col-span-4 bg-white border-2 border-[#222222] p-4 sm:p-5 manga-panel-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#171717] pb-3 mb-4 border-b border-[#222222]/15">
                <Camera className="w-4 h-4 text-[#E63946]" />
                <span>Camera Perspective Engine</span>
              </div>
              <div className="space-y-2">
                {CAMERA_ANGLES.map((cam, idx) => (
                  <MangaButton
                    key={cam.angle}
                    sfxLabel="CAM!"
                    onClick={() => setAngleIndex(idx)}
                    className={`w-full text-left px-3.5 py-2.5 border-2 cursor-pointer ${
                      angleIndex === idx
                        ? 'border-[#222222] bg-[#FAF9F6] font-bold shadow-[2px_2px_0px_#E63946]'
                        : 'border-[#222222]/15 hover:border-[#222222]/50 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm text-[#171717]">{cam.angle}</span>
                      <span className="font-mono text-[10px] text-[#E63946] shrink-0">
                        {cam.shotCode}
                      </span>
                    </div>
                  </MangaButton>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#222222]/15">
              <p className="text-xs font-mono font-bold text-[#171717]">{activeCamera.shotCode}</p>
              <p className="text-xs text-[#525252] mt-1 leading-relaxed">
                {activeCamera.framingNote}
              </p>
            </div>
          </div>

          {/* Interactive Multi-Panel Output Preview (fluid responsive height — never overflows) */}
          <div className="director-stage-reveal lg:col-span-8 bg-white border-2 border-[#222222] p-4 sm:p-6 manga-panel-shadow flex flex-col justify-between relative">
            <MangaCropMarks />
            <MangaVerticalStamp
              label="カメラ演出"
              className="hidden sm:inline-flex absolute -right-4 top-12 z-20"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b-2 border-[#222222]">
              <span className="font-mono text-xs font-bold text-[#171717]">
                STAGE: {PIPELINE_STAGES[stageIndex].toUpperCase()}
              </span>
              <span className="font-mono text-xs text-[#737373]">
                LENS: {activeCamera.angle}
              </span>
            </div>

            {stageIndex === 0 ? (
              <div className="min-h-[260px] sm:min-h-[340px] border-2 border-[#222222] bg-[#FAF9F6] p-5 sm:p-6 font-mono text-xs sm:text-sm text-[#171717] space-y-4">
                <p className="font-bold text-[#E63946]">INT./EXT. SCENE SCRIPT — INPUT</p>
                <p>
                  1. Establish the cold expanse of the ridge or alley before the protagonist moves.
                </p>
                <p>
                  2. Cut sharply to an {activeCamera.angle.toLowerCase()} capturing resolve and
                  breath fogging in the air.
                </p>
                <p>
                  3. Dialogue beat: {activeCamera.dialogue}
                </p>
              </div>
            ) : stageIndex === 1 ? (
              <div className="min-h-[260px] sm:min-h-[340px] border-2 border-[#222222] bg-[#FAF9F6] p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { beat: 'Beat 01', label: 'Establish Horizon', ratio: '40% Page Weight' },
                  { beat: 'Beat 02', label: activeCamera.angle, ratio: '35% Page Weight' },
                  { beat: 'Beat 03', label: 'Dialogue & Pause', ratio: '25% Page Weight' },
                ].map((item) => (
                  <div
                    key={item.beat}
                    className="bg-white border-2 border-[#222222] p-4 flex flex-col justify-between gap-4"
                  >
                    <span className="font-mono text-xs text-[#E63946] font-bold">{item.beat}</span>
                    <div>
                      <h4 className="font-editorial font-extrabold text-base text-[#171717]">
                        {item.label}
                      </h4>
                      <p className="font-mono text-xs text-[#737373] mt-1">{item.ratio}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : stageIndex === 2 ? (
              <div className="min-h-[260px] sm:min-h-[340px] border-2 border-[#222222] bg-white p-3.5 sm:p-4 grid grid-cols-12 gap-3">
                <div className="col-span-12 sm:col-span-7 min-h-[160px] border-2 border-[#222222] bg-[#F1EFEA] manga-halftone-subtle p-4 flex flex-col justify-between">
                  <span className="font-mono text-xs font-bold text-[#171717]">
                    PRIMARY PANEL · {activeCamera.shotCode}
                  </span>
                  <span className="text-xs text-[#525252]">Focal rule-of-thirds grid locked</span>
                </div>
                <div className="col-span-12 sm:col-span-5 grid grid-rows-2 gap-3">
                  <div className="border-2 border-[#222222] bg-[#FAF9F6] p-3 min-h-[75px] flex items-end">
                    <span className="font-mono text-[11px] text-[#737373]">PANEL 02 · REACTION</span>
                  </div>
                  <div className="border-2 border-[#222222] bg-[#E63946]/10 p-3 min-h-[75px] flex items-end">
                    <span className="font-mono text-[11px] text-[#E63946] font-bold">
                      PANEL 03 · DIALOGUE SLOT
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <motion.div
                key={activeCamera.angle}
                initial={prefersReducedMotion ? false : { opacity: 0.6, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-12 gap-3"
              >
                <div className="col-span-12 sm:col-span-8 relative aspect-[4/3] sm:aspect-auto sm:min-h-[340px] border-2 border-[#222222] overflow-hidden bg-[#F1EFEA]">
                  <MangaImage
                    src={activeCamera.imageUrl}
                    alt={activeCamera.angle}
                    fallbackTitle={activeCamera.angle}
                    className={`w-full h-full object-cover transition-transform duration-300 ${activeCamera.scaleClass}`}
                    style={{ objectPosition: activeCamera.objectPosition }}
                  />
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 border-2 border-[#222222] px-3 py-2 font-dialogue text-xs font-bold text-[#171717]">
                    {activeCamera.dialogue}
                  </div>
                </div>
                <div className="col-span-12 sm:col-span-4 grid grid-cols-2 sm:grid-cols-1 sm:grid-rows-2 gap-3">
                  <div className="aspect-[4/3] sm:aspect-auto border-2 border-[#222222] overflow-hidden bg-[#FAF9F6]">
                    <MangaImage
                      src={MANGA_ARTWORK.heroPage}
                      alt="Supporting reaction shot"
                      fallbackTitle="Reaction"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="aspect-[4/3] sm:aspect-auto border-2 border-[#222222] overflow-hidden bg-[#FAF9F6]">
                    <MangaImage
                      src={MANGA_ARTWORK.characterTurnaround}
                      alt="Character continuity anchor"
                      fallbackTitle="Continuity"
                      className="w-full h-full object-cover object-right"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
