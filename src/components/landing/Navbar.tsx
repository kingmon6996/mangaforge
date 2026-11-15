import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { scrollToSection } from '../../utils/smoothScroll';
import { MangaButton } from '../manga/MangaButton';
import { MangaLogo } from '../manga/MangaLogo';

gsap.registerPlugin(ScrollTrigger);

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Studio', href: '#director' },
  { label: 'Showcase', href: '#showcase' },
  { label: 'Pricing', href: '#pricing' },
];

export function Navbar() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ctx: gsap.Context | undefined;

    if (!prefersReduced && progressRef.current) {
      ctx = gsap.context(() => {
        gsap.fromTo(
          progressRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: document.documentElement,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.25,
            },
          }
        );
      });
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      ctx?.revert();
    };
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    scrollToSection(href);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-[#FAF9F6]/95 backdrop-blur-sm border-b-2 border-[#222222] py-2.5 sm:py-3'
          : 'bg-[#FAF9F6]/85 lg:bg-transparent backdrop-blur-xs lg:backdrop-blur-none border-b border-transparent py-3 sm:py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand wordmark */}
        <Link
          to="/"
          aria-label="MangaForge Home"
          className="focus-visible:outline-2 focus-visible:outline-[#E63946] shrink-0"
        >
          <MangaLogo size={30} />
        </Link>

        {/* Zone 2: 5 concise single-line links */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Primary Navigation">
          {NAV_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.href);
              }}
              className="relative text-sm font-bold text-[#171717] hover:text-[#E63946] transition-colors whitespace-nowrap shrink-0 group py-1"
            >
              {item.label}
              <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-[#E63946] transition-all duration-200 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Zone 3: Actions */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {!isAuthenticated && (
            <Link
              to="/login"
              className="text-sm font-bold text-[#171717] hover:text-[#E63946] transition-colors whitespace-nowrap shrink-0 px-2 py-1"
            >
              Sign In
            </Link>
          )}
          <MangaButton
            sfxLabel="GO!"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
            className="group inline-flex items-center gap-2 px-5 py-2.5 bg-[#171717] text-white text-sm font-bold border-2 border-[#222222] manga-panel-shadow-sm hover:bg-[#E63946] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{isAuthenticated ? 'Dashboard' : 'Get Started'}</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" />
          </MangaButton>
        </div>

        {/* Mobile / Tablet menu toggle */}
        <MangaButton
          onClick={() => setMobileOpen((prev) => !prev)}
          className="lg:hidden p-2 border-2 border-[#222222] bg-white text-[#171717] manga-panel-shadow-sm cursor-pointer"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </MangaButton>
      </div>

      {/* Scroll-scrubbed Manga Chapter Reading Progress Bar */}
      <div
        ref={progressRef}
        aria-hidden="true"
        className="absolute left-0 right-0 bottom-0 h-[3px] bg-[#E63946] origin-left scale-x-0 pointer-events-none"
      />

      {/* Mobile & Tablet drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#FAF9F6] border-t-2 border-b-2 border-[#222222] px-5 py-5 space-y-4">
          <nav className="flex flex-col gap-2.5" aria-label="Mobile Navigation">
            {NAV_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.href);
                }}
                className="text-base font-bold text-[#171717] hover:text-[#E63946] py-1.5 border-b border-[#222222]/10"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="pt-2 flex items-center gap-3">
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 border-2 border-[#222222] bg-white text-sm font-bold text-[#171717] manga-panel-shadow-sm"
              >
                Sign In
              </Link>
            )}
            <MangaButton
              sfxLabel="GO!"
              onClick={() => {
                setMobileOpen(false);
                navigate(isAuthenticated ? '/dashboard' : '/signup');
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E63946] text-white text-sm font-bold border-2 border-[#222222] manga-panel-shadow-sm cursor-pointer"
            >
              <span>{isAuthenticated ? 'Dashboard' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4" />
            </MangaButton>
          </div>
        </div>
      )}
    </header>
  );
}
