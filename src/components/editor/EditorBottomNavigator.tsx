import { ArrowLeft, ArrowRight, Copy, Plus, Trash2 } from 'lucide-react';
import type { Chapter, MangaPage } from '../../types/manga';

interface EditorBottomNavigatorProps {
  chapters: Chapter[];
  activeChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  onAddChapter: () => void;
  pages: MangaPage[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDuplicatePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
}

export function EditorBottomNavigator({
  chapters,
  activeChapterId,
  onSelectChapter,
  onAddChapter,
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
}: EditorBottomNavigatorProps) {
  return (
    <footer className="h-24 bg-white border-t-2 border-[#222222] px-4 flex items-center gap-4 shrink-0 overflow-x-auto studio-scroll">
      {/* Chapters Switcher */}
      <div className="shrink-0 pr-4 border-r-2 border-[#222222]/20 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] font-bold uppercase text-[#737373]">Chapter</span>
          <button
            type="button"
            onClick={onAddChapter}
            title="Add Chapter"
            aria-label="Add chapter"
            className="p-0.5 border border-[#222222] hover:bg-[#171717] hover:text-white cursor-pointer"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <select
          value={activeChapterId}
          onChange={(e) => onSelectChapter(e.target.value)}
          aria-label="Active chapter"
          className="px-2.5 py-1.5 border-2 border-[#222222] bg-[#FAF9F6] text-xs font-bold max-w-[170px]"
        >
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              Ch.{String(ch.number).padStart(2, '0')} — {ch.title.replace(/^Chapter \d+:\s*/i, '')}
            </option>
          ))}
        </select>
      </div>

      {/* Pages Strip */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {pages.map((pg, idx) => {
          const isActive = pg.id === activePageId;
          return (
            <div
              key={pg.id}
              className={`shrink-0 flex items-center gap-1.5 border-2 px-2.5 py-2 transition-colors ${
                isActive
                  ? 'border-[#E63946] bg-[#FAF9F6] shadow-[2px_2px_0px_#222222]'
                  : 'border-[#222222]/40 bg-white hover:border-[#222222]'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectPage(pg.id)}
                className="text-left cursor-pointer pr-1"
              >
                <span className="block font-mono text-[11px] font-bold text-[#171717] tabular-nums">
                  P.{String(pg.pageNumber).padStart(2, '0')}
                </span>
                <span className="block text-[10px] text-[#737373] truncate max-w-[78px]">
                  {pg.elements.length} layers
                </span>
              </button>

              {isActive && (
                <div className="flex items-center gap-0.5 pl-1 border-l border-[#222222]/20">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onMovePage(idx, idx - 1)}
                    aria-label={`Move page ${pg.pageNumber} left`}
                    className="p-1 hover:bg-[#EAE7E0] disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === pages.length - 1}
                    onClick={() => onMovePage(idx, idx + 1)}
                    aria-label={`Move page ${pg.pageNumber} right`}
                    className="p-1 hover:bg-[#EAE7E0] disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicatePage(pg.id)}
                    aria-label={`Duplicate page ${pg.pageNumber}`}
                    className="p-1 hover:bg-[#EAE7E0] cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={pages.length <= 1}
                    onClick={() => onDeletePage(pg.id)}
                    aria-label={`Delete page ${pg.pageNumber}`}
                    className="p-1 hover:text-[#E63946] disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAddPage}
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 border-2 border-dashed border-[#222222] bg-[#FAF9F6] hover:bg-[#171717] hover:text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Page</span>
        </button>
      </div>
    </footer>
  );
}
