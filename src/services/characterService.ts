import { API_ENDPOINTS, IS_PREVIEW_MODE } from '../config/api';
import type { Character } from '../types/manga';
import { apiRequest } from './apiClient';
import { INITIAL_CHARACTERS } from './mockData';

const STORAGE_KEY = 'mangaforge_preview_characters';

function loadPreviewCharacters(): Character[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Character[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback
  }
  return INITIAL_CHARACTERS;
}

function savePreviewCharacters(characters: Character[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  } catch {
    // Ignore
  }
}

export const characterService = {
  async list(): Promise<Character[]> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<Character[]>(API_ENDPOINTS.characters.list);
    }
    return loadPreviewCharacters();
  },

  async create(character: Character): Promise<Character> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<Character>(API_ENDPOINTS.characters.list, {
        method: 'POST',
        body: JSON.stringify(character),
      });
    }
    const existing = loadPreviewCharacters();
    savePreviewCharacters([character, ...existing]);
    return character;
  },

  async update(character: Character): Promise<Character> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<Character>(API_ENDPOINTS.characters.detail(character.id), {
        method: 'PATCH',
        body: JSON.stringify(character),
      });
    }
    const existing = loadPreviewCharacters();
    savePreviewCharacters(existing.map((c) => (c.id === character.id ? character : c)));
    return character;
  },

  async remove(id: string): Promise<void> {
    if (!IS_PREVIEW_MODE) {
      await apiRequest<void>(API_ENDPOINTS.characters.detail(id), { method: 'DELETE' });
      return;
    }
    const existing = loadPreviewCharacters();
    savePreviewCharacters(existing.filter((c) => c.id !== id));
  },
};
