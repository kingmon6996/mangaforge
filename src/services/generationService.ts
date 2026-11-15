import { API_ENDPOINTS, IS_PREVIEW_MODE } from '../config/api';
import { MANGA_ARTWORK } from '../config/media';
import type {
  AiActionRequest,
  Character,
  CreateMangaPayload,
  MangaPage,
  MangaProject,
} from '../types/manga';
import { buildPanelsForPreset } from '../utils/editorLogic';
import { apiRequest } from './apiClient';

function pickGenreArtwork(genre: CreateMangaPayload['genre']): string {
  switch (genre) {
    case 'Shonen':
    case 'Action':
      return MANGA_ARTWORK.shonen;
    case 'Seinen':
    case 'Horror':
      return MANGA_ARTWORK.seinen;
    case 'Fantasy':
    case 'Romance':
      return MANGA_ARTWORK.fantasy;
    case 'Sci-Fi':
      return MANGA_ARTWORK.scifi;
    default:
      return MANGA_ARTWORK.heroPage;
  }
}

export const generationService = {
  async generateMangaProject(
    payload: CreateMangaPayload
  ): Promise<{ project: MangaProject; character: Character }> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<{ project: MangaProject; character: Character }>(
        API_ENDPOINTS.generation.createProject,
        {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            coverImageUrl: new URL(pickGenreArtwork(payload.genre), window.location.origin).href,
            characterReferenceImageUrl: new URL(
              MANGA_ARTWORK.characterTurnaround,
              window.location.origin
            ).href,
            panelArtworkUrls: [
              MANGA_ARTWORK.heroPage,
              MANGA_ARTWORK.shonen,
              MANGA_ARTWORK.seinen,
              MANGA_ARTWORK.fantasy,
              MANGA_ARTWORK.scifi,
            ].map((url) => new URL(url, window.location.origin).href),
          }),
        }
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 900));

    const coverUrl = pickGenreArtwork(payload.genre);
    const charId = `char-${Date.now()}`;
    const projId = `proj-${Date.now()}`;
    const now = new Date().toISOString();

    const character: Character = {
      id: charId,
      name: payload.characterName,
      role: payload.characterRole,
      personality: payload.characterPersonality,
      hairstyle: payload.characterHairstyle,
      facialFeatures: payload.characterFacialFeatures,
      clothing: payload.characterClothing,
      bodyType: payload.characterBodyType,
      appearanceSummary: `${payload.characterHairstyle}, ${payload.characterClothing}`,
      consistencyNotes: payload.characterNotes || 'Maintain consistent silhouette across panels.',
      referenceImageUrl: MANGA_ARTWORK.characterTurnaround,
      expressions: [
        { id: `exp-${Date.now()}-1`, label: 'Neutral Focus', notes: 'Primary storyboard reference' },
        { id: `exp-${Date.now()}-2`, label: 'Action Intensity', notes: 'Dramatic ink shading' },
      ],
      associatedProjectIds: [projId],
      updatedAt: now,
    };

    const preset =
      payload.panelsPerPage >= 5
        ? 'dynamic-action'
        : payload.panelsPerPage === 3
          ? 'splash-focus'
          : 'four-panel-grid';

    const chapters = Array.from({ length: payload.chaptersCount }, (_, idx) => ({
      id: `ch-${Date.now()}-${idx + 1}`,
      number: idx + 1,
      title: `Chapter ${String(idx + 1).padStart(2, '0')}: ${payload.title}`,
      synopsis: payload.storyContent.slice(0, 140),
    }));

    const pages: MangaPage[] = Array.from(
      { length: Math.min(4, Math.max(1, payload.pagesPerChapter)) },
      (_, idx) => {
        const panels = buildPanelsForPreset(preset, 14, [
          coverUrl,
          MANGA_ARTWORK.heroPage,
          MANGA_ARTWORK.characterTurnaround,
          coverUrl,
          MANGA_ARTWORK.shonen,
        ]);
        return {
          id: `pg-${Date.now()}-${idx + 1}`,
          pageNumber: idx + 1,
          chapterId: chapters[0].id,
          title: `Page ${idx + 1}`,
          gutterSize: 14,
          backgroundColor: '#FFFFFF',
          elements: [
            ...panels,
            ...(payload.dialogueGeneration
              ? [
                  {
                    id: `bub-${Date.now()}-${idx + 1}`,
                    type: 'bubble' as const,
                    name: 'Opening Dialogue',
                    x: 68,
                    y: 54,
                    width: 210,
                    height: 92,
                    rotation: 0,
                    visible: true,
                    locked: false,
                    zIndex: panels.length + 1,
                    opacity: 100,
                    text: `${payload.characterName}: "This is where the next chapter begins."`,
                    bubbleStyle: 'speech' as const,
                    tailDirection: 'bottom-right' as const,
                    fontSize: 13,
                    textAlign: 'center' as const,
                    borderWidth: 2,
                    fontWeight: 600 as const,
                  },
                ]
              : []),
          ],
        };
      }
    );

    const project: MangaProject = {
      id: projId,
      title: payload.title,
      description: payload.description,
      genre: payload.genre,
      artStyle: payload.artStyle,
      targetAudience: payload.targetAudience,
      language: payload.language,
      readingDirection: 'rtl',
      status: 'In Production',
      coverImageUrl: coverUrl,
      chapters,
      pages,
      characterIds: [charId],
      createdAt: now,
      updatedAt: now,
    };

    return { project, character };
  },

  async runEditorAiAction(request: AiActionRequest): Promise<{
    message: string;
    suggestedImageUrl?: string;
    suggestedDialogue?: string;
    suggestedCameraAngle?: AiActionRequest['cameraAngle'];
  }> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest(API_ENDPOINTS.generation.aiEdit, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 650));

    const artPool = [
      MANGA_ARTWORK.heroPage,
      MANGA_ARTWORK.shonen,
      MANGA_ARTWORK.seinen,
      MANGA_ARTWORK.fantasy,
      MANGA_ARTWORK.scifi,
    ];
    const nextImg = artPool[Math.floor(Math.random() * artPool.length)];

    switch (request.action) {
      case 'regenerate-image':
        return { message: 'Panel artwork regenerated with updated ink composition.', suggestedImageUrl: nextImg };
      case 'improve-composition':
        return { message: 'Composition balanced for focal lead-in and stronger silhouette contrast.' };
      case 'change-expression':
        return { message: 'Character facial expression updated to heightened intensity.', suggestedImageUrl: MANGA_ARTWORK.characterTurnaround };
      case 'change-camera-angle':
        return {
          message: `Camera perspective reframed to ${request.cameraAngle || 'Dynamic action perspective'}.`,
          suggestedCameraAngle: request.cameraAngle || 'Dynamic action perspective',
        };
      case 'modify-background':
        return { message: 'Background screentone and architectural depth updated.' };
      case 'enhance-details':
        return { message: 'Fine nib-pen cross-hatching and edge contrast enhanced.' };
      case 'rewrite-dialogue':
        return {
          message: 'Dialogue tightened for natural manga pacing.',
          suggestedDialogue: 'We cross the line before the ink dries—no turning back.',
        };
      case 'continue-scene':
        return { message: 'Next narrative beat drafted and ready to insert as a new panel.' };
    }
  },
};
