import React, { useRef, useState } from 'react';
import type { CanvasElement, MangaPage } from '../../types/manga';
import { clampElementBounds, PAGE_HEIGHT, PAGE_WIDTH } from '../../utils/editorLogic';
import { MangaImage, SpeedLinesSvg } from '../manga/MangaDecorations';

interface EditorCanvasProps {
  page: MangaPage;
  zoom: number;
  panMode: boolean;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (elementId: string, patch: Partial<CanvasElement>, recordHistory?: boolean) => void;
}

export function EditorCanvas({
  page,
  zoom,
  panMode,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
}: EditorCanvasProps) {
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const interactionRef = useRef<{
    mode: 'drag' | 'resize' | 'pan';
    elementId?: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const scale = zoom / 100;

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (panMode) {
      interactionRef.current = {
        mode: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        origX: panOffset.x,
        origY: panOffset.y,
        origW: 0,
        origH: 0,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (e.target === e.currentTarget) {
      onSelectElement(null);
      setEditingTextId(null);
    }
  };

  const handleElementPointerDown = (
    e: React.PointerEvent,
    el: CanvasElement,
    mode: 'drag' | 'resize'
  ) => {
    if (panMode) return;
    e.stopPropagation();
    onSelectElement(el.id);
    if (el.locked) return;

    interactionRef.current = {
      mode,
      elementId: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
      origW: el.width,
      origH: el.height,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const active = interactionRef.current;
    if (!active) return;

    const dx = e.clientX - active.startX;
    const dy = e.clientY - active.startY;

    if (active.mode === 'pan') {
      setPanOffset({ x: active.origX + dx, y: active.origY + dy });
      return;
    }

    if (!active.elementId) return;
    const scaledDx = dx / scale;
    const scaledDy = dy / scale;

    if (active.mode === 'drag') {
      const clamped = clampElementBounds(
        active.origX + scaledDx,
        active.origY + scaledDy,
        active.origW,
        active.origH
      );
      onUpdateElement(active.elementId, { x: clamped.x, y: clamped.y }, false);
    } else if (active.mode === 'resize') {
      const clamped = clampElementBounds(
        active.origX,
        active.origY,
        active.origW + scaledDx,
        active.origH + scaledDy
      );
      onUpdateElement(active.elementId, { width: clamped.width, height: clamped.height }, false);
    }
  };

  const handlePointerUp = () => {
    interactionRef.current = null;
  };

  const sortedElements = [...page.elements]
    .filter((el) => el.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      data-testid="studio-canvas-viewport"
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`flex-1 relative overflow-auto bg-[#EAE7E0] manga-paper-grid flex items-center justify-center p-8 select-none ${
        panMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
    >
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          width: `${PAGE_WIDTH}px`,
          height: `${PAGE_HEIGHT}px`,
          backgroundColor: page.backgroundColor,
        }}
        onPointerDown={handleCanvasPointerDown}
        className="relative shrink-0 border-2 border-[#222222] shadow-[8px_8px_0px_rgba(34,34,34,0.22)] transition-transform duration-75"
      >
        {/* Page Margin Guides */}
        <div
          className="absolute inset-6 border border-dashed border-[#222222]/15 pointer-events-none"
          aria-hidden="true"
        />

        {sortedElements.map((el) => {
          const isSelected = el.id === selectedElementId;
          const baseStyle: React.CSSProperties = {
            left: `${el.x}px`,
            top: `${el.y}px`,
            width: `${el.width}px`,
            height: `${el.height}px`,
            transform: `rotate(${el.rotation}deg)`,
            zIndex: el.zIndex,
            opacity: el.opacity / 100,
          };

          return (
            <div
              key={el.id}
              data-testid={`canvas-element-${el.id}`}
              style={baseStyle}
              onPointerDown={(e) => handleElementPointerDown(e, el, 'drag')}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if ((el.type === 'bubble' || el.type === 'text') && !el.locked) {
                  setEditingTextId(el.id);
                }
              }}
              className={`absolute group ${el.locked ? 'cursor-not-allowed' : 'cursor-move'} ${
                isSelected ? 'ring-2 ring-[#E63946] ring-offset-2' : ''
              }`}
            >
              {/* PANEL RENDERER */}
              {el.type === 'panel' && (
                <div
                  className="w-full h-full overflow-hidden relative"
                  style={{
                    backgroundColor: el.backgroundColor,
                    borderWidth: el.borderStyle === 'none' ? 0 : `${el.borderWidth}px`,
                    borderStyle: el.borderStyle === 'none' ? 'solid' : el.borderStyle,
                    borderColor: '#222222',
                    borderRadius:
                      el.cornerShape === 'subtle-round'
                        ? '10px'
                        : el.cornerShape === 'beveled'
                          ? '2px'
                          : '0px',
                  }}
                >
                  {el.imageUrl && (
                    <MangaImage
                      src={el.imageUrl}
                      alt={el.name}
                      fallbackTitle={el.name}
                      className="w-full h-full object-cover pointer-events-none"
                      style={{
                        filter: `brightness(${el.imageBrightness}%) contrast(${el.imageContrast}%)`,
                        transform: el.imageFlipX ? 'scaleX(-1)' : undefined,
                      }}
                    />
                  )}
                  {el.screentone === 'light' && (
                    <div className="absolute inset-0 manga-halftone-subtle pointer-events-none" />
                  )}
                  {el.screentone === 'dense' && (
                    <div className="absolute inset-0 manga-halftone-dense pointer-events-none" />
                  )}
                  {el.screentone === 'speedlines' && (
                    <SpeedLinesSvg className="absolute inset-0 w-full h-full" opacity={0.28} />
                  )}
                  {!el.imageUrl && (
                    <div className="w-full h-full flex items-center justify-center text-xs font-mono text-[#737373]">
                      {el.name}
                    </div>
                  )}
                </div>
              )}

              {/* SPEECH BUBBLE RENDERER */}
              {el.type === 'bubble' && (
                <div
                  className={`w-full h-full flex items-center justify-center p-3 bg-white relative ${
                    el.bubbleStyle === 'speech'
                      ? 'rounded-[46%]'
                      : el.bubbleStyle === 'thought'
                        ? 'rounded-full border-dashed'
                        : el.bubbleStyle === 'whisper'
                          ? 'rounded-3xl border-dotted'
                          : el.bubbleStyle === 'shout'
                            ? 'rounded-none shadow-[3px_3px_0px_#E63946]'
                            : 'rounded-none bg-[#FAF9F6]'
                  }`}
                  style={{
                    borderWidth: `${el.borderWidth}px`,
                    borderColor: '#222222',
                    borderStyle:
                      el.bubbleStyle === 'thought'
                        ? 'dashed'
                        : el.bubbleStyle === 'whisper'
                          ? 'dotted'
                          : 'solid',
                  }}
                >
                  {editingTextId === el.id ? (
                    <textarea
                      value={el.text}
                      onChange={(e) => onUpdateElement(el.id, { text: e.target.value }, false)}
                      onBlur={() => setEditingTextId(null)}
                      autoFocus
                      className="w-full h-full bg-transparent resize-none text-center focus:outline-none text-[#171717]"
                      style={{ fontSize: `${el.fontSize}px`, fontWeight: el.fontWeight }}
                    />
                  ) : (
                    <p
                      className="w-full leading-snug text-[#171717] break-words"
                      style={{
                        fontSize: `${el.fontSize}px`,
                        textAlign: el.textAlign,
                        fontWeight: el.fontWeight,
                      }}
                    >
                      {el.text}
                    </p>
                  )}

                  {el.tailDirection !== 'none' && el.bubbleStyle !== 'narration' && (
                    <svg
                      width="18"
                      height="14"
                      viewBox="0 0 18 14"
                      fill="none"
                      aria-hidden="true"
                      className={`absolute ${
                        el.tailDirection === 'bottom-left'
                          ? '-bottom-3.5 left-6'
                          : el.tailDirection === 'bottom-right'
                            ? '-bottom-3.5 right-6'
                            : el.tailDirection === 'top-left'
                              ? '-top-3.5 left-6 rotate-180'
                              : '-top-3.5 right-6 rotate-180'
                      }`}
                    >
                      <path
                        d="M2 0L4 13L15 0"
                        fill="#FFFFFF"
                        stroke="#222222"
                        strokeWidth={el.borderWidth}
                      />
                    </svg>
                  )}
                </div>
              )}

              {/* TEXT / SFX RENDERER */}
              {el.type === 'text' && (
                <div className="w-full h-full flex items-center justify-center px-1">
                  {editingTextId === el.id ? (
                    <input
                      type="text"
                      value={el.text}
                      onChange={(e) => onUpdateElement(el.id, { text: e.target.value }, false)}
                      onBlur={() => setEditingTextId(null)}
                      autoFocus
                      className="w-full bg-white/80 border border-[#222222] px-1 focus:outline-none"
                      style={{
                        fontFamily: el.fontFamily,
                        fontSize: `${el.fontSize}px`,
                        fontWeight: el.fontWeight,
                        color: el.color,
                      }}
                    />
                  ) : (
                    <div
                      className="w-full leading-none break-words"
                      style={{
                        fontFamily: el.fontFamily,
                        fontSize: `${el.fontSize}px`,
                        fontWeight: el.fontWeight,
                        textAlign: el.textAlign,
                        letterSpacing: `${el.letterSpacing}px`,
                        color: el.color,
                        textShadow:
                          el.effect === 'impact-shadow'
                            ? '2px 2px 0px #171717'
                            : el.effect === 'outline'
                              ? '-1px -1px 0 #FFF, 1px -1px 0 #FFF, -1px 1px 0 #FFF, 1px 1px 0 #FFF'
                              : undefined,
                      }}
                    >
                      {el.text}
                    </div>
                  )}
                </div>
              )}

              {/* IMAGE RENDERER */}
              {el.type === 'image' && (
                <div className="w-full h-full border-2 border-[#222222] overflow-hidden bg-white">
                  <MangaImage
                    src={el.imageUrl}
                    alt={el.name}
                    fallbackTitle={el.name}
                    className="w-full h-full object-cover pointer-events-none"
                    style={{
                      filter: `brightness(${el.brightness}%) contrast(${el.contrast}%)`,
                      transform: el.flipX ? 'scaleX(-1)' : undefined,
                    }}
                  />
                </div>
              )}

              {/* EFFECT OVERLAY RENDERER */}
              {el.type === 'effect' && (
                <div className="w-full h-full pointer-events-none overflow-hidden">
                  {el.effectKind === 'speed-lines' && (
                    <SpeedLinesSvg className="w-full h-full" opacity={el.intensity / 100} />
                  )}
                  {el.effectKind === 'halftone-wash' && (
                    <div
                      className="w-full h-full manga-halftone"
                      style={{ opacity: el.intensity / 100 }}
                    />
                  )}
                  {el.effectKind === 'impact-burst' && (
                    <svg viewBox="0 0 200 200" className="w-full h-full" style={{ opacity: el.intensity / 100 }}>
                      <polygon
                        points="100,5 120,70 190,45 140,100 195,145 125,130 100,195 75,130 10,150 60,100 15,45 80,70"
                        fill="none"
                        stroke={el.color}
                        strokeWidth="4"
                      />
                    </svg>
                  )}
                </div>
              )}

              {/* Resize Handle when selected & unlocked */}
              {isSelected && !el.locked && (
                <div
                  onPointerDown={(e) => handleElementPointerDown(e, el, 'resize')}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  title="Drag to resize"
                  className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#E63946] border-2 border-[#222222] cursor-nwse-resize z-50"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
