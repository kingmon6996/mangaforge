import { useState } from 'react';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';
import { MANGA_ARTWORK } from '../../config/media';
import type {
  AiActionRequest,
  BubbleStyle,
  CameraAngle,
  CanvasElement,
  PanelBorderStyle,
  PanelCornerShape,
  PanelElement,
  TailDirection,
} from '../../types/manga';

interface EditorRightPropertiesProps {
  selectedElement: CanvasElement | null;
  onUpdateElement: (id: string, patch: Partial<CanvasElement>, recordHistory?: boolean) => void;
  onDeleteElement: (id: string) => void;
  onTriggerAiAction: (action: AiActionRequest['action'], cameraAngle?: CameraAngle) => Promise<void>;
  aiLoadingAction: string | null;
  aiMessage: string | null;
}

const CAMERA_ANGLE_OPTIONS: CameraAngle[] = [
  'Wide cinematic shot',
  'Extreme close-up',
  'Low-angle perspective',
  'Dynamic action perspective',
  'Emotional character close-up',
];

const ART_REPLACEMENT_OPTIONS = [
  { label: 'Katana Wind Stance', url: MANGA_ARTWORK.heroPage },
  { label: 'Shonen Impact Leap', url: MANGA_ARTWORK.shonen },
  { label: 'Tokyo Rain Alley', url: MANGA_ARTWORK.seinen },
  { label: 'Floating Citadel', url: MANGA_ARTWORK.fantasy },
  { label: 'Orbital Cockpit', url: MANGA_ARTWORK.scifi },
  { label: 'Character Turnaround', url: MANGA_ARTWORK.characterTurnaround },
];

