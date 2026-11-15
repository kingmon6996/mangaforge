import { useState } from 'react';
import { Search } from 'lucide-react';
import { useStudioData } from '../../store/StudioDataContext';
import type { AssetItem } from '../../types/manga';
import { MangaImage } from '../../components/manga/MangaDecorations';

const CATEGORIES: ('All' | AssetItem['category'])[] = [
  'All',
  'Illustration',
  'Background',
  'Character Reference',
  'Effect',
  'Uploaded',
];

export default function AssetsPage() {
  const { assets } = useStudioData();
  const [category, setCategory] = useState<'All' | AssetItem['category']>('All');
  const [query, setQuery] = useState('');

  const filtered = assets.filter((item) => {
    const matchCat = category === 'All' || item.category === category;
    const matchQ =
      !query.trim() ||
      item.title.toLowerCase().includes(query.trim().toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(query.trim().toLowerCase()));
    return matchCat && matchQ;
  });

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b-2 border-[#222222]">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-1">
          Studio Media Vault
        </p>
        <h1 className="font-display text-3xl font-extrabold text-[#171717]">Asset Library</h1>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold border-2 border-[#222222] cursor-pointer ${
                category === cat ? 'bg-[#171717] text-white' : 'bg-white text-[#171717]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <label htmlFor="assets-search" className="sr-only">Search assets</label>
          <input
            id="assets-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tags or titles..."
            className="w-full pl-9 pr-3 py-2 bg-white border-2 border-[#222222] text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-[#222222] p-10 text-center text-sm text-[#525252]">
          No matching assets in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((asset) => (
            <article key={asset.id} className="bg-white border-2 border-[#222222] manga-panel-shadow-sm">
              <div className="h-48 border-b-2 border-[#222222] overflow-hidden bg-[#F1EFEA]">
                <MangaImage
                  src={asset.imageUrl}
                  alt={asset.title}
                  fallbackTitle={asset.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="font-mono text-[11px] font-bold text-[#E63946]">{asset.category}</p>
                <h2 className="font-display text-base font-bold text-[#171717] mt-0.5">
                  {asset.title}
                </h2>
                <p className="text-xs text-[#737373] mt-1">{asset.tags.join(' · ')}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
