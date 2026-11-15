import { API_ENDPOINTS, IS_PREVIEW_MODE } from '../config/api';
import type { MangaProject } from '../types/manga';
import { apiRequest } from './apiClient';
import { INITIAL_PROJECTS } from './mockData';

const STORAGE_KEY = 'mangaforge_preview_projects';

function loadPreviewProjects(): MangaProject[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MangaProject[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback
  }
  return INITIAL_PROJECTS;
}

function savePreviewProjects(projects: MangaProject[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Ignore storage quota errors
  }
}

export const projectService = {
  async list(): Promise<MangaProject[]> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<MangaProject[]>(API_ENDPOINTS.projects.list);
    }
    return loadPreviewProjects();
  },

  async getById(id: string): Promise<MangaProject | undefined> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<MangaProject>(API_ENDPOINTS.projects.detail(id));
    }
    return loadPreviewProjects().find((p) => p.id === id);
  },

  async create(project: MangaProject): Promise<MangaProject> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<MangaProject>(API_ENDPOINTS.projects.list, {
        method: 'POST',
        body: JSON.stringify(project),
      });
    }
    const existing = loadPreviewProjects();
    const updated = [project, ...existing];
    savePreviewProjects(updated);
    return project;
  },

  async update(project: MangaProject): Promise<MangaProject> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<MangaProject>(API_ENDPOINTS.projects.detail(project.id), {
        method: 'PATCH',
        body: JSON.stringify(project),
      });
    }
    const existing = loadPreviewProjects();
    const updated = existing.map((p) => (p.id === project.id ? project : p));
    savePreviewProjects(updated);
    return project;
  },

  async duplicate(id: string): Promise<MangaProject> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<MangaProject>(API_ENDPOINTS.projects.duplicate(id), {
        method: 'POST',
      });
    }
    const existing = loadPreviewProjects();
    const source = existing.find((p) => p.id === id);
    if (!source) throw new Error('Project not found');
    const copy: MangaProject = {
      ...source,
      id: `proj-${Date.now()}`,
      title: `${source.title} (Copy)`,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    savePreviewProjects([copy, ...existing]);
    return copy;
  },

  async remove(id: string): Promise<void> {
    if (!IS_PREVIEW_MODE) {
      await apiRequest<void>(API_ENDPOINTS.projects.detail(id), { method: 'DELETE' });
      return;
    }
    const existing = loadPreviewProjects();
    savePreviewProjects(existing.filter((p) => p.id !== id));
  },
};
