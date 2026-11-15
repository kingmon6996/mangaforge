import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { IS_PREVIEW_MODE } from '../../config/api';
import { generationService } from '../../services/generationService';
import { useStudioData } from '../../store/StudioDataContext';
import type { ArtDirectionStyle, Character, CreateMangaPayload, MangaGenre } from '../../types/manga';

const GENRES: MangaGenre[] = [
  'Shonen',
  'Shojo',
  'Seinen',
  'Horror',
  'Romance',
  'Fantasy',
  'Action',
  'Sci-Fi',
];

const ART_STYLES: ArtDirectionStyle[] = [
  'Black-and-white manga',
  'Traditional screentone',
  'Modern manga',
  'Detailed ink illustration',
  'Anime-inspired',
  'Custom visual direction',
];

const STEPS = [
  'Project Information',
  'Art Direction',
  'Story Input',
  'Character Setup',
  'Generation Settings',
];

export default function CreateMangaPage() {
  const navigate = useNavigate();
  const { addProject, addCharacter, reloadAll } = useStudioData();

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const [form, setForm] = useState<CreateMangaPayload>({
    title: '',
    description: '',
    genre: 'Shonen',
    targetAudience: 'Young Adult (13–21)',
    language: 'English',
    artStyle: 'Traditional screentone',
    customVisualDirection: '',
    storyMode: 'idea',
    storyContent: '',
    characterName: '',
    characterRole: 'Protagonist',
    characterPersonality: '',
    characterHairstyle: '',
    characterFacialFeatures: '',
    characterClothing: '',
    characterBodyType: '',
    characterNotes: '',
    chaptersCount: 1,
    pagesPerChapter: 3,
    panelsPerPage: 4,
    dialogueGeneration: true,
    characterConsistency: true,
    compositionPreference: 'Dynamic dramatic cuts with balanced reading flow',
  });

  const updateField = <K extends keyof CreateMangaPayload>(key: K, val: CreateMangaPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setError(null);
  };

  const validateCurrentStep = (): boolean => {
    if (step === 0) {
      if (!form.title.trim()) {
        setError('Enter a manga project title before continuing.');
        return false;
      }
      if (!form.description.trim()) {
        setError('Provide a short description of your manga series.');
        return false;
      }
    }
    if (step === 1 && form.artStyle === 'Custom visual direction' && !form.customVisualDirection?.trim()) {
      setError('Describe your custom visual direction.');
      return false;
    }
    if (step === 2 && !form.storyContent.trim()) {
      setError('Enter a story idea, script, or scene description.');
      return false;
    }
    if (step === 3 && !form.characterName.trim()) {
      setError('Enter a primary character name.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setStep((s) => Math.min(STEPS.length, s + 1));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const { project, character } = await generationService.generateMangaProject(form);
      if (IS_PREVIEW_MODE) {
        await addCharacter(character);
        await addProject(project);
      } else {
        await reloadAll();
      }
      navigate(`/studio/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate manga project.');
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-5 border-b-2 border-[#222222]">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-1">
          Multi-Step Generation Pipeline
        </p>
        <h1 className="font-display text-3xl font-extrabold text-[#171717]">
          Create New Manga Project
        </h1>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {[...STEPS, 'Summary'].map((label, idx) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              if (idx < step) setStep(idx);
            }}
            disabled={idx > step}
            className={`p-2.5 border-2 text-left transition-colors ${
              step === idx
                ? 'bg-[#171717] text-white border-[#222222]'
                : idx < step
                  ? 'bg-white text-[#171717] border-[#222222] cursor-pointer'
                  : 'bg-[#F1EFEA] text-[#737373] border-[#222222]/30 cursor-not-allowed'
            }`}
          >
            <span className="block font-mono text-[10px] font-bold">0{idx + 1}</span>
            <span className="block text-xs font-bold truncate">{label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="border-2 border-[#E63946] bg-white p-3.5 flex items-center gap-2.5 text-sm font-semibold text-[#E63946]"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Panel */}
      <div className="bg-white border-2 border-[#222222] p-6 sm:p-8 manga-panel-shadow space-y-5">
        {step === 0 && (
          <>
            <h2 className="font-display text-xl font-bold text-[#171717]">
              Step 1 — Project Information
            </h2>
            <div>
              <label htmlFor="cm-title" className="block text-xs font-bold uppercase mb-1.5">
                Manga Title
              </label>
              <input
                id="cm-title"
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., Iron Lanterns of Kyoto"
                className="w-full px-3.5 py-2.5 border-2 border-[#222222] text-sm focus:outline-none focus:border-[#E63946]"
              />
            </div>
            <div>
              <label htmlFor="cm-desc" className="block text-xs font-bold uppercase mb-1.5">
                Series Logline / Description
              </label>
              <textarea
                id="cm-desc"
                rows={3}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe the central conflict and tone of your manga..."
                className="w-full px-3.5 py-2.5 border-2 border-[#222222] text-sm focus:outline-none focus:border-[#E63946]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="cm-genre" className="block text-xs font-bold uppercase mb-1.5">
                  Genre
                </label>
                <select
                  id="cm-genre"
                  value={form.genre}
                  onChange={(e) => updateField('genre', e.target.value as MangaGenre)}
                  className="w-full px-3 py-2.5 border-2 border-[#222222] text-sm bg-white"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="cm-audience" className="block text-xs font-bold uppercase mb-1.5">
                  Target Audience
                </label>
                <input
                  id="cm-audience"
                  type="text"
                  value={form.targetAudience}
                  onChange={(e) => updateField('targetAudience', e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-[#222222] text-sm"
                />
              </div>
              <div>
                <label htmlFor="cm-lang" className="block text-xs font-bold uppercase mb-1.5">
                  Manga Language
                </label>
                <select
                  id="cm-lang"
                  value={form.language}
                  onChange={(e) => updateField('language', e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-[#222222] text-sm bg-white"
                >
                  <option value="English">English</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Japanese / English">Bilingual (JP / EN)</option>
                </select>
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="font-display text-xl font-bold text-[#171717]">
              Step 2 — Art Direction
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ART_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateField('artStyle', style)}
                  className={`p-4 border-2 text-left transition-colors cursor-pointer ${
                    form.artStyle === style
                      ? 'border-[#222222] bg-[#FAF9F6] shadow-[3px_3px_0px_#E63946]'
                      : 'border-[#222222]/30 bg-white hover:border-[#222222]'
                  }`}
                >
                  <span className="font-display font-bold text-sm text-[#171717] block">
                    {style}
                  </span>
                </button>
              ))}
            </div>
            {form.artStyle === 'Custom visual direction' && (
              <div>
                <label htmlFor="cm-custom-art" className="block text-xs font-bold uppercase mb-1.5">
                  Custom Visual Direction Notes
                </label>
                <textarea
                  id="cm-custom-art"
                  rows={3}
                  value={form.customVisualDirection || ''}
                  onChange={(e) => updateField('customVisualDirection', e.target.value)}
                  placeholder="Describe ink line weight, screentone density, and lighting..."
                  className="w-full px-3.5 py-2.5 border-2 border-[#222222] text-sm"
                />
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-display text-xl font-bold text-[#171717]">
              Step 3 — Story Input
            </h2>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'idea', label: 'Story Idea' },
                  { id: 'script', label: 'Full Script' },
                  { id: 'chapter', label: 'Chapter Description' },
                  { id: 'scenes', label: 'Scene-by-Scene' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => updateField('storyMode', m.id)}
                  className={`px-3 py-1.5 text-xs font-bold border-2 border-[#222222] cursor-pointer ${
                    form.storyMode === m.id ? 'bg-[#171717] text-white' : 'bg-[#FAF9F6]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="cm-story" className="block text-xs font-bold uppercase mb-1.5">
                Narrative Content
              </label>
              <textarea
                id="cm-story"
                rows={6}
                value={form.storyContent}
                onChange={(e) => updateField('storyContent', e.target.value)}
                placeholder="Write your chapter beats, dialogue exchanges, or scene descriptions..."
                className="w-full px-3.5 py-2.5 border-2 border-[#222222] text-sm font-mono"
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-display text-xl font-bold text-[#171717]">
              Step 4 — Character Setup
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cm-char-name" className="block text-xs font-bold uppercase mb-1.5">
                  Character Name
                </label>
                <input
                  id="cm-char-name"
                  type="text"
                  value={form.characterName}
                  onChange={(e) => updateField('characterName', e.target.value)}
                  placeholder="e.g., Renji Kurogane"
                  className="w-full px-3 py-2.5 border-2 border-[#222222] text-sm"
                />
              </div>
              <div>
                <label htmlFor="cm-char-role" className="block text-xs font-bold uppercase mb-1.5">
                  Role
                </label>
                <select
                  id="cm-char-role"
                  value={form.characterRole}
                  onChange={(e) => updateField('characterRole', e.target.value as Character['role'])}
                  className="w-full px-3 py-2.5 border-2 border-[#222222] text-sm bg-white"
                >
                  <option value="Protagonist">Protagonist</option>
                  <option value="Deuteragonist">Deuteragonist</option>
                  <option value="Antagonist">Antagonist</option>
                  <option value="Supporting">Supporting</option>
                  <option value="Mentor">Mentor</option>
                </select>
              </div>
              <div>
                <label htmlFor="cm-char-hair" className="block text-xs font-bold uppercase mb-1.5">
                  Hairstyle
                </label>
                <input
                  id="cm-char-hair"
                  type="text"
                  value={form.characterHairstyle}
                  onChange={(e) => updateField('characterHairstyle', e.target.value)}
                  placeholder="Swept spiky black hair"
                  className="w-full px-3 py-2.5 border-2 border-[#222222] text-sm"
                />
              </div>
              <div>
                <label htmlFor="cm-char-face" className="block text-xs font-bold uppercase mb-1.5">
                  Facial Features
                </label>
                <input
                  id="cm-char-face"
                  type="text"
                  value={form.characterFacialFeatures}
                  onChange={(e) => updateField('characterFacialFeatures', e.target.value)}
                  placeholder="Sharp eyes, faint cheek scar"
                  className="w-full px-3 py-2.5 border-2 border-[#222222] text-sm"
                />
              </div>
              <div>
                <label htmlFor="cm-char-clothes" className="block text-xs font-bold uppercase mb-1.5">
                  Clothing
                </label>
                <input
                  id="cm-char-clothes"
                  type="text"
                  value={form.characterClothing}
                  onChange={(e) => updateField('characterClothing', e.target.value)}
                  placeholder="High-collar dark field jacket"
                  className="w-full px-3 py-2.5 border-2 border-[#222222] text-sm"
                />
              </div>
              <div>
                <label htmlFor="cm-char-body" className="block text-xs font-bold uppercase mb-1.5">
                  Body Type
                </label>
                <input
                  id="cm-char-body"
                  type="text"
                  value={form.characterBodyType}
                  onChange={(e) => updateField('characterBodyType', e.target.value)}
                  placeholder="Lean athletic build"
                  className="w-full px-3 py-2.5 border-2 border-[#222222] text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="cm-char-pers" className="block text-xs font-bold uppercase mb-1.5">
                Personality & Visual Notes
              </label>
              <textarea
                id="cm-char-pers"
                rows={2}
                value={form.characterPersonality}
                onChange={(e) => updateField('characterPersonality', e.target.value)}
                placeholder="Composed, relentless, keeps collar upturned outdoors..."
                className="w-full px-3 py-2.5 border-2 border-[#222222] text-sm"
              />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="font-display text-xl font-bold text-[#171717]">
              Step 5 — Generation Settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="cm-chapters" className="block text-xs font-bold uppercase mb-1.5">
                  Chapters
                </label>
                <input
                  id="cm-chapters"
                  type="number"
                  min={1}
                  max={10}
                  value={form.chaptersCount}
                  onChange={(e) => updateField('chaptersCount', Number(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 border-2 border-[#222222] text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="cm-pages" className="block text-xs font-bold uppercase mb-1.5">
                  Pages / Chapter
                </label>
                <input
                  id="cm-pages"
                  type="number"
                  min={1}
                  max={24}
                  value={form.pagesPerChapter}
                  onChange={(e) => updateField('pagesPerChapter', Number(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 border-2 border-[#222222] text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="cm-panels" className="block text-xs font-bold uppercase mb-1.5">
                  Panels / Page
                </label>
                <input
                  id="cm-panels"
                  type="number"
                  min={2}
                  max={8}
                  value={form.panelsPerPage}
                  onChange={(e) => updateField('panelsPerPage', Number(e.target.value) || 4)}
                  className="w-full px-3 py-2.5 border-2 border-[#222222] text-sm font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.dialogueGeneration}
                  onChange={(e) => updateField('dialogueGeneration', e.target.checked)}
                  className="w-4 h-4 accent-[#E63946]"
                />
                <span>Auto-place speech bubbles and dialogue lettering</span>
              </label>
              <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.characterConsistency}
                  onChange={(e) => updateField('characterConsistency', e.target.checked)}
                  className="w-4 h-4 accent-[#E63946]"
                />
                <span>Enforce character turnaround consistency seed</span>
              </label>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="font-display text-xl font-bold text-[#171717]">
              Generation Summary
            </h2>
            <div className="bg-[#FAF9F6] border-2 border-[#222222] p-5 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-[#737373] block">Title</span>
                  <span className="font-bold text-[#171717]">{form.title}</span>
                </div>
                <div>
                  <span className="text-xs text-[#737373] block">Genre & Style</span>
                  <span className="font-bold text-[#171717]">{form.genre} · {form.artStyle}</span>
                </div>
                <div>
                  <span className="text-xs text-[#737373] block">Lead Character</span>
                  <span className="font-bold text-[#171717]">{form.characterName} ({form.characterRole})</span>
                </div>
                <div>
                  <span className="text-xs text-[#737373] block">Scope</span>
                  <span className="font-mono font-bold text-[#171717] tabular-nums">
                    {form.chaptersCount} ch · {form.pagesPerChapter} pages · {form.panelsPerPage} panels/pg
                  </span>
                </div>
              </div>
              <div className="pt-3 border-t border-[#222222]/15">
                <span className="text-xs text-[#737373] block mb-1">Story Input ({form.storyMode})</span>
                <p className="text-xs text-[#171717] font-mono whitespace-pre-wrap line-clamp-4">
                  {form.storyContent}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Footer Controls */}
        <div className="pt-4 border-t border-[#222222]/15 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={step === 0 || generating}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 border-2 border-[#222222] bg-white text-xs font-bold disabled:opacity-40 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {step < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#171717] text-white text-xs font-bold border-2 border-[#222222] hover:bg-[#E63946] transition-colors cursor-pointer"
            >
              <span>{step === STEPS.length - 1 ? 'Review Summary' : 'Next Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={generating}
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#E63946] text-white text-sm font-bold border-2 border-[#222222] manga-panel-shadow-sm hover:bg-[#171717] transition-colors disabled:opacity-60 cursor-pointer"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Directing Manga Pages...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate & Open in Studio</span>
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
