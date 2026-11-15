import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy,
  Edit3,
  FolderOpen,
  Grid,
  List,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useStudioData } from '../../store/StudioDataContext';
import type { MangaGenre, MangaProject, ProjectStatus } from '../../types/manga';
import { MangaImage } from '../../components/manga/MangaDecorations';

const GENRES: ('All' | MangaGenre)[] = [
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

const STATUSES: ('All' | ProjectStatus)[] = [
  'All',
  'Draft',
  'In Production',
  'Ready to Export',
  'Published',
];

export default function ProjectsPage() {
  const { projects, isLoading, updateProject, duplicateProject, deleteProject } = useStudioData();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<'All' | MangaGenre>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | ProjectStatus>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const filtered = projects.filter((proj) => {
    const matchesQuery =
      !query.trim() ||
      proj.title.toLowerCase().includes(query.trim().toLowerCase()) ||
      proj.description.toLowerCase().includes(query.trim().toLowerCase());
    const matchesGenre = genreFilter === 'All' || proj.genre === genreFilter;
    const matchesStatus = statusFilter === 'All' || proj.status === statusFilter;
    return matchesQuery && matchesGenre && matchesStatus;
  });

  const handleRenameSubmit = async (proj: MangaProject) => {
    if (!renameText.trim()) {
      setRenamingId(null);
      return;
    }
    await updateProject({
      ...proj,
      title: renameText.trim(),
      updatedAt: new Date().toISOString(),
    });
    setRenamingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b-2 border-[#222222]">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-1">
            Project Library
          </p>
          <h1 className="font-display text-3xl font-extrabold text-[#171717]">My Manga Projects</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E63946] text-white text-xs font-bold border-2 border-[#222222] manga-panel-shadow-sm hover:bg-[#171717] transition-colors cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Manga</span>
        </button>
      </div>

      {/* Filters & View Mode Bar */}
      <div className="bg-white border-2 border-[#222222] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <label htmlFor="projects-filter-search" className="sr-only">
              Filter projects
            </label>
            <input
              id="projects-filter-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by title or premise..."
              className="w-full pl-9 pr-3 py-2 bg-[#FAF9F6] border-2 border-[#222222] text-sm focus:outline-none focus:border-[#E63946]"
            />
          </div>

          <label htmlFor="genre-select" className="sr-only">
            Filter by genre
          </label>
          <select
            id="genre-select"
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value as 'All' | MangaGenre)}
            className="px-3 py-2 bg-[#FAF9F6] border-2 border-[#222222] text-xs font-bold cursor-pointer"
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>
                Genre: {g}
              </option>
            ))}
          </select>

          <label htmlFor="status-select" className="sr-only">
            Filter by status
          </label>
          <select
            id="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | ProjectStatus)}
            className="px-3 py-2 bg-[#FAF9F6] border-2 border-[#222222] text-xs font-bold cursor-pointer"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>
        </div>

        <div className="inline-flex border-2 border-[#222222] self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            className={`p-2 cursor-pointer ${
              viewMode === 'grid' ? 'bg-[#171717] text-white' : 'bg-white text-[#171717]'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="List view"
            className={`p-2 cursor-pointer ${
              viewMode === 'list' ? 'bg-[#171717] text-white' : 'bg-white text-[#171717]'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading / Empty / Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="h-80 bg-[#EAE7E0] border-2 border-[#222222] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-[#222222] p-12 text-center manga-panel-shadow">
          <h2 className="font-display text-xl font-bold text-[#171717]">No matching manga projects</h2>
          <p className="text-sm text-[#525252] mt-1.5 mb-5">
            Adjust your filters or start a new chapter from scratch.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setGenreFilter('All');
              setStatusFilter('All');
            }}
            className="px-4 py-2 bg-[#171717] text-white text-xs font-bold border-2 border-[#222222] mr-3 cursor-pointer"
          >
            Reset Filters
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/create')}
            className="px-4 py-2 bg-[#E63946] text-white text-xs font-bold border-2 border-[#222222] cursor-pointer"
          >
            Create New Manga
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((proj) => (
            <article
              key={proj.id}
              className="bg-white border-2 border-[#222222] manga-panel-shadow flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[16/10] border-b-2 border-[#222222] overflow-hidden bg-[#F1EFEA]">
                  <MangaImage
                    src={proj.coverImageUrl}
                    alt={proj.title}
                    fallbackTitle={proj.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#737373]">
                    <span className="font-bold text-[#E63946]">{proj.genre}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{proj.chapters.length} ch</span>
                    <span aria-hidden="true">·</span>
                    <span>{proj.status}</span>
                  </div>

                  {renamingId === proj.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleRenameSubmit(proj);
                      }}
                      className="mt-2 flex gap-1.5"
                    >
                      <input
                        type="text"
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        aria-label="New project title"
                        className="flex-1 px-2 py-1 border-2 border-[#222222] text-sm font-bold"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-[#171717] text-white text-xs font-bold cursor-pointer"
                      >
                        Save
                      </button>
                    </form>
                  ) : (
                    <h2 className="font-display text-lg font-bold text-[#171717] mt-1.5">
                      {proj.title}
                    </h2>
                  )}

                  <p className="text-xs text-[#525252] mt-1.5 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>
                  <p className="font-mono text-[11px] text-[#737373] mt-3 tabular-nums">
                    Modified {new Date(proj.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-4 pt-3 border-t border-[#222222]/15 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/studio/${proj.id}`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#171717] text-white text-xs font-bold border border-[#222222] hover:bg-[#E63946] transition-colors cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Open Studio</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingId(proj.id);
                      setRenameText(proj.title);
                    }}
                    aria-label={`Rename ${proj.title}`}
                    className="p-2 border border-[#222222]/30 hover:border-[#222222] bg-[#FAF9F6] cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void duplicateProject(proj.id)}
                    aria-label={`Duplicate ${proj.title}`}
                    className="p-2 border border-[#222222]/30 hover:border-[#222222] bg-[#FAF9F6] cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteProject(proj.id)}
                    aria-label={`Delete ${proj.title}`}
                    className="p-2 border border-[#222222]/30 hover:border-[#E63946] hover:text-[#E63946] bg-[#FAF9F6] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-white border-2 border-[#222222] divide-y-2 divide-[#222222]/15">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF9F6]"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 shrink-0 border-2 border-[#222222] overflow-hidden">
                  <MangaImage
                    src={proj.coverImageUrl}
                    alt={proj.title}
                    fallbackTitle={proj.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-base font-bold text-[#171717] truncate">
                    {proj.title}
                  </h2>
                  <p className="text-xs text-[#737373] font-mono mt-0.5 tabular-nums">
                    {proj.genre} · {proj.chapters.length} chapters · {proj.pages.length} pages · {proj.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(`/studio/${proj.id}`)}
                  className="px-3.5 py-2 bg-[#171717] text-white text-xs font-bold border border-[#222222] hover:bg-[#E63946] cursor-pointer"
                >
                  Open Studio
                </button>
                <button
                  type="button"
                  onClick={() => void duplicateProject(proj.id)}
                  aria-label={`Duplicate ${proj.title}`}
                  className="p-2 border border-[#222222] bg-white cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void deleteProject(proj.id)}
                  aria-label={`Delete ${proj.title}`}
                  className="p-2 border border-[#222222] bg-white hover:text-[#E63946] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
