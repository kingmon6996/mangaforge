import React, { useState } from 'react';
import { Edit3, Plus, Trash2, UserCheck, X } from 'lucide-react';
import { MANGA_ARTWORK } from '../../config/media';
import { useStudioData } from '../../store/StudioDataContext';
import type { Character } from '../../types/manga';
import { MangaImage } from '../../components/manga/MangaDecorations';

export default function CharactersPage() {
  const { characters, projects, addCharacter, updateCharacter, deleteCharacter } = useStudioData();
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState<Character['role']>('Protagonist');
  const [personality, setPersonality] = useState('');
  const [hairstyle, setHairstyle] = useState('');
  const [facialFeatures, setFacialFeatures] = useState('');
  const [clothing, setClothing] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [consistencyNotes, setConsistencyNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setRole('Protagonist');
    setPersonality('');
    setHairstyle('');
    setFacialFeatures('');
    setClothing('');
    setBodyType('');
    setConsistencyNotes('');
    setFormError(null);
    setEditorOpen(true);
  };

  const openEditModal = (char: Character) => {
    setEditingId(char.id);
    setName(char.name);
    setRole(char.role);
    setPersonality(char.personality);
    setHairstyle(char.hairstyle);
    setFacialFeatures(char.facialFeatures);
    setClothing(char.clothing);
    setBodyType(char.bodyType);
    setConsistencyNotes(char.consistencyNotes);
    setFormError(null);
    setEditorOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Character name is required.');
      return;
    }

    const now = new Date().toISOString();
    if (editingId) {
      const existing = characters.find((c) => c.id === editingId);
      if (existing) {
        const updated: Character = {
          ...existing,
          name: name.trim(),
          role,
          personality: personality.trim() || existing.personality,
          hairstyle: hairstyle.trim() || existing.hairstyle,
          facialFeatures: facialFeatures.trim() || existing.facialFeatures,
          clothing: clothing.trim() || existing.clothing,
          bodyType: bodyType.trim() || existing.bodyType,
          appearanceSummary: `${hairstyle || existing.hairstyle}, ${clothing || existing.clothing}`,
          consistencyNotes: consistencyNotes.trim() || existing.consistencyNotes,
          updatedAt: now,
        };
        await updateCharacter(updated);
        if (selectedChar?.id === updated.id) setSelectedChar(updated);
      }
    } else {
      const created: Character = {
        id: `char-${Date.now()}`,
        name: name.trim(),
        role,
        personality: personality.trim() || 'Driven, observant, calm under pressure.',
        hairstyle: hairstyle.trim() || 'Textured dark silhouette',
        facialFeatures: facialFeatures.trim() || 'Expressive sharp eyes',
        clothing: clothing.trim() || 'Tailored high-collar studio coat',
        bodyType: bodyType.trim() || 'Balanced athletic posture',
        appearanceSummary: `${hairstyle.trim() || 'Textured dark hair'}, ${clothing.trim() || 'Tailored coat'}`,
        consistencyNotes: consistencyNotes.trim() || 'Keep silhouette proportions consistent.',
        referenceImageUrl: MANGA_ARTWORK.characterTurnaround,
        expressions: [
          { id: `exp-${Date.now()}-1`, label: 'Neutral', notes: 'Baseline turnaround look' },
          { id: `exp-${Date.now()}-2`, label: 'Battle Focus', notes: 'High contrast ink shading' },
        ],
        associatedProjectIds: [],
        updatedAt: now,
      };
      await addCharacter(created);
      setSelectedChar(created);
    }
    setEditorOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b-2 border-[#222222]">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-1">
            Cast & Continuity
          </p>
          <h1 className="font-display text-3xl font-extrabold text-[#171717]">
            Character Reference Library
          </h1>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E63946] text-white text-xs font-bold border-2 border-[#222222] manga-panel-shadow-sm hover:bg-[#171717] transition-colors cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Character Sheet</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Character Cards Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {characters.map((char) => {
            const isSelected = selectedChar?.id === char.id;
            const linkedTitles = projects
              .filter((p) => char.associatedProjectIds.includes(p.id))
              .map((p) => p.title);

            return (
              <article
                key={char.id}
                className={`bg-white border-2 border-[#222222] flex flex-col justify-between transition-all ${
                  isSelected ? 'shadow-[4px_4px_0px_#E63946]' : 'manga-panel-shadow-sm'
                }`}
              >
                <div>
                  <div className="aspect-[16/10] border-b-2 border-[#222222] overflow-hidden bg-[#F1EFEA]">
                    <MangaImage
                      src={char.referenceImageUrl}
                      alt={char.name}
                      fallbackTitle={char.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 text-xs font-mono text-[#E63946] font-bold">
                      <span>{char.role}</span>
                      <span className="text-[#737373] tabular-nums">
                        {char.expressions.length} expressions
                      </span>
                    </div>
                    <h2 className="font-display text-lg font-bold text-[#171717] mt-1">
                      {char.name}
                    </h2>
                    <p className="text-xs text-[#525252] mt-1 line-clamp-2">
                      {char.appearanceSummary}
                    </p>
                    {linkedTitles.length > 0 && (
                      <p className="text-[11px] font-mono text-[#737373] mt-2 truncate">
                        Projects: {linkedTitles.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4 pt-2 border-t border-[#222222]/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedChar(char)}
                    className="px-3 py-1.5 bg-[#171717] text-white text-xs font-bold border border-[#222222] hover:bg-[#E63946] cursor-pointer"
                  >
                    Inspect Sheet
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(char)}
                      aria-label={`Edit ${char.name}`}
                      className="p-1.5 border border-[#222222]/30 hover:border-[#222222] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void deleteCharacter(char.id);
                        if (selectedChar?.id === char.id) setSelectedChar(null);
                      }}
                      aria-label={`Delete ${char.name}`}
                      className="p-1.5 border border-[#222222]/30 hover:text-[#E63946] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Character Detail Sheet */}
        <div className="lg:col-span-5 bg-white border-2 border-[#222222] p-6 manga-panel-shadow sticky top-24">
          {selectedChar ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b-2 border-[#222222]">
                <div>
                  <span className="font-mono text-xs font-bold text-[#E63946]">
                    {selectedChar.role}
                  </span>
                  <h2 className="font-display text-2xl font-extrabold text-[#171717]">
                    {selectedChar.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => openEditModal(selectedChar)}
                  className="px-3 py-1.5 border-2 border-[#222222] text-xs font-bold hover:bg-[#F1EFEA] cursor-pointer"
                >
                  Edit Profile
                </button>
              </div>

              <div className="aspect-[16/10] border-2 border-[#222222] overflow-hidden bg-[#FAF9F6]">
                <MangaImage
                  src={selectedChar.referenceImageUrl}
                  alt={selectedChar.name}
                  fallbackTitle={selectedChar.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#FAF9F6] border border-[#222222]/25">
                  <span className="font-bold text-[#737373] block mb-0.5">Hairstyle</span>
                  <span className="text-[#171717] font-medium">{selectedChar.hairstyle}</span>
                </div>
                <div className="p-3 bg-[#FAF9F6] border border-[#222222]/25">
                  <span className="font-bold text-[#737373] block mb-0.5">Facial Features</span>
                  <span className="text-[#171717] font-medium">{selectedChar.facialFeatures}</span>
                </div>
                <div className="p-3 bg-[#FAF9F6] border border-[#222222]/25">
                  <span className="font-bold text-[#737373] block mb-0.5">Outfit</span>
                  <span className="text-[#171717] font-medium">{selectedChar.clothing}</span>
                </div>
                <div className="p-3 bg-[#FAF9F6] border border-[#222222]/25">
                  <span className="font-bold text-[#737373] block mb-0.5">Body Type</span>
                  <span className="text-[#171717] font-medium">{selectedChar.bodyType}</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-[#171717] mb-2">
                  Expression Presets
                </h3>
                <div className="space-y-2">
                  {selectedChar.expressions.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-2.5 border border-[#222222]/30 bg-[#FAF9F6] flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-bold text-[#171717]">{exp.label}</span>
                      <span className="text-[#525252]">{exp.notes}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#F1EFEA] border-2 border-[#222222] text-xs">
                <span className="font-bold text-[#E63946] block mb-1">
                  Visual Consistency Notes
                </span>
                <p className="text-[#171717] leading-relaxed">{selectedChar.consistencyNotes}</p>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-2">
              <UserCheck className="w-8 h-8 text-[#737373] mx-auto" />
              <h2 className="font-display text-lg font-bold text-[#171717]">
                Select a Character Sheet
              </h2>
              <p className="text-xs text-[#525252] max-w-xs mx-auto">
                Click "Inspect Sheet" on any character card to review turnaround specs, expressions,
                and visual consistency notes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Character Modal */}
      {editorOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={editingId ? 'Edit Character' : 'Create Character'}
        >
          <form
            onSubmit={handleSave}
            className="bg-[#FAF9F6] border-2 border-[#222222] max-w-xl w-full p-6 manga-panel-shadow space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#222222]">
              <h2 className="font-display text-xl font-bold text-[#171717]">
                {editingId ? 'Edit Character Sheet' : 'Create Character Sheet'}
              </h2>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                aria-label="Close modal"
                className="p-1.5 border border-[#222222] bg-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <p className="text-xs font-bold text-[#E63946]">{formError}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="ch-name" className="block text-xs font-bold uppercase mb-1">Name</label>
                <input
                  id="ch-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-[#222222] text-sm"
                />
              </div>
              <div>
                <label htmlFor="ch-role" className="block text-xs font-bold uppercase mb-1">Role</label>
                <select
                  id="ch-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Character['role'])}
                  className="w-full px-3 py-2 bg-white border-2 border-[#222222] text-sm"
                >
                  <option value="Protagonist">Protagonist</option>
                  <option value="Deuteragonist">Deuteragonist</option>
                  <option value="Antagonist">Antagonist</option>
                  <option value="Supporting">Supporting</option>
                  <option value="Mentor">Mentor</option>
                </select>
              </div>
              <div>
                <label htmlFor="ch-hair" className="block text-xs font-bold uppercase mb-1">Hairstyle</label>
                <input
                  id="ch-hair"
                  type="text"
                  value={hairstyle}
                  onChange={(e) => setHairstyle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-[#222222] text-sm"
                />
              </div>
              <div>
                <label htmlFor="ch-face" className="block text-xs font-bold uppercase mb-1">Facial Features</label>
                <input
                  id="ch-face"
                  type="text"
                  value={facialFeatures}
                  onChange={(e) => setFacialFeatures(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-[#222222] text-sm"
                />
              </div>
              <div>
                <label htmlFor="ch-cloth" className="block text-xs font-bold uppercase mb-1">Clothing</label>
                <input
                  id="ch-cloth"
                  type="text"
                  value={clothing}
                  onChange={(e) => setClothing(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-[#222222] text-sm"
                />
              </div>
              <div>
                <label htmlFor="ch-body" className="block text-xs font-bold uppercase mb-1">Body Type</label>
                <input
                  id="ch-body"
                  type="text"
                  value={bodyType}
                  onChange={(e) => setBodyType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-[#222222] text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ch-pers" className="block text-xs font-bold uppercase mb-1">Personality</label>
              <input
                id="ch-pers"
                type="text"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-[#222222] text-sm"
              />
            </div>

            <div>
              <label htmlFor="ch-notes" className="block text-xs font-bold uppercase mb-1">Visual Consistency Notes</label>
              <textarea
                id="ch-notes"
                rows={2}
                value={consistencyNotes}
                onChange={(e) => setConsistencyNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-[#222222] text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="px-4 py-2 border-2 border-[#222222] bg-white text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#E63946] text-white border-2 border-[#222222] text-xs font-bold cursor-pointer"
              >
                Save Character
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
