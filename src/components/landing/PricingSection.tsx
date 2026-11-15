import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Check } from 'lucide-react';
import { PRICING_TIERS } from '../../config/pricing';
import { useAuth } from '../../store/AuthContext';
import { ScrollRevealHeading } from '../manga/AnimatedTypography';
import { MangaButton } from '../manga/MangaButton';
import { MangaScreentoneWedge, MangaStarburstBadge } from '../manga/MangaDecorations';

gsap.registerPlugin(ScrollTrigger);

export function PricingSection() {
  const [annual, setAnnual] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.pricing-tier-card',
        { y: 26, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.1,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: '.pricing-tier-grid',
            start: 'top 86%',
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="relative z-20 py-20 sm:py-24 bg-[#F1EFEA] border-b-2 border-[#222222] overflow-x-clip"
    >
      <MangaScreentoneWedge
        corner="bottom-left"
        className="absolute bottom-0 left-0 w-44 sm:w-64 h-44 sm:h-64"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-14">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-3">
              Creator Plans · 料金プラン
            </p>
            <ScrollRevealHeading className="font-display text-2xl sm:text-4xl font-normal text-[#171717] leading-[1.15]">
              Transparent tiers built for indie debuts and serialized studios.
            </ScrollRevealHeading>
            <p className="text-xs text-[#737373] mt-2">
              Placeholder plan limits shown below until backend billing hooks are connected.
            </p>
          </div>

          <div className="inline-flex border-2 border-[#222222] bg-white p-1 self-start manga-panel-shadow-sm">
            <MangaButton
              sfxLabel="MO"
              onClick={() => setAnnual(false)}
              className={`px-3.5 py-1.5 text-xs font-bold cursor-pointer ${
                !annual ? 'bg-[#171717] text-white' : 'text-[#171717]'
              }`}
            >
              Monthly
            </MangaButton>
            <MangaButton
              sfxLabel="-20%"
              onClick={() => setAnnual(true)}
              className={`px-3.5 py-1.5 text-xs font-bold cursor-pointer ${
                annual ? 'bg-[#171717] text-white' : 'text-[#171717]'
              }`}
            >
              Annual (Save 20%)
            </MangaButton>
          </div>
        </div>

        <div className="pricing-tier-grid grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7 items-stretch">
          {PRICING_TIERS.map((tier) => (
            <article
              key={tier.id}
              className={`pricing-tier-card relative flex flex-col justify-between p-6 sm:p-7 border-2 border-[#222222] manga-card-interactive ${
                tier.highlighted
                  ? 'bg-white shadow-[6px_6px_0px_#E63946]'
                  : 'bg-[#FAF9F6] manga-panel-shadow'
              }`}
            >
              {tier.highlighted && (
                <MangaStarburstBadge
                  text="POP!"
                  bg="#FFB703"
                  className="hidden sm:inline-flex absolute -top-6 -right-4 w-13 h-13 z-10"
                />
              )}

              <div>
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#222222]/15">
                  <div>
                    <h3 className="font-editorial text-2xl font-extrabold text-[#171717]">
                      {tier.name}
                    </h3>
                    <p className="text-xs text-[#737373] mt-0.5">{tier.audienceLabel}</p>
                  </div>
                  {tier.highlighted && (
                    <span className="font-mono text-[11px] font-bold text-[#E63946] uppercase">
                      Most Popular
                    </span>
                  )}
                </div>

                <div className="my-6 flex items-baseline gap-1.5">
                  <span className="font-display text-3xl sm:text-4xl font-normal text-[#171717] tabular-nums">
                    {annual ? tier.annualPrice : tier.monthlyPrice}
                  </span>
                  <span className="text-xs text-[#737373]">/ month</span>
                </div>

                <p className="text-sm text-[#525252] leading-relaxed mb-6">{tier.description}</p>

                <ul className="space-y-3 border-t border-[#222222]/15 pt-5 mb-8">
                  {tier.features.map((feat) => (
                    <li key={feat.label} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-[#E63946] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[#171717]">{feat.label}: </span>
                        <span className="text-[#525252]">{feat.limit}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <MangaButton
                sfxLabel="GO!"
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
                className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold border-2 border-[#222222] cursor-pointer ${
                  tier.highlighted
                    ? 'bg-[#E63946] text-white hover:bg-[#171717] manga-panel-shadow-sm'
                    : 'bg-white text-[#171717] hover:bg-[#171717] hover:text-white manga-panel-shadow-sm'
                }`}
              >
                <span>{tier.ctaLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </MangaButton>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
