import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  Lock,
  MessageCircle,
  MousePointer2,
  Plus,
  Sparkles,
  Trash2,
  Type,
  Unlock,
  Upload,
  Users,
  Wand2,
} from 'lucide-react';
import { MANGA_ARTWORK } from '../../config/media';
import { STUDIO_TEMPLATES } from '../../services/mockData';
import type {
  AssetItem,
  BubbleStyle,
  CanvasElement,
  Character,
  EffectElement,
  StudioTemplate,
  StudioTool,
} from '../../types/manga';
import { MangaImage } from '../manga/MangaDecorations';

const TOOL_BUTTONS: {
  id: StudioTool;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'select', label: 'Select', shortLabel: 'Select', icon: MousePointer2 },
  { id: 'panels', label: 'Panels', shortLabel: 'Panels', icon: LayoutGrid },
  { id: 'images', label: 'Images', shortLabel: 'Images', icon: ImageIcon },
  { id: 'text', label: 'Text', shortLabel: 'Text', icon: Type },
  { id: 'bubbles', label: 'Speech Bubbles', shortLabel: 'Speech', icon: MessageCircle },
  { id: 'characters', label: 'Characters', shortLabel: 'Cast', icon: Users },
  { id: 'backgrounds', label: 'Backgrounds', shortLabel: 'Scenes', icon: Wand2 },
  { id: 'templates', label: 'Templates', shortLabel: 'Grids', icon: LayoutTemplate },
  { id: 'effects', label: 'Effects', shortLabel: 'Effects', icon: Sparkles },
  { id: 'layers', label: 'Layers', shortLabel: 'Layers', icon: Layers },
];

interface EditorLeftSidebarProps {
  activeTool: StudioTool;
  onSelectTool: (tool: StudioTool) => void;
  gutterSize: number;
  onGutterChange: (gutter: number) => void;
  onAddPanel: () => void;
  onApplyPreset: (presetKey: StudioTemplate['presetKey']) => void;
  onUploadAsset: (file: File) => Promise<AssetItem>;
  onAddImage: (imageUrl: string, title: string) => void;
  onAddText: (preset: 'heading' | 'sfx' | 'caption') => void;
  onAddBubble: (style: BubbleStyle) => void;
  onAddEffect: (kind: EffectElement['effectKind']) => void;
  onSetPageBackground: (bg: string) => void;
  elements: CanvasElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onReorderLayer: (id: string, dir: 'up' | 'down') => void;
  onDeleteElement: (id: string) => void;
  onRenameElement: (id: string, name: string) => void;
  characters: Character[];
  assets: AssetItem[];
}