export function EditorRightProperties({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onTriggerAiAction,
  aiLoadingAction,
  aiMessage,
}: EditorRightPropertiesProps) {
  const [selectedAngle, setSelectedAngle] = useState<CameraAngle>('Dynamic action perspective');

  if (!selectedElement) {
    return (
      <aside className="w-72 shrink-0 border-l-2 border-[#222222] bg-white p-5 overflow-y-auto studio-scroll">
        <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-[#171717] pb-2 border-b border-[#222222]/15">
          Properties
        </h2>
        <p className="text-xs text-[#737373] mt-4 leading-relaxed">
          Select any panel, speech bubble, image, or text layer on the canvas to adjust layout
          properties and run AI Director actions.
        </p>
      </aside>
    );
  }

  return (
    <aside className="w-72 sm:w-80 shrink-0 border-l-2 border-[#222222] bg-white p-4 overflow-y-auto studio-scroll space-y-5">
      <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-[#222222]">
        <div className="min-w-0">
          <span className="font-mono text-[10px] font-bold uppercase text-[#E63946] block">
            {selectedElement.type}
          </span>
          <h2 className="font-display text-sm font-extrabold text-[#171717] truncate">
            {selectedElement.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onDeleteElement(selectedElement.id)}
          aria-label="Delete selected element"
          className="p-1.5 border border-[#222222] hover:bg-[#E63946] hover:text-white transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Transform & Opacity */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-bold uppercase text-[#737373]">Transform</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className="block">
            <span className="text-[10px] font-mono text-[#737373]">X</span>
            <input
              type="number"
              value={selectedElement.x}
              onChange={(e) => onUpdateElement(selectedElement.id, { x: Number(e.target.value) })}
              className="w-full px-2 py-1 border border-[#222222] font-mono tabular-nums"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-mono text-[#737373]">Y</span>
            <input
              type="number"
              value={selectedElement.y}
              onChange={(e) => onUpdateElement(selectedElement.id, { y: Number(e.target.value) })}
              className="w-full px-2 py-1 border border-[#222222] font-mono tabular-nums"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-mono text-[#737373]">Width</span>
            <input
              type="number"
              min={48}
              value={selectedElement.width}
              onChange={(e) => onUpdateElement(selectedElement.id, { width: Math.max(48, Number(e.target.value)) })}
              className="w-full px-2 py-1 border border-[#222222] font-mono tabular-nums"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-mono text-[#737373]">Height</span>
            <input
              type="number"
              min={48}
              value={selectedElement.height}
              onChange={(e) => onUpdateElement(selectedElement.id, { height: Math.max(48, Number(e.target.value)) })}
              className="w-full px-2 py-1 border border-[#222222] font-mono tabular-nums"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className="block">
            <span className="text-[10px] font-mono text-[#737373]">Rotation ({selectedElement.rotation}°)</span>
            <input
              type="range"
              min={-45}
              max={45}
              value={selectedElement.rotation}
              onChange={(e) => onUpdateElement(selectedElement.id, { rotation: Number(e.target.value) })}
              className="w-full accent-[#E63946]"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-mono text-[#737373]">Opacity ({selectedElement.opacity}%)</span>
            <input
              type="range"
              min={10}
              max={100}
              value={selectedElement.opacity}
              onChange={(e) => onUpdateElement(selectedElement.id, { opacity: Number(e.target.value) })}
              className="w-full accent-[#E63946]"
            />
          </label>
        </div>
      </div>

      {/* PANEL PROPERTIES */}
      {selectedElement.type === 'panel' && (
        <div className="space-y-3 pt-3 border-t border-[#222222]/15 text-xs">
          <p className="text-[11px] font-bold uppercase text-[#737373]">Panel & Artwork</p>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[10px] font-bold">Border (px)</span>
              <input
                type="number"
                min={0}
                max={12}
                value={selectedElement.borderWidth}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { borderWidth: Number(e.target.value) })
                }
                className="w-full px-2 py-1 border border-[#222222] font-mono"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold">Border Style</span>
              <select
                value={selectedElement.borderStyle}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    borderStyle: e.target.value as PanelBorderStyle,
                  })
                }
                className="w-full px-2 py-1 border border-[#222222] bg-white"
              >
                <option value="solid">Solid</option>
                <option value="double">Double</option>
                <option value="dashed">Dashed</option>
                <option value="none">None</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[10px] font-bold">Corner Shape</span>
              <select
                value={selectedElement.cornerShape}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    cornerShape: e.target.value as PanelCornerShape,
                  })
                }
                className="w-full px-2 py-1 border border-[#222222] bg-white"
              >
                <option value="sharp">Sharp</option>
                <option value="beveled">Beveled</option>
                <option value="subtle-round">Soft</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-bold">Screentone</span>
              <select
                value={selectedElement.screentone}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    screentone: e.target.value as PanelElement['screentone'],
                  })
                }
                className="w-full px-2 py-1 border border-[#222222] bg-white"
              >
                <option value="none">None</option>
                <option value="light">Light Halftone</option>
                <option value="dense">Dense Halftone</option>
                <option value="speedlines">Speed Lines</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-[10px] font-bold">Replace Panel Image</span>
            <select
              value={selectedElement.imageUrl || ''}
              onChange={(e) =>
                onUpdateElement(selectedElement.id, { imageUrl: e.target.value || undefined })
              }
              className="w-full px-2 py-1.5 border border-[#222222] bg-white mt-0.5"
            >
              <option value="">Empty Panel</option>
              {ART_REPLACEMENT_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.url}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[10px] font-mono">Brightness ({selectedElement.imageBrightness}%)</span>
              <input
                type="range"
                min={50}
                max={150}
                value={selectedElement.imageBrightness}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { imageBrightness: Number(e.target.value) })
                }
                className="w-full accent-[#E63946]"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-mono">Contrast ({selectedElement.imageContrast}%)</span>
              <input
                type="range"
                min={60}
                max={160}
                value={selectedElement.imageContrast}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { imageContrast: Number(e.target.value) })
                }
                className="w-full accent-[#E63946]"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() =>
              onUpdateElement(selectedElement.id, { imageFlipX: !selectedElement.imageFlipX })
            }
            className="w-full py-1.5 border border-[#222222] bg-[#FAF9F6] hover:bg-[#171717] hover:text-white font-bold cursor-pointer"
          >
            Flip Artwork Horizontal
          </button>
        </div>
      )}

      {/* SPEECH BUBBLE PROPERTIES */}
      {selectedElement.type === 'bubble' && (
        <div className="space-y-3 pt-3 border-t border-[#222222]/15 text-xs">
          <p className="text-[11px] font-bold uppercase text-[#737373]">Speech Bubble</p>
          <label className="block">
            <span className="text-[10px] font-bold">Dialogue Text</span>
            <textarea
              rows={3}
              value={selectedElement.text}
              onChange={(e) => onUpdateElement(selectedElement.id, { text: e.target.value })}
              className="w-full p-2 border border-[#222222] mt-0.5"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[10px] font-bold">Bubble Style</span>
              <select
                value={selectedElement.bubbleStyle}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { bubbleStyle: e.target.value as BubbleStyle })
                }
                className="w-full px-2 py-1 border border-[#222222] bg-white"
              >
                <option value="speech">Speech</option>
                <option value="shout">Shout</option>
                <option value="thought">Thought</option>
                <option value="narration">Narration</option>
                <option value="whisper">Whisper</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-bold">Tail Direction</span>
              <select
                value={selectedElement.tailDirection}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    tailDirection: e.target.value as TailDirection,
                  })
                }
                className="w-full px-2 py-1 border border-[#222222] bg-white"
              >
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="none">No Tail</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[10px] font-bold">Font Size</span>
              <input
                type="number"
                min={9}
                max={32}
                value={selectedElement.fontSize}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { fontSize: Number(e.target.value) })
                }
                className="w-full px-2 py-1 border border-[#222222] font-mono"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold">Align</span>
              <select
                value={selectedElement.textAlign}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    textAlign: e.target.value as 'left' | 'center' | 'right',
                  })
                }
                className="w-full px-2 py-1 border border-[#222222] bg-white"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {/* TEXT PROPERTIES */}
      {selectedElement.type === 'text' && (
        <div className="space-y-3 pt-3 border-t border-[#222222]/15 text-xs">
          <p className="text-[11px] font-bold uppercase text-[#737373]">Typography & SFX</p>
          <label className="block">
            <span className="text-[10px] font-bold">Text</span>
            <input
              type="text"
              value={selectedElement.text}
              onChange={(e) => onUpdateElement(selectedElement.id, { text: e.target.value })}
              className="w-full px-2 py-1.5 border border-[#222222]"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[10px] font-bold">Font</span>
              <select
                value={selectedElement.fontFamily}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    fontFamily: e.target.value as 'Outfit' | 'Plus Jakarta Sans' | 'JetBrains Mono',
                  })
                }
                className="w-full px-2 py-1 border border-[#222222] bg-white"
              >
                <option value="Outfit">Outfit Display</option>
                <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                <option value="JetBrains Mono">JetBrains Mono</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-bold">Size</span>
              <input
                type="number"
                min={10}
                max={72}
                value={selectedElement.fontSize}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { fontSize: Number(e.target.value) })
                }
                className="w-full px-2 py-1 border border-[#222222] font-mono"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold">Color</span>
              <input
                type="color"
                value={selectedElement.color}
                onChange={(e) => onUpdateElement(selectedElement.id, { color: e.target.value })}
                className="w-full h-8 border border-[#222222] bg-white cursor-pointer"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold">Effect</span>
              <select
                value={selectedElement.effect}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    effect: e.target.value as 'none' | 'outline' | 'impact-shadow',
                  })
                }
                className="w-full px-2 py-1 border border-[#222222] bg-white"
              >
                <option value="none">None</option>
                <option value="outline">White Outline</option>
                <option value="impact-shadow">Ink Drop Shadow</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {/* IMAGE PROPERTIES */}
      {selectedElement.type === 'image' && (
        <div className="space-y-3 pt-3 border-t border-[#222222]/15 text-xs">
          <p className="text-[11px] font-bold uppercase text-[#737373]">Image Adjustments</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[10px] font-mono">Brightness ({selectedElement.brightness}%)</span>
              <input
                type="range"
                min={50}
                max={150}
                value={selectedElement.brightness}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { brightness: Number(e.target.value) })
                }
                className="w-full accent-[#E63946]"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-mono">Contrast ({selectedElement.contrast}%)</span>
              <input
                type="range"
                min={50}
                max={160}
                value={selectedElement.contrast}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { contrast: Number(e.target.value) })
                }
                className="w-full accent-[#E63946]"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => onUpdateElement(selectedElement.id, { flipX: !selectedElement.flipX })}
            className="w-full py-1.5 border border-[#222222] bg-[#FAF9F6] font-bold cursor-pointer"
          >
            Flip Horizontal
          </button>
        </div>
      )}

      {/* EFFECT PROPERTIES */}
      {selectedElement.type === 'effect' && (
        <div className="space-y-3 pt-3 border-t border-[#222222]/15 text-xs">
          <p className="text-[11px] font-bold uppercase text-[#737373]">Manga Effect</p>
          <label className="block">
            <span className="text-[10px] font-mono">Intensity ({selectedElement.intensity}%)</span>
            <input
              type="range"
              min={10}
              max={100}
              value={selectedElement.intensity}
              onChange={(e) =>
                onUpdateElement(selectedElement.id, { intensity: Number(e.target.value) })
              }
              className="w-full accent-[#E63946]"
            />
          </label>
        </div>
      )}

      {/* CONTEXTUAL AI EDITING ACTIONS */}
      <div className="pt-4 border-t-2 border-[#222222] space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#171717]">
          <Sparkles className="w-3.5 h-3.5 text-[#E63946]" />
          <span>AI Director Actions</span>
        </div>

        {aiMessage && (
          <div className="p-2.5 bg-[#FAF9F6] border border-[#222222] text-[11px] font-medium text-[#171717]">
            {aiMessage}
          </div>
        )}

        <div className="flex gap-1.5">
          <select
            value={selectedAngle}
            onChange={(e) => setSelectedAngle(e.target.value as CameraAngle)}
            aria-label="Camera angle selection"
            className="flex-1 px-2 py-1.5 border border-[#222222] bg-[#FAF9F6] text-[11px] font-semibold"
          >
            {CAMERA_ANGLE_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={Boolean(aiLoadingAction)}
            onClick={() => void onTriggerAiAction('change-camera-angle', selectedAngle)}
            className="px-2.5 py-1.5 bg-[#171717] text-white text-[11px] font-bold border border-[#222222] cursor-pointer disabled:opacity-50"
          >
            Reframe
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { id: 'regenerate-image', label: 'Regenerate Image' },
              { id: 'improve-composition', label: 'Improve Composition' },
              { id: 'change-expression', label: 'Change Expression' },
              { id: 'modify-background', label: 'Modify Background' },
              { id: 'enhance-details', label: 'Enhance Details' },
              { id: 'rewrite-dialogue', label: 'Rewrite Dialogue' },
              { id: 'continue-scene', label: 'Continue Scene' },
            ] as const
          ).map((act) => (
            <button
              key={act.id}
              type="button"
              disabled={Boolean(aiLoadingAction)}
              onClick={() => void onTriggerAiAction(act.id)}
              className="px-2 py-1.5 border border-[#222222] bg-[#FAF9F6] hover:bg-[#E63946] hover:text-white text-[11px] font-bold text-left transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
            >
              {aiLoadingAction === act.id && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
              <span className="truncate">{act.label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
