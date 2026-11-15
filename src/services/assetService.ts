import { API_ENDPOINTS, IS_PREVIEW_MODE } from '../config/api';
import type { AssetItem, StoryEntry, StudioTemplate } from '../types/manga';
import { apiRequest } from './apiClient';
import { INITIAL_ASSETS, INITIAL_STORIES, STUDIO_TEMPLATES } from './mockData';

const PREVIEW_STORIES_KEY = 'mangaforge_preview_stories';

function loadPreviewStories(): StoryEntry[] {
  try {
    const raw = window.localStorage.getItem(PREVIEW_STORIES_KEY);
    if (!raw) return INITIAL_STORIES;
    const saved = JSON.parse(raw) as StoryEntry[];
    return Array.isArray(saved) ? [...saved, ...INITIAL_STORIES] : INITIAL_STORIES;
  } catch {
    return INITIAL_STORIES;
  }
}

export const assetService = {
  async listAssets(): Promise<AssetItem[]> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<AssetItem[]>(API_ENDPOINTS.assets.list);
    }
    return INITIAL_ASSETS;
  },

  async uploadAsset(file: File): Promise<AssetItem> {
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('Image exceeds the 20 MB upload limit.');
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Upload a JPEG, PNG, or WebP image.');
    }

    if (!IS_PREVIEW_MODE) {
      const body = new FormData();
      body.append('file', file);
      return apiRequest<AssetItem>(API_ENDPOINTS.assets.list, {
        method: 'POST',
        body,
      });
    }

    const imageUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Could not read the selected image.'));
      };
      reader.onerror = () => reject(new Error('Could not read the selected image.'));
      reader.readAsDataURL(file);
    });
    return {
      id: `preview-asset-${Date.now()}`,
      title: file.name,
      category: 'Uploaded',
      imageUrl,
      tags: [],
      createdAt: new Date().toISOString(),
    };
  },

  async listTemplates(): Promise<StudioTemplate[]> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<StudioTemplate[]>(API_ENDPOINTS.assets.templates);
    }
    return STUDIO_TEMPLATES;
  },

  async listStories(): Promise<StoryEntry[]> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<StoryEntry[]>(API_ENDPOINTS.stories.list);
    }
    return loadPreviewStories();
  },

  async createStory(story: StoryEntry): Promise<StoryEntry> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<StoryEntry>(API_ENDPOINTS.stories.list, {
        method: 'POST',
        body: JSON.stringify(story),
      });
    }

    const saved = loadPreviewStories().filter(
      (entry) => !INITIAL_STORIES.some((initial) => initial.id === entry.id)
    );
    const updated = [story, ...saved];
    window.localStorage.setItem(PREVIEW_STORIES_KEY, JSON.stringify(updated));
    return story;
  },
};
