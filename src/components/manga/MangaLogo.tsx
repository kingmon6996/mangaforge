import logoUrl from '../../public/logo.png';

interface MangaLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

export function MangaLogo({ className = '', size = 32, showWordmark = true }: MangaLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none whitespace-nowrap shrink-0 ${className}`}>
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        aria-hidden="true"
        className="shrink-0 object-contain"
      />
      {showWordmark && (
        <span className="font-display text-lg font-extrabold tracking-tight text-[#171717]">
          Manga<span className="text-[#E63946]">Forge</span>
        </span>
      )}
    </span>
  );
}
