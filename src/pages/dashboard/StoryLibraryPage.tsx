import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';
import { useStudioData } from '../../store/StudioDataContext';
import type { MangaGenre } from '../../types/manga';

export default function StoryLibraryPage() {
  const { stories, addStory } = useStudioData();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState<MangaGenre>('Shonen');
  const [logline, setLogline] = useState('');
  const [scriptExcerpt, setScriptExcerpt] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !logline.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await addStory({
        id: `st-${Date.now()}`,
        title: title.trim(),
        genre,
        logline: logline.trim(),
        scriptExcerpt: scriptExcerpt.trim() || logline.trim(),
        sceneCount: 4,
        updatedAt: new Date().toISOString(),
      });
      setTitle('');
      setLogline('');
      setScriptExcerpt('');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save story.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b-2 border-[#222222]">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-1">
          Narrative Scripts
        </p>
        <h1 className="font-display text-3xl font-extrabold text-[#171717]">Story Library</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          {stories.map((story) => (
            <article key={story.id} className="bg-white border-2 border-[#222222] p-5 manga-panel-shadow-sm">
              <div className="flex items-center justify-between gap-2 text-xs font-mono text-[#737373] mb-1.5">
                <span className="font-bold text-[#E63946]">{story.genre}</span>
                <span className="tabular-nums">{story.sceneCount} scenes</span>
              </div>
              <h2 className="font-display text-lg font-bold text-[#171717]">{story.title}</h2>
              <p className="text-sm text-[#525252] mt-1">{story.logline}</p>
              <pre className="mt-3 p-3 bg-[#FAF9F6] border border-[#222222]/25 font-mono text-xs text-[#171717] whitespace-pre-wrap">
                {story.scriptExcerpt}
              </pre>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/create')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#171717] text-white text-xs font-bold border border-[#222222] hover:bg-[#E63946] cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Adapt into Manga</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        <form
          onSubmit={handleAdd}
          className="lg:col-span-5 bg-white border-2 border-[#222222] p-6 manga-panel-shadow space-y-4"
        >
          <h2 className="font-display text-lg font-bold text-[#171717]">Draft New Story Beat</h2>
          {saveError && (
            <p role="alert" className="text-sm font-semibold text-[#B42318]">
              {saveError}
            </p>
          )}
          <div>
            <label htmlFor="st-title" className="block text-xs font-bold uppercase mb-1">
              Story Title
            </label>
            <input
              id="st-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Belltower of Dusk"
              className="w-full px-3 py-2 border-2 border-[#222222] text-sm"
            />
          </div>
          <div>
            <label htmlFor="st-genre" className="block text-xs font-bold uppercase mb-1">
              Genre
            </label>
            <select
              id="st-genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value as MangaGenre)}
              className="w-full px-3 py-2 border-2 border-[#222222] text-sm bg-white"
            >
              {(['Shonen', 'Shojo', 'Seinen', 'Horror', 'Romance', 'Fantasy', 'Action', 'Sci-Fi'] as const).map(
                (g) => (
                  <option key={g} value={g}>{g}</option>
                )
              )}
            </select>
          </div>
          <div>
            <label htmlFor="st-logline" className="block text-xs font-bold uppercase mb-1">
              Logline
            </label>
            <input
              id="st-logline"
              type="text"
              required
              value={logline}
              onChange={(e) => setLogline(e.target.value)}
              placeholder="Core premise in one sentence..."
              className="w-full px-3 py-2 border-2 border-[#222222] text-sm"
            />
          </div>
          <div>
            <label htmlFor="st-script" className="block text-xs font-bold uppercase mb-1">
              Script Excerpt
            </label>
            <textarea
              id="st-script"
              rows={4}
              value={scriptExcerpt}
              onChange={(e) => setScriptExcerpt(e.target.value)}
              placeholder="SCENE 1 — EXT. ROOFTOP — NIGHT..."
              className="w-full px-3 py-2 border-2 border-[#222222] text-xs font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E63946] text-white text-xs font-bold border-2 border-[#222222] cursor-pointer disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            <span>{saving ? 'Saving Story…' : 'Save to Story Library'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
