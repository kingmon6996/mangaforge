import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Layers, Sparkles } from 'lucide-react';
import { MANGA_ARTWORK } from '../../config/media';
import { useAuth } from '../../store/AuthContext';
import { scrollToSection } from '../../utils/smoothScroll';
import { ScrollRevealHeading } from '../manga/AnimatedTypography';
import { MangaButton } from '../manga/MangaButton';
import {
  MangaCropMarks,
  MangaImage,
  MangaKatakanaSfx,
  MangaVerticalStamp,
  SpeedLinesSvg,
} from '../manga/MangaDecorations';
import { MangaLogo } from '../manga/MangaLogo';

gsap.registerPlugin(ScrollTrigger);

const LAUNCH_PRESETS = [
  {
    id: 'shonen',
    label: 'Shonen Action',
    sfx: 'ドン!!',
    jpTag: '少年アクション',
    layoutName: '5-Panel Dynamic Action · 600 DPI',
    mainImage: MANGA_ARTWORK.duelSplash,
    refLeft: MANGA_ARTWORK.shonen,
    refRight: MANGA_ARTWORK.characterTurnaround,
    caption: 'Foreshortened clash spread paired with locked hero turnaround seed.',
  },
  {
    id: 'seinen',
    label: 'Seinen Noir',
    sfx: 'ザッ!!',
    jpTag: '青年ドラマ',
    layoutName: '3-Panel Cinematic Widescreen · B5',
    mainImage: MANGA_ARTWORK.workflowStoryboard,
    refLeft: MANGA_ARTWORK.seinen,
    refRight: MANGA_ARTWORK.heroPage,
    caption: 'Atmospheric rain-slick framing with heavy shadows and crisp dialogue tails.',
  },
  {
    id: 'fantasy',
    label: 'High Fantasy',
    sfx: 'ゴゴゴ',
    jpTag: 'ファンタジー',
    layoutName: 'Splash Horizon Reveal · Tankobon',
    mainImage: MANGA_ARTWORK.fantasy,
    refLeft: MANGA_ARTWORK.scifi,
    refRight: MANGA_ARTWORK.characterTurnaround,
    caption: 'Sweeping world-building vistas anchored by consistent cast expressions.',
  },
] as const;

