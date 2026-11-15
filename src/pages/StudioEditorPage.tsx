import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, Copy, Download, X } from 'lucide-react';
import { generationService } from '../services/generationService';
import { useStudioData } from '../store/StudioDataContext';
import type {
  AiActionRequest,
  BubbleStyle,
  CameraAngle,
  CanvasElement,
  EffectElement,
  MangaPage,
  MangaProject,
  StudioTemplate,
  StudioTool,
} from '../types/manga';
import {
  buildPanelsForPreset,
  clampZoom,
  createHistory,
  pushHistory,
  redoHistory,
  reorderLayers,
  reorderPages,
  undoHistory,
} from '../utils/editorLogic';
import { EditorBottomNavigator } from '../components/editor/EditorBottomNavigator';
import { EditorCanvas } from '../components/editor/EditorCanvas';
import { EditorLeftSidebar } from '../components/editor/EditorLeftSidebar';
import { EditorRightProperties } from '../components/editor/EditorRightProperties';
import { EditorTopToolbar } from '../components/editor/EditorTopToolbar';
import { MangaImage } from '../components/manga/MangaDecorations';

export default function StudioEditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    projects,
    characters,
    assets,
    updateProject,
    uploadAsset,
    startExportJob,
    isLoading,
  } = useStudioData();

  const sourceProject = projects.find((p) => p.id === projectId) || projects[0];

  const [history, setHistory] = useState(() =>
    createHistory<MangaProject | null>(sourceProject || null)
  );
  const [activePageId, setActivePageId] = useState<string>(sourceProject?.pages[0]?.id || '');
  const [activeChapterId, setActiveChapterId] = useState<string>(
    sourceProject?.chapters[0]?.id || ''
  );
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<StudioTool>('select');
  const [zoom, setZoom] = useState(() => {
    if (typeof window === 'undefined') return 65;
    if (window.innerWidth < 640) return 36;
    if (window.innerWidth < 1024) return 50;
    return 65;
  });
  const [panMode, setPanMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');

  const [aiLoadingAction, setAiLoadingAction] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Sync project on initial load or route param switch
  useEffect(() => {
    if (!sourceProject) return;
    if (history.present?.id !== sourceProject.id) {
      setHistory(createHistory(sourceProject));
      setActivePageId(sourceProject.pages[0]?.id || '');
      setActiveChapterId(sourceProject.chapters[0]?.id || '');
      setSelectedElementId(null);
    }
  }, [sourceProject, history.present?.id]);

  // Apply template preset if routed from Templates page
  useEffect(() => {
    const preset = searchParams.get('preset') as StudioTemplate['presetKey'] | null;
    if (preset && history.present) {
      handleApplyPreset(preset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const project = history.present;
  const activePage = project?.pages.find((pg) => pg.id === activePageId) || project?.pages[0];
  const selectedElement =
    activePage?.elements.find((el) => el.id === selectedElementId) || null;

  const commitProject = (next: MangaProject, record = true) => {
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    setSaveStatus('unsaved');
    setHistory((prev) =>
      record ? pushHistory(prev, stamped) : { ...prev, present: stamped }
    );
  };

  const commitPageElements = (
    updater: (elements: CanvasElement[]) => CanvasElement[],
    record = true
  ) => {
    if (!project || !activePage) return;
    const nextPages = project.pages.map((pg) =>
      pg.id === activePage.id ? { ...pg, elements: updater(pg.elements) } : pg
    );
    commitProject({ ...project, pages: nextPages }, record);
  };

  const handleSave = async () => {
    if (!project) return;
    setSaveStatus('saving');
    await updateProject(project);
    setSaveStatus('saved');
  };

  const handleUndo = () => {
    setHistory((prev) => undoHistory(prev));
    setSaveStatus('unsaved');
  };

  const handleRedo = () => {
    setHistory((prev) => redoHistory(prev));
    setSaveStatus('unsaved');
  };

  const handleUpdateElement = (
    elementId: string,
    patch: Partial<CanvasElement>,
    recordHistory = true
  ) => {
    commitPageElements(
      (elements) =>
        elements.map((el) => (el.id === elementId ? ({ ...el, ...patch } as CanvasElement) : el)),
      recordHistory
    );
  };

  const handleDeleteElement = (elementId: string) => {
    commitPageElements((elements) => elements.filter((el) => el.id !== elementId), true);
    if (selectedElementId === elementId) setSelectedElementId(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT';
      if (isTyping) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();
        handleDeleteElement(selectedElementId);
      } else if (e.key === 'Escape') {
        setSelectedElementId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-mono text-sm">
        Loading MangaForge Studio...
      </div>
    );
  }

  if (!project || !activePage) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center gap-4">
        <h1 className="font-display text-2xl font-bold">Project Not Found</h1>
        <button
          type="button"
          onClick={() => navigate('/dashboard/projects')}
          className="px-4 py-2 bg-[#171717] text-white text-xs font-bold border-2 border-[#222222]"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  const nextZIndex = activePage.elements.reduce((m, e) => Math.max(m, e.zIndex), 0) + 1;

  const handleAddPanel = () => {
    const id = `panel-${Date.now()}`;
    commitPageElements((els) => [
      ...els,
      {
        id,
        type: 'panel',
        name: `Panel ${els.filter((e) => e.type === 'panel').length + 1}`,
        x: 64,
        y: 64,
        width: 280,
        height: 240,
        rotation: 0,
        visible: true,
        locked: false,
        zIndex: nextZIndex,
        opacity: 100,
        borderWidth: 3,
        borderStyle: 'solid',
        cornerShape: 'sharp',
        backgroundColor: '#FFFFFF',
        screentone: 'none',
        imageBrightness: 100,
        imageContrast: 105,
        imageFlipX: false,
      },
    ]);
    setSelectedElementId(id);
  };

  function handleApplyPreset(presetKey: StudioTemplate['presetKey']) {
    if (!project || !activePage) return;
    const existingImgs = activePage.elements
      .filter((e): e is Extract<CanvasElement, { type: 'panel' }> => e.type === 'panel')
      .map((p) => p.imageUrl || '')
      .filter(Boolean);
    const nonPanels = activePage.elements.filter((e) => e.type !== 'panel');
    const newPanels = buildPanelsForPreset(presetKey, activePage.gutterSize, existingImgs);
    const reindexedNonPanels = nonPanels.map((el, i) => ({
      ...el,
      zIndex: newPanels.length + i + 1,
    }));
    const nextPages = project.pages.map((pg) =>
      pg.id === activePage.id
        ? { ...pg, elements: [...newPanels, ...reindexedNonPanels] }
        : pg
    );
    commitProject({ ...project, pages: nextPages });
  }

  const handleAddImage = (imageUrl: string, title: string) => {
    const id = `img-${Date.now()}`;
    commitPageElements((els) => [
      ...els,
      {
        id,
        type: 'image',
        name: title,
        x: 110,
        y: 120,
        width: 300,
        height: 360,
        rotation: 0,
        visible: true,
        locked: false,
        zIndex: nextZIndex,
        opacity: 100,
        imageUrl,
        brightness: 100,
        contrast: 105,
        flipX: false,
      },
    ]);
    setSelectedElementId(id);
  };

  const handleAddText = (preset: 'heading' | 'sfx' | 'caption') => {
    const id = `txt-${Date.now()}`;
    commitPageElements((els) => [
      ...els,
      {
        id,
        type: 'text',
        name: preset === 'sfx' ? 'SFX Lettering' : preset === 'heading' ? 'Heading' : 'Caption',
        x: 160,
        y: 180,
        width: 240,
        height: 60,
        rotation: preset === 'sfx' ? -8 : 0,
        visible: true,
        locked: false,
        zIndex: nextZIndex,
        opacity: 100,
        text: preset === 'sfx' ? 'DOOOM!!' : preset === 'heading' ? 'CHAPTER 01' : 'Tokyo · 23:40',
        fontFamily: preset === 'caption' ? 'JetBrains Mono' : 'Outfit',
        fontSize: preset === 'sfx' ? 36 : preset === 'heading' ? 28 : 14,
        fontWeight: preset === 'caption' ? 600 : 800,
        textAlign: 'center',
        letterSpacing: preset === 'sfx' ? 2 : 0,
        color: preset === 'sfx' ? '#E63946' : '#171717',
        effect: preset === 'sfx' ? 'impact-shadow' : 'none',
      },
    ]);
    setSelectedElementId(id);
  };

  const handleAddBubble = (bubbleStyle: BubbleStyle) => {
    const id = `bub-${Date.now()}`;
    commitPageElements((els) => [
      ...els,
      {
        id,
        type: 'bubble',
        name: `${bubbleStyle} bubble`,
        x: 180,
        y: 140,
        width: 210,
        height: 100,
        rotation: 0,
        visible: true,
        locked: false,
        zIndex: nextZIndex,
        opacity: 100,
        text:
          bubbleStyle === 'shout'
            ? 'LOOK OUT ABOVE!'
            : bubbleStyle === 'narration'
              ? 'Meanwhile, across the district...'
              : 'Double-click to edit dialogue.',
        bubbleStyle,
        tailDirection: bubbleStyle === 'narration' ? 'none' : 'bottom-left',
        fontSize: 13,
        textAlign: 'center',
        borderWidth: 2,
        fontWeight: bubbleStyle === 'shout' ? 700 : 600,
      },
    ]);
    setSelectedElementId(id);
  };

  const handleAddEffect = (effectKind: EffectElement['effectKind']) => {
    const id = `fx-${Date.now()}`;
    commitPageElements((els) => [
      ...els,
      {
        id,
        type: 'effect',
        name: `Effect: ${effectKind}`,
        x: 80,
        y: 80,
        width: 560,
        height: 400,
        rotation: 0,
        visible: true,
        locked: false,
        zIndex: nextZIndex,
        opacity: 100,
        effectKind,
        intensity: 35,
        color: effectKind === 'impact-burst' ? '#E63946' : '#222222',
      },
    ]);
    setSelectedElementId(id);
  };

  const handleTriggerAiAction = async (
    action: AiActionRequest['action'],
    cameraAngle?: CameraAngle
  ) => {
    if (!selectedElement) return;
    setAiLoadingAction(action);
    setAiMessage(null);
    try {
      const result = await generationService.runEditorAiAction({
        projectId: project.id,
        pageId: activePage.id,
        elementId: selectedElement.id,
        action,
        cameraAngle,
      });
      setAiMessage(result.message);

      if (result.suggestedImageUrl && selectedElement.type === 'panel') {
        handleUpdateElement(selectedElement.id, { imageUrl: result.suggestedImageUrl });
      } else if (result.suggestedImageUrl && selectedElement.type === 'image') {
        handleUpdateElement(selectedElement.id, { imageUrl: result.suggestedImageUrl });
      } else if (result.suggestedDialogue && selectedElement.type === 'bubble') {
        handleUpdateElement(selectedElement.id, { text: result.suggestedDialogue });
      } else if (result.suggestedCameraAngle && selectedElement.type === 'panel') {
        handleUpdateElement(selectedElement.id, { cameraAngle: result.suggestedCameraAngle });
      }
    } catch (err) {
      setAiMessage(err instanceof Error ? err.message : 'AI Director action failed.');
    } finally {
      setAiLoadingAction(null);
    }
  };

  const handleAddPage = () => {
    const newPage: MangaPage = {
      id: `pg-${Date.now()}`,
      pageNumber: project.pages.length + 1,
      chapterId: activeChapterId || project.chapters[0]?.id || 'ch-1',
      title: `Page ${project.pages.length + 1}`,
      gutterSize: 14,
      backgroundColor: '#FFFFFF',
      elements: buildPanelsForPreset('four-panel-grid', 14),
    };
    commitProject({ ...project, pages: [...project.pages, newPage] });
    setActivePageId(newPage.id);
    setSelectedElementId(null);
  };

  const handleDuplicatePage = (pageId: string) => {
    const target = project.pages.find((p) => p.id === pageId);
    if (!target) return;
    const copy: MangaPage = {
      ...target,
      id: `pg-${Date.now()}`,
      pageNumber: project.pages.length + 1,
      title: `${target.title} (Copy)`,
      elements: target.elements.map((el, idx) => ({ ...el, id: `${el.id}-copy-${Date.now()}-${idx}` })),
    };
    commitProject({ ...project, pages: [...project.pages, copy] });
    setActivePageId(copy.id);
  };

  const handleDeletePage = (pageId: string) => {
    if (project.pages.length <= 1) return;
    const remaining = project.pages
      .filter((p) => p.id !== pageId)
      .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    commitProject({ ...project, pages: remaining });
    if (activePageId === pageId) {
      setActivePageId(remaining[0].id);
    }
  };

  const handleMovePage = (from: number, to: number) => {
    const reordered = reorderPages(project.pages, from, to);
    commitProject({ ...project, pages: reordered });
  };

  const handleAddChapter = () => {
    const nextNum = project.chapters.length + 1;
    const ch = {
      id: `ch-${Date.now()}`,
      number: nextNum,
      title: `Chapter ${String(nextNum).padStart(2, '0')}: Untitled`,
      synopsis: '',
    };
    commitProject({ ...project, chapters: [...project.chapters, ch] });
    setActiveChapterId(ch.id);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#FAF9F6] text-[#171717]">
      <EditorTopToolbar
        projectTitle={project.title}
        onTitleChange={(title) => commitProject({ ...project, title })}
        readingDirection={project.readingDirection}
        onToggleReadingDirection={() =>
          commitProject({
            ...project,
            readingDirection: project.readingDirection === 'rtl' ? 'ltr' : 'rtl',
          })
        }
        saveStatus={saveStatus}
        onSave={() => void handleSave()}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={(next) => setZoom(clampZoom(next))}
        panMode={panMode}
        onTogglePanMode={() => setPanMode((p) => !p)}
        onOpenPreview={() => setPreviewOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
        onOpenShare={() => setShareModalOpen(true)}
      />

      {/* Main 3-Pane Studio Workspace */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <EditorLeftSidebar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          gutterSize={activePage.gutterSize}
          onGutterChange={(gutterSize) => {
            const nextPages = project.pages.map((pg) =>
              pg.id === activePage.id ? { ...pg, gutterSize } : pg
            );
            commitProject({ ...project, pages: nextPages });
          }}
          onAddPanel={handleAddPanel}
          onApplyPreset={handleApplyPreset}
          onUploadAsset={uploadAsset}
          onAddImage={handleAddImage}
          onAddText={handleAddText}
          onAddBubble={handleAddBubble}
          onAddEffect={handleAddEffect}
          onSetPageBackground={(backgroundColor) => {
            const nextPages = project.pages.map((pg) =>
              pg.id === activePage.id ? { ...pg, backgroundColor } : pg
            );
            commitProject({ ...project, pages: nextPages });
          }}
          elements={activePage.elements}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          onToggleVisibility={(id) => {
            const el = activePage.elements.find((e) => e.id === id);
            if (el) handleUpdateElement(id, { visible: !el.visible });
          }}
          onToggleLock={(id) => {
            const el = activePage.elements.find((e) => e.id === id);
            if (el) handleUpdateElement(id, { locked: !el.locked });
          }}
          onReorderLayer={(id, dir) =>
            commitPageElements((els) => reorderLayers(els, id, dir))
          }
          onDeleteElement={handleDeleteElement}
          onRenameElement={(id, name) => handleUpdateElement(id, { name })}
          characters={characters}
          assets={assets}
        />

        <EditorCanvas
          page={activePage}
          zoom={zoom}
          panMode={panMode}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          onUpdateElement={handleUpdateElement}
        />

        <div className="hidden md:flex">
          <EditorRightProperties
            selectedElement={selectedElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onTriggerAiAction={handleTriggerAiAction}
            aiLoadingAction={aiLoadingAction}
            aiMessage={aiMessage}
          />
        </div>
      </div>

      {/* Mobile Properties & Zoom Quick Bar */}
      <div className="md:hidden border-t-2 border-[#222222] bg-white px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={() => setZoom((z) => clampZoom(z - 10))}
            aria-label="Mobile zoom out"
            className="px-2 py-1 border border-[#222222] bg-[#FAF9F6] text-xs font-mono font-bold"
          >
            -
          </button>
          <span className="font-mono text-[11px] font-bold tabular-nums">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => clampZoom(z + 10))}
            aria-label="Mobile zoom in"
            className="px-2 py-1 border border-[#222222] bg-[#FAF9F6] text-xs font-mono font-bold"
          >
            +
          </button>
          {selectedElement && (
            <span className="text-xs font-bold truncate ml-1">
              {selectedElement.name}
            </span>
          )}
        </div>
        {selectedElement && (
          <button
            type="button"
            onClick={() => handleTriggerAiAction('regenerate-image')}
            disabled={Boolean(aiLoadingAction)}
            className="px-2.5 py-1 bg-[#E63946] text-white text-xs font-bold border border-[#222222] shrink-0"
          >
            AI Regenerate
          </button>
        )}
      </div>

      <EditorBottomNavigator
        chapters={project.chapters}
        activeChapterId={activeChapterId}
        onSelectChapter={setActiveChapterId}
        onAddChapter={handleAddChapter}
        pages={project.pages}
        activePageId={activePage.id}
        onSelectPage={(id) => {
          setActivePageId(id);
          setSelectedElementId(null);
        }}
        onAddPage={handleAddPage}
        onDuplicatePage={handleDuplicatePage}
        onDeletePage={handleDeletePage}
        onMovePage={handleMovePage}
      />

      {/* Page Preview Modal */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Manga Page Preview"
        >
          <div className="bg-[#FAF9F6] border-2 border-[#222222] max-w-xl w-full p-5 manga-panel-shadow space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#222222] pb-2.5">
              <span className="font-mono text-xs font-bold">
                PREVIEW · {project.title} — P.{activePage.pageNumber}
              </span>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close preview"
                className="p-1 border border-[#222222] bg-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-[520px] border-2 border-[#222222] bg-white overflow-y-auto p-4 grid grid-cols-2 gap-3">
              {activePage.elements
                .filter((e) => e.type === 'panel' && e.visible)
                .map((panel) => (
                  <div key={panel.id} className="border-2 border-[#222222] h-56 overflow-hidden">
                    {panel.type === 'panel' && (
                      <MangaImage
                        src={panel.imageUrl}
                        alt={panel.name}
                        fallbackTitle={panel.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Export Modal */}
      {exportModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Quick Export"
        >
          <div className="bg-white border-2 border-[#222222] max-w-md w-full p-6 manga-panel-shadow space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#222222] pb-3">
              <h2 className="font-display text-lg font-bold">Export Manga Page</h2>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                aria-label="Close export modal"
                className="p-1 border border-[#222222] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-[#525252]">
              Queue a 300 DPI print-ready PDF or open the full Export Center for custom page sizes
              and grayscale settings.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={async () => {
                  await startExportJob({
                    projectId: project.id,
                    projectTitle: project.title,
                    format: 'PDF',
                    resolution: '300 DPI',
                    pageSize: 'B5 Manga',
                    scope: 'Complete Chapter',
                    quality: 'Print Master',
                    includeDialogue: true,
                    colorMode: 'Grayscale',
                  });
                  setExportModalOpen(false);
                  navigate('/dashboard/exports');
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E63946] text-white text-xs font-bold border-2 border-[#222222] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Render 300 DPI PDF</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setExportModalOpen(false);
                  navigate('/dashboard/exports');
                }}
                className="px-4 py-2.5 border-2 border-[#222222] text-xs font-bold cursor-pointer"
              >
                Advanced
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Placeholder Modal */}
      {shareModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Share Project"
        >
          <div className="bg-white border-2 border-[#222222] max-w-md w-full p-6 manga-panel-shadow space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#222222] pb-3">
              <h2 className="font-display text-lg font-bold">Share Review Link</h2>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                aria-label="Close share modal"
                className="p-1 border border-[#222222] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#525252]">
              Shareable read-only chapter proof links will connect to your MangaForge backend.
            </p>
            <div className="flex">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/studio/${project.id}`}
                aria-label="Shareable link"
                className="flex-1 px-3 py-2 bg-[#FAF9F6] border-2 border-[#222222] font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(`${window.location.origin}/studio/${project.id}`);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                }}
                className="px-3 py-2 bg-[#171717] text-white text-xs font-bold border-2 border-l-0 border-[#222222] inline-flex items-center gap-1 cursor-pointer"
              >
                {shareCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{shareCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
