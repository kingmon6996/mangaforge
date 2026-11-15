import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { ShowcaseSection } from '../components/landing/ShowcaseSection';
import { DirectorSection } from '../components/landing/DirectorSection';
import { PricingSection } from '../components/landing/PricingSection';
import { FooterSection } from '../components/landing/FooterSection';
import { MangaChapterDivider } from '../components/manga/MangaDecorations';
import { setLenisInstance } from '../utils/smoothScroll';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    ScrollTrigger.config({ ignoreMobileResize: true });

    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
    });

    setLenisInstance(lenis);
    lenis.on('scroll', ScrollTrigger.update);

    const tickerCb = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCb);
    gsap.ticker.lagSmoothing(0);

    const handleRefresh = () => ScrollTrigger.refresh();
    const refreshTimer = setTimeout(handleRefresh, 280);
    window.addEventListener('load', handleRefresh);
    document.fonts?.ready.then(handleRefresh).catch(() => {});

    return () => {
      clearTimeout(refreshTimer);
      window.removeEventListener('load', handleRefresh);
      gsap.ticker.remove(tickerCb);
      setLenisInstance(null);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#171717] overflow-x-clip">
      <Navbar />
      <main>
        <HeroSection />
        <MangaChapterDivider pageNum="CHAPTER 01" label="PRODUCTION TOOLKIT · 作画ツール" />
        <FeaturesSection />
        <MangaChapterDivider pageNum="CHAPTER 02" label="WORKFLOW ARCHITECTURE · 制作工程" />
        <HowItWorksSection />
        <MangaChapterDivider pageNum="CHAPTER 03" label="GENRE SHOWCASE · 連載サンプル" />
        <ShowcaseSection />
        <MangaChapterDivider pageNum="CHAPTER 04" label="AI MANGA DIRECTOR · 演出エンジン" />
        <DirectorSection />
        <MangaChapterDivider pageNum="CHAPTER 05" label="CREATOR PLANS · 料金プラン" />
        <PricingSection />
      </main>
      <FooterSection />
    </div>
  );
}