export function FooterSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const footerRef = useRef<HTMLElement | null>(null);
  const slowRef = useRef<HTMLDivElement | null>(null);
  const fastRef = useRef<HTMLDivElement | null>(null);
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);

  const handleLaunchStudio = useCallback(() => {
    navigate(isAuthenticated ? '/dashboard/create' : '/signup');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !footerRef.current) return;

    const ctx = gsap.context(() => {
      if (slowRef.current) {
        gsap.fromTo(
          slowRef.current,
          { y: 24 },
          {
            y: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: footerRef.current,
              start: 'top bottom',
              end: 'top 35%',
              scrub: 0.7,
            },
          }
        );
      }

      if (fastRef.current) {
        gsap.fromTo(
          fastRef.current,
          { y: 38 },
          {
            y: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: footerRef.current,
              start: 'top bottom',
              end: 'top 35%',
              scrub: 0.7,
            },
          }
        );
      }
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const preset = LAUNCH_PRESETS[selectedPresetIdx];

  return (
    <footer
      ref={footerRef}
      className="relative z-20 bg-[#FAF9F6] pt-16 sm:pt-20 pb-12 overflow-hidden border-t border-[#222222]/10"
    >
      <SpeedLinesSvg className="absolute inset-0 w-full h-full" opacity={0.05} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Serialization Launchpad Spread */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pb-14 sm:pb-16 border-b-2 border-[#222222]">
          <div ref={slowRef} className="lg:col-span-6 space-y-5 will-change-transform">
            <div className="flex items-center gap-3">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946]">
                Begin Serialization · 連載開始
              </p>
              <MangaKatakanaSfx
                glyph={preset.sfx}
                sub={preset.jpTag}
                className="hidden sm:inline-flex"
              />
            </div>

            <ScrollRevealHeading className="font-display text-2xl sm:text-4xl lg:text-[2.85rem] font-normal text-[#171717] leading-[1.12]">
              Open the Studio. Ink Your First Volume Today.
            </ScrollRevealHeading>

            <p className="text-sm sm:text-base text-[#525252] leading-relaxed max-w-xl">
              Choose a starter direction below and step directly into the B5 MangaForge canvas with
              locked character seeds, balanced panel gutters, and 600 DPI press-ready export.
            </p>

            {/* Interactive Starter Genre Selector */}
            <div className="space-y-2 pt-1">
              <span className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                Preview Starter Direction
              </span>
              <div className="flex flex-wrap gap-2">
                {LAUNCH_PRESETS.map((item, idx) => (
                  <MangaButton
                    key={item.id}
                    sfxLabel="SET!"
                    onClick={() => setSelectedPresetIdx(idx)}
                    className={`px-3.5 py-2 text-xs font-bold border-2 border-[#222222] cursor-pointer whitespace-nowrap ${
                      selectedPresetIdx === idx
                        ? 'bg-[#171717] text-white manga-panel-shadow-sm'
                        : 'bg-white text-[#171717] hover:bg-[#EAE7E0]'
                    }`}
                  >
                    {item.label}
                  </MangaButton>
                ))}
              </div>
            </div>

            {/* Dual High-Impact Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <MangaButton
                sfxLabel="INK!"
                onClick={handleLaunchStudio}
                className="group inline-flex items-center gap-2 px-6 py-3.5 bg-[#E63946] text-white text-sm font-bold border-2 border-[#222222] manga-panel-shadow hover:bg-[#171717] cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAuthenticated ? 'Launch Chapter Studio' : 'Start Creating Free'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </MangaButton>

              <MangaButton
                sfxLabel="GO!"
                onClick={() => navigate(isAuthenticated ? '/dashboard/templates' : '/login')}
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-white text-[#171717] text-sm font-bold border-2 border-[#222222] manga-panel-shadow-sm hover:bg-[#F1EFEA] cursor-pointer"
              >
                <Layers className="w-4 h-4 text-[#E63946]" />
                <span>{isAuthenticated ? 'Browse Panel Templates' : 'Creator Sign In'}</span>
              </MangaButton>
            </div>
          </div>

          {/* Right: 3-Panel Multi-Shot Manga Spread Card */}
          <div ref={fastRef} className="lg:col-span-6 relative will-change-transform">
            <div className="relative bg-white border-2 border-[#222222] p-3.5 sm:p-5 manga-panel-shadow space-y-3">
              <MangaCropMarks />
              <MangaVerticalStamp
                label="連載開始"
                className="hidden sm:inline-flex absolute -right-4 top-12 z-20"
              />

              <div className="flex items-center justify-between text-[11px] font-mono border-b border-[#222222]/20 pb-2">
                <span className="font-bold text-[#171717] truncate">{preset.layoutName}</span>
                <span className="text-[#E63946] font-bold shrink-0">COLOR MASTER</span>
              </div>

              <div className="aspect-[16/9] border-2 border-[#222222] overflow-hidden bg-[#F1EFEA]">
                <MangaImage
                  src={preset.mainImage}
                  alt={preset.label}
                  fallbackTitle={preset.label}
                  className="w-full h-full object-cover object-center"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="aspect-[16/10] border-2 border-[#222222] overflow-hidden bg-[#FAF9F6]">
                  <MangaImage
                    src={preset.refLeft}
                    alt={`${preset.label} key frame`}
                    fallbackTitle={preset.label}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="aspect-[16/10] border-2 border-[#222222] overflow-hidden bg-[#FAF9F6]">
                  <MangaImage
                    src={preset.refRight}
                    alt={`${preset.label} reference sheet`}
                    fallbackTitle={preset.label}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>

              <div className="bg-[#FAF9F6] border border-[#222222] px-3 py-2 flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-[#171717] truncate">{preset.caption}</span>
                <button
                  type="button"
                  onClick={handleLaunchStudio}
                  className="font-mono text-[11px] font-bold text-[#E63946] hover:underline shrink-0 cursor-pointer"
                >
                  OPEN →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-12 border-b border-[#222222]/15 text-sm">
          <div>
            <MangaLogo size={28} />
            <p className="text-xs text-[#737373] mt-3 leading-relaxed max-w-[200px]">
              Japanese editorial AI manga creation workspace for writers, illustrators, and indie
              publishers.
            </p>
          </div>
          <div>
            <h3 className="font-editorial font-extrabold text-[#171717] mb-3">Product</h3>
            <ul className="space-y-2 text-[#525252]">
              <li>
                <a
                  href="#features"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('features');
                  }}
                  className="hover:text-[#E63946]"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#director"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('director');
                  }}
                  className="hover:text-[#E63946]"
                >
                  AI Manga Director
                </a>
              </li>
              <li>
                <a
                  href="#showcase"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('showcase');
                  }}
                  className="hover:text-[#E63946]"
                >
                  Genre Showcase
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('pricing');
                  }}
                  className="hover:text-[#E63946]"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-editorial font-extrabold text-[#171717] mb-3">Studio</h3>
            <ul className="space-y-2 text-[#525252]">
              <li><Link to="/signup" className="hover:text-[#E63946]">Create Account</Link></li>
              <li><Link to="/login" className="hover:text-[#E63946]">Creator Sign In</Link></li>
              <li><Link to="/dashboard" className="hover:text-[#E63946]">Dashboard</Link></li>
              <li><Link to="/dashboard/characters" className="hover:text-[#E63946]">Character Sheets</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-editorial font-extrabold text-[#171717] mb-3">Resources & Legal</h3>
            <ul className="space-y-2 text-[#525252]">
              <li><Link to="/dashboard/help" className="hover:text-[#E63946]">Studio Guide</Link></li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('how-it-works');
                  }}
                  className="hover:text-[#E63946]"
                >
                  Workflow Docs
                </a>
              </li>
              <li><Link to="/forgot-password" className="hover:text-[#E63946]">Reset Password</Link></li>
              <li><Link to="/signup" className="hover:text-[#E63946]">Terms & Privacy</Link></li>
            </ul>
          </div>
        </div>

        {/* Oversized Wordmark + Bottom Row */}
        <div className="pt-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="font-display text-4xl sm:text-6xl lg:text-7xl tracking-tight text-[#171717] leading-none select-none">
            Manga<span className="text-[#E63946]">Forge</span>
          </div>
          <p className="text-xs text-[#737373] font-mono">
            © 2026 MangaForge Studio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