export function EditorLeftSidebar({
  activeTool,
  onSelectTool,
  gutterSize,
  onGutterChange,
  onAddPanel,
  onApplyPreset,
  onUploadAsset,
  onAddImage,
  onAddText,
  onAddBubble,
  onAddEffect,
  onSetPageBackground,
  elements,
  selectedElementId,
  onSelectElement,
  onToggleVisibility,
  onToggleLock,
  onReorderLayer,
  onDeleteElement,
  onRenameElement,
  characters,
  assets,
}: EditorLeftSidebarProps) {
  const [renamingLayerId, setRenamingLayerId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const sortedLayers = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const asset = await onUploadAsset(file);
      onAddImage(asset.imageUrl, asset.title);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to upload artwork.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <aside className="flex shrink-0 border-r-2 border-[#222222] bg-white h-full overflow-hidden">
      {/* Tool Rail */}
      <div className="w-16 bg-[#F1EFEA] border-r-2 border-[#222222] py-2 flex flex-col items-center gap-1 overflow-y-auto studio-scroll">
        {TOOL_BUTTONS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool.id)}
              title={tool.label}
              aria-label={tool.label}
              aria-pressed={isActive}
              className={`w-12 py-2 flex flex-col items-center justify-center gap-1 border-2 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#171717] text-white border-[#222222]'
                  : 'bg-transparent text-[#171717] border-transparent hover:bg-white hover:border-[#222222]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-bold leading-none text-center">
                {tool.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tool Drawer */}
      <div className="w-60 sm:w-64 p-4 overflow-y-auto studio-scroll space-y-4 bg-white">
        <div className="pb-2 border-b border-[#222222]/15">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-[#171717]">
            {TOOL_BUTTONS.find((t) => t.id === activeTool)?.label}
          </h2>
        </div>

        {activeTool === 'select' && (
          <div className="space-y-3 text-xs text-[#525252]">
            <p className="leading-relaxed">
              Click any panel, speech bubble, or text element on the canvas to reposition, resize,
              or edit its properties on the right.
            </p>
            <div className="p-3 bg-[#FAF9F6] border border-[#222222]/30 space-y-1.5 font-mono text-[11px]">
              <p><strong className="text-[#171717]">Drag:</strong> Move selected element</p>
              <p><strong className="text-[#171717]">Double-Click:</strong> Edit dialogue text</p>
              <p><strong className="text-[#171717]">Corner Handle:</strong> Resize bounds</p>
              <p><strong className="text-[#171717]">Delete Key:</strong> Remove selected</p>
            </div>
          </div>
        )}

        {activeTool === 'panels' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={onAddPanel}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#E63946] text-white text-xs font-bold border-2 border-[#222222] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Panel</span>
            </button>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span>Page Gutter Spacing</span>
                <span className="font-mono tabular-nums">{gutterSize}px</span>
              </div>
              <input
                type="range"
                min={4}
                max={32}
                value={gutterSize}
                onChange={(e) => onGutterChange(Number(e.target.value))}
                aria-label="Page gutter spacing"
                className="w-full accent-[#E63946]"
              />
            </div>

            <div>
              <p className="text-xs font-bold text-[#171717] mb-2">Quick Panel Grids</p>
              <div className="space-y-2">
                {STUDIO_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onApplyPreset(tpl.presetKey)}
                    className="w-full text-left p-2.5 border-2 border-[#222222] bg-[#FAF9F6] hover:bg-[#171717] hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    {tpl.name} ({tpl.panelCount} panels)
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTool === 'images' && (
          <div className="space-y-3">
            <label className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-[#222222] bg-[#FAF9F6] hover:bg-[#171717] hover:text-white text-xs font-bold cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Uploading Artwork…' : 'Upload Artwork'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => void handleUploadImage(event)}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {uploadError && (
              <p role="alert" className="text-[11px] leading-4 text-[#B42318]">
                {uploadError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => onAddImage(asset.imageUrl, asset.title)}
                  className="border-2 border-[#222222] bg-[#FAF9F6] overflow-hidden text-left hover:border-[#E63946] cursor-pointer"
                >
                  <div className="h-20 overflow-hidden">
                    <MangaImage
                      src={asset.imageUrl}
                      alt={asset.title}
                      fallbackTitle={asset.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="block p-1.5 text-[10px] font-bold truncate">{asset.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTool === 'text' && (
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onAddText('heading')}
              className="w-full p-3 border-2 border-[#222222] bg-[#FAF9F6] hover:bg-[#171717] hover:text-white text-left cursor-pointer"
            >
              <span className="font-display font-extrabold text-base block">Chapter Heading</span>
              <span className="text-[11px] opacity-75">Bold editorial display title</span>
            </button>
            <button
              type="button"
              onClick={() => onAddText('sfx')}
              className="w-full p-3 border-2 border-[#222222] bg-[#FAF9F6] hover:bg-[#E63946] hover:text-white text-left cursor-pointer"
            >
              <span className="font-display font-extrabold text-lg italic block">DOOOM!! (SFX)</span>
              <span className="text-[11px] opacity-75">Kinetic sound-effect lettering</span>
            </button>
            <button
              type="button"
              onClick={() => onAddText('caption')}
              className="w-full p-3 border-2 border-[#222222] bg-[#FAF9F6] hover:bg-[#171717] hover:text-white text-left cursor-pointer"
            >
              <span className="font-mono text-xs font-semibold block">Scene Caption</span>
              <span className="text-[11px] opacity-75">Clean location or time note</span>
            </button>
          </div>
        )}

        {activeTool === 'bubbles' && (
          <div className="space-y-2">
            {(
              [
                { style: 'speech', label: 'Standard Speech Bubble', desc: 'Clean oval dialogue' },
                { style: 'shout', label: 'Shout / Action Burst', desc: 'High-impact jagged frame' },
                { style: 'thought', label: 'Thought Cloud', desc: 'Dashed internal monologue' },
                { style: 'narration', label: 'Narration Box', desc: 'Sharp editorial caption' },
                { style: 'whisper', label: 'Whisper Bubble', desc: 'Soft dotted voice cue' },
              ] as const
            ).map((b) => (
              <button
                key={b.style}
                type="button"
                onClick={() => onAddBubble(b.style)}
                className="w-full text-left p-2.5 border-2 border-[#222222] bg-[#FAF9F6] hover:bg-[#171717] hover:text-white transition-colors cursor-pointer"
              >
                <span className="block text-xs font-bold">{b.label}</span>
                <span className="block text-[11px] opacity-75">{b.desc}</span>
              </button>
            ))}
          </div>
        )}

        {activeTool === 'characters' && (
          <div className="space-y-2.5">
            {characters.map((char) => (
              <button
                key={char.id}
                type="button"
                onClick={() => onAddImage(char.referenceImageUrl, `${char.name} Ref`)}
                className="w-full flex items-center gap-2.5 p-2 border-2 border-[#222222] bg-[#FAF9F6] hover:bg-[#EAE7E0] text-left cursor-pointer"
              >
                <div className="w-10 h-10 shrink-0 border border-[#222222] overflow-hidden">
                  <MangaImage
                    src={char.referenceImageUrl}
                    alt={char.name}
                    fallbackTitle={char.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold truncate">{char.name}</span>
                  <span className="block text-[10px] font-mono text-[#E63946]">{char.role}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTool === 'backgrounds' && (
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-[#171717]">Page Paper Tone</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Pure White', hex: '#FFFFFF' },
                { label: 'Warm Paper', hex: '#FAF9F6' },
                { label: 'Noir Ink', hex: '#171717' },
              ].map((bg) => (
                <button
                  key={bg.hex}
                  type="button"
                  onClick={() => onSetPageBackground(bg.hex)}
                  className="p-2 border-2 border-[#222222] text-[10px] font-bold cursor-pointer"
                  style={{ backgroundColor: bg.hex, color: bg.hex === '#171717' ? '#FFF' : '#171717' }}
                >
                  {bg.label}
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-[#171717] pt-2">Scene Backdrops</p>
            {[
              { title: 'Tokyo Rain Alley', url: MANGA_ARTWORK.seinen },
              { title: 'Cloud Citadel', url: MANGA_ARTWORK.fantasy },
              { title: 'Orbital Ring', url: MANGA_ARTWORK.scifi },
            ].map((bg) => (
              <button
                key={bg.title}
                type="button"
                onClick={() => onAddImage(bg.url, bg.title)}
                className="w-full text-left p-2 border-2 border-[#222222] bg-[#FAF9F6] hover:bg-[#171717] hover:text-white text-xs font-bold cursor-pointer"
              >
                Insert {bg.title}
              </button>
            ))}
          </div>
        )}

        {activeTool === 'templates' && (
          <div className="space-y-2.5">
            {STUDIO_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onApplyPreset(tpl.presetKey)}
                className="w-full text-left p-3 border-2 border-[#222222] bg-[#FAF9F6] hover:bg-[#171717] hover:text-white transition-colors cursor-pointer"
              >
                <span className="block text-xs font-bold">{tpl.name}</span>
                <span className="block text-[11px] opacity-75 mt-0.5">{tpl.description}</span>
              </button>
            ))}
          </div>
        )}

        {activeTool === 'effects' && (
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onAddEffect('speed-lines')}
              className="w-full text-left p-3 border-2 border-[#222222] bg-[#FAF9F6] hover:bg-[#E63946] hover:text-white cursor-pointer"
            >
              <span className="block text-xs font-bold">Radial Speed Lines</span>
              <span className="block text-[11px] opacity-75">High-velocity focus burst</span>
            </button>
            <button
              type="button"
              onClick={() => onAddEffect('impact-burst')}
              className="w-full text-left p-3 border-2 border-[#222222] bg-[#FAF9F6] hover:bg-[#E63946] hover:text-white cursor-pointer"
            >
              <span className="block text-xs font-bold">Ink Impact Flash</span>
              <span className="block text-[11px] opacity-75">Dramatic clash emphasis</span>
            </button>
            <button
              type="button"
              onClick={() => onAddEffect('halftone-wash')}
              className="w-full text-left p-3 border-2 border-[#222222] bg-[#FAF9F6] hover:bg-[#171717] hover:text-white cursor-pointer"
            >
              <span className="block text-xs font-bold">Screentone Wash</span>
              <span className="block text-[11px] opacity-75">Ben-Day halftone shading block</span>
            </button>
          </div>
        )}

        {activeTool === 'layers' && (
          <div className="space-y-2">
            {sortedLayers.length === 0 ? (
              <p className="text-xs text-[#737373]">No layers on this page yet.</p>
            ) : (
              sortedLayers.map((el) => {
                const selected = el.id === selectedElementId;
                return (
                  <div
                    key={el.id}
                    className={`p-2 border-2 transition-colors ${
                      selected
                        ? 'border-[#E63946] bg-[#FAF9F6]'
                        : 'border-[#222222]/30 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      {renamingLayerId === el.id ? (
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => {
                            if (renameValue.trim()) onRenameElement(el.id, renameValue.trim());
                            setRenamingLayerId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (renameValue.trim()) onRenameElement(el.id, renameValue.trim());
                              setRenamingLayerId(null);
                            }
                          }}
                          autoFocus
                          className="flex-1 px-1.5 py-0.5 border border-[#222222] text-xs font-bold"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectElement(el.id)}
                          onDoubleClick={() => {
                            setRenamingLayerId(el.id);
                            setRenameValue(el.name);
                          }}
                          className="flex-1 text-left text-xs font-bold text-[#171717] truncate cursor-pointer"
                          title="Click to select, double-click to rename"
                        >
                          {el.name}
                        </button>
                      )}

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onReorderLayer(el.id, 'up')}
                          aria-label={`Move ${el.name} up`}
                          className="p-1 hover:bg-[#EAE7E0] cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onReorderLayer(el.id, 'down')}
                          aria-label={`Move ${el.name} down`}
                          className="p-1 hover:bg-[#EAE7E0] cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleVisibility(el.id)}
                          aria-label={el.visible ? `Hide ${el.name}` : `Show ${el.name}`}
                          className="p-1 hover:bg-[#EAE7E0] cursor-pointer"
                        >
                          {el.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-[#737373]" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleLock(el.id)}
                          aria-label={el.locked ? `Unlock ${el.name}` : `Lock ${el.name}`}
                          className="p-1 hover:bg-[#EAE7E0] cursor-pointer"
                        >
                          {el.locked ? <Lock className="w-3 h-3 text-[#E63946]" /> : <Unlock className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteElement(el.id)}
                          aria-label={`Delete ${el.name}`}
                          className="p-1 hover:text-[#E63946] cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
