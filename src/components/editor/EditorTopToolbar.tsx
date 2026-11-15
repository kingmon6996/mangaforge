import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Download,
  Eye,
  Hand,
  Loader2,
  Maximize2,
  Redo2,
  Save,
  Share2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface EditorTopToolbarProps {
  projectTitle: string;
  onTitleChange: (title: string) => void;
  readingDirection: 'rtl' | 'ltr';
  onToggleReadingDirection: () => void;
  saveStatus: 'saved' | 'unsaved' | 'saving';
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (next: number) => void;
  panMode: boolean;
  onTogglePanMode: () => void;
  onOpenPreview: () => void;
  onOpenExport: () => void;
  onOpenShare: () => void;
}

export function EditorTopToolbar({
  projectTitle,
  onTitleChange,
  readingDirection,
  onToggleReadingDirection,
  saveStatus,
  onSave,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  panMode,
  onTogglePanMode,
  onOpenPreview,
  onOpenExport,
  onOpenShare,
}: EditorTopToolbarProps) {
  const [editingTitle, setEditingTitle] = useState(false);

  return (
    <header className="h-14 bg-white border-b-2 border-[#222222] px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0 z-30">
      {/* Left: Back & Project Name & Save */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Link
          to="/dashboard/projects"
          aria-label="Back to Dashboard"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border-2 border-[#222222] bg-[#FAF9F6] hover:bg-[#171717] hover:text-white text-xs font-bold transition-colors shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Dashboard</span>
        </Link>

        {editingTitle ? (
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditingTitle(false);
            }}
            aria-label="Edit project title"
            autoFocus
            className="px-2 py-1 border-2 border-[#222222] text-sm font-display font-bold max-w-[200px]"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            title="Click to rename project"
            className="font-display text-sm sm:text-base font-bold text-[#171717] truncate max-w-[160px] sm:max-w-[230px] hover:text-[#E63946] cursor-pointer text-left"
          >
            {projectTitle}
          </button>
        )}

        <button
          type="button"
          onClick={onSave}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 border border-[#222222]/40 bg-[#FAF9F6] hover:border-[#222222] text-[11px] font-mono font-semibold cursor-pointer shrink-0"
        >
          {saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-[#E63946]" />
              <span>Saving</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <Check className="w-3 h-3 text-[#16A34A]" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3 h-3 text-[#E63946]" />
              <span>Save</span>
            </>
          )}
        </button>
      </div>

      {/* Center: Undo/Redo + Pan + Zoom */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="flex items-center border-2 border-[#222222] bg-[#FAF9F6]">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
            className="p-1.5 hover:bg-white disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed border-r border-[#222222]/25"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 hover:bg-white disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onTogglePanMode}
          aria-label="Toggle pan tool"
          aria-pressed={panMode}
          title="Pan Canvas"
          className={`p-1.5 border-2 border-[#222222] cursor-pointer ${
            panMode ? 'bg-[#171717] text-white' : 'bg-[#FAF9F6] text-[#171717]'
          }`}
        >
          <Hand className="w-3.5 h-3.5" />
        </button>

        <div className="hidden md:flex items-center border-2 border-[#222222] bg-[#FAF9F6]">
          <button
            type="button"
            onClick={() => onZoomChange(zoom - 15)}
            aria-label="Zoom out"
            className="p-1.5 hover:bg-white cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono text-xs font-bold tabular-nums min-w-[52px] text-center">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => onZoomChange(zoom + 15)}
            aria-label="Zoom in"
            className="p-1.5 hover:bg-white cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(70)}
            aria-label="Fit page to screen"
            title="Fit Page"
            className="p-1.5 border-l border-[#222222]/25 hover:bg-white cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleReadingDirection}
          title="Toggle Manga Reading Direction"
          className="hidden lg:inline-flex items-center px-2.5 py-1.5 border-2 border-[#222222] bg-[#FAF9F6] hover:bg-white font-mono text-xs font-bold cursor-pointer"
        >
          {readingDirection === 'rtl' ? 'RTL · JP' : 'LTR · EN'}
        </button>
      </div>

      {/* Right: Preview, Share, Export */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenPreview}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#222222] bg-white hover:bg-[#F1EFEA] text-xs font-bold cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Preview</span>
        </button>

        <button
          type="button"
          onClick={onOpenShare}
          aria-label="Share project"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#222222] bg-white hover:bg-[#F1EFEA] text-xs font-bold cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Share</span>
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-[#222222] bg-[#E63946] text-white hover:bg-[#171717] text-xs font-bold transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
}
