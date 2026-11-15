import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SHOWCASE_ITEMS, type ShowcaseItem } from '../../config/media';
import type { MangaGenre } from '../../types/manga';
import { ScrollRevealHeading } from '../manga/AnimatedTypography';
import { MangaButton } from '../manga/MangaButton';
import {
  MangaImage,
  MangaKatakanaSfx,
  MangaScreentoneWedge,
} from '../manga/MangaDecorations';

gsap.registerPlugin(ScrollTrigger);

const GENRE_FILTERS: ('All' | MangaGenre)[] = [
  'All',
  'Shonen',
  'Shojo',
  'Seinen',
  'Horror',
  'Romance',
  'Fantasy',
  'Action',
  'Sci-Fi',
];

export function ShowcaseSection() {
  const [selectedGenre, setSelectedGenre] = useState<'All' | MangaGenre>('All');
  const [activeSample, setActiveSample] = useState<ShowcaseItem | null>(null);
  const [samplePageIndex, setSamplePageIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.showcase-vol-card',
        { x: 32, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.06,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: trackRef.current,
            start: 'top 86%',
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const filtered =
    selectedGenre === 'All'
      ? SHOWCASE_ITEMS
      : SHOWCASE_ITEMS.filter((item) => item.genre === selectedGenre);

  const scrollGallery = (dir: 'left' | 'right') => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({ left: dir === 'right' ? 340 : -340, behavior: 'smooth' });
  };

  return (
    <section
      id="showcase"
      ref={sectionRef}
      className="relative py-20 sm:py-24 bg-[#F1EFEA] border-b-2 border-[#222222] overflow-x-clip"
    >
      <MangaScreentoneWedge
        corner="top-right"
        className="absolute top-0 right-0 w-44 sm:w-64 h-44 sm:h-64"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-3">
              Editorial Gallery · 連載サンプル
            </p>
            <ScrollRevealHeading className="font-display text-2xl sm:text-4xl font-normal text-[#171717] leading-[1.15]">
              Eight genres. One unmistakable ink standard.
            </ScrollRevealHeading>
          </div>

          <div className="flex items-center gap-3">
            <MangaKatakanaSfx glyph="バキッ" sub="8 GENRES" className="hidden sm:inline-flex mr-2" />
            <MangaButton
              onClick={() => scrollGallery('left')}
              aria-label="Scroll showcase left"
              className="p-2.5 border-2 border-[#222222] bg-white hover:bg-[#171717] hover:text-white cursor-pointer manga-panel-shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </MangaButton>
            <MangaButton
              onClick={() => scrollGallery('right')}
              aria-label="Scroll showcase right"
              className="p-2.5 border-2 border-[#222222] bg-white hover:bg-[#171717] hover:text-white cursor-pointer manga-panel-shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </MangaButton>
          </div>
        </div>

        {/* Interactive genre filter tabs */}
        <div
          className="flex flex-wrap items-center gap-2 mb-8"
          role="tablist"
          aria-label="Manga genre filter"
        >
          {GENRE_FILTERS.map((genre) => (
            <MangaButton
              key={genre}
              sfxLabel={genre === 'All' ? 'ALL!' : undefined}
              role="tab"
              aria-selected={selectedGenre === genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3.5 py-1.5 text-xs font-bold border-2 border-[#222222] cursor-pointer whitespace-nowrap ${
                selectedGenre === genre
                  ? 'bg-[#171717] text-white manga-panel-shadow-sm'
                  : 'bg-white text-[#171717] hover:bg-[#EAE7E0]'
              }`}
            >
              {genre}
            </MangaButton>
          ))}
        </div>

        {/* Responsive horizontal volume cover gallery */}
        <div
          ref={trackRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto pb-4 studio-scroll snap-x snap-mandatory"
        >
          {filtered.map((item) => (
            <article
              key={item.id}
              className="showcase-vol-card w-[78vw] max-w-[300px] sm:w-[290px] lg:w-[310px] shrink-0 snap-start bg-white border-2 border-[#222222] manga-panel-shadow manga-card-interactive flex flex-col justify-between"
            >
              <div>
                {/* Manga volume spine header */}
                <div className="px-4 py-2.5 border-b-2 border-[#222222] flex items-center justify-between bg-[#FAF9F6]">
                  <span className="font-mono text-xs font-bold text-[#E63946]">{item.genre}</span>
                  <span className="font-mono text-[11px] text-[#737373]">{item.volumeLabel}</span>
                </div>

                {/* Responsive Cover Artwork matched to 3:4 portrait prints */}
                <div className="aspect-[3/4] overflow-hidden border-b-2 border-[#222222] bg-[#EAE7E0] group">
                  <MangaImage
                    src={item.imageUrl}
                    alt={`${item.title} manga cover`}
                    fallbackTitle={item.title}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="p-4">
                  <h3 className="font-editorial text-lg font-extrabold text-[#171717] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#525252] mt-1.5 leading-relaxed">
                    {item.authorNote}
                  </p>
                </div>
              </div>

              <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-[#222222]/10">
                <span className="font-mono text-xs text-[#737373] tabular-nums">
                  {item.chapters} chapters
                </span>
                <MangaButton
                  sfxLabel="READ!"
                  onClick={() => {
                    setActiveSample(item);
                    setSamplePageIndex(0);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[#222222] bg-[#FAF9F6] text-xs font-bold text-[#171717] hover:bg-[#E63946] hover:text-white cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>View Sample Manga</span>
                </MangaButton>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Sample Manga Reader Modal */}
      {activeSample && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Sample Manga: ${activeSample.title}`}
        >
          <div className="bg-[#FAF9F6] border-2 border-[#222222] max-w-2xl w-full max-h-[92vh] overflow-y-auto manga-panel-shadow">
            <div className="px-4 sm:px-5 py-3.5 bg-white border-b-2 border-[#222222] flex items-center justify-between gap-4 sticky top-0 z-10">
              <div className="min-w-0">
                <p className="font-mono text-[11px] font-bold text-[#E63946]">
                  {activeSample.genre} · {activeSample.volumeLabel}
                </p>
                <h3 className="font-editorial text-base sm:text-lg font-extrabold text-[#171717] truncate">
                  {activeSample.title}
                </h3>
              </div>
              <MangaButton
                onClick={() => setActiveSample(null)}
                aria-label="Close sample reader"
                className="p-2 border-2 border-[#222222] bg-white hover:bg-[#E63946] hover:text-white cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </MangaButton>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {(() => {
                const page = activeSample.samplePages[samplePageIndex] || activeSample.samplePages[0];
                return (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#737373]">
                      <span>{page.title}</span>
                      <span>{page.caption}</span>
                    </div>
                    <div className="aspect-[4/3] sm:aspect-[16/10] border-2 border-[#222222] bg-white overflow-hidden">
                      <MangaImage
                        src={page.imageUrl}
                        alt={page.title}
                        fallbackTitle={page.title}
                        className="w-full h-full object-contain bg-[#FAF9F6]"
                      />
                    </div>
                    <div className="border-2 border-[#222222] bg-white px-4 py-3 font-dialogue text-sm font-bold text-[#171717]">
                      {page.dialogue}
                    </div>
                  </>
                );
              })()}

              <div className="flex items-center justify-between pt-2">
                <span className="font-mono text-xs text-[#737373] tabular-nums">
                  Sample Page {samplePageIndex + 1} of {activeSample.samplePages.length}
                </span>
                <div className="flex items-center gap-2">
                  <MangaButton
                    disabled={samplePageIndex === 0}
                    onClick={() => setSamplePageIndex((p) => Math.max(0, p - 1))}
                    className="px-3 py-1.5 text-xs font-bold border-2 border-[#222222] bg-white disabled:opacity-40 cursor-pointer"
                  >
                    Previous Page
                  </MangaButton>
                  <MangaButton
                    disabled={samplePageIndex >= activeSample.samplePages.length - 1}
                    onClick={() =>
                      setSamplePageIndex((p) => Math.min(activeSample.samplePages.length - 1, p + 1))
                    }
                    className="px-3 py-1.5 text-xs font-bold border-2 border-[#222222] bg-[#171717] text-white disabled:opacity-40 cursor-pointer"
                  >
                    Next Page
                  </MangaButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
