import { API_ENDPOINTS, IS_PREVIEW_MODE } from '../config/api';
import type { ExportJob } from '../types/manga';
import { apiRequest } from './apiClient';
import { INITIAL_EXPORTS } from './mockData';

const STORAGE_KEY = 'mangaforge_preview_exports';

function loadExports(): ExportJob[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ExportJob[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fallback
  }
  return INITIAL_EXPORTS;
}

function saveExports(jobs: ExportJob[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    // Ignore
  }
}

export const exportService = {
  async list(): Promise<ExportJob[]> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<ExportJob[]>(API_ENDPOINTS.exports.list);
    }
    return loadExports();
  },

  async startExport(
    input: Omit<ExportJob, 'id' | 'status' | 'progress' | 'createdAt' | 'downloadFilename'>
  ): Promise<ExportJob> {
    if (!IS_PREVIEW_MODE) {
      return apiRequest<ExportJob>(API_ENDPOINTS.exports.create, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    }

    const slug = input.projectTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const job: ExportJob = {
      ...input,
      id: `exp-${Date.now()}`,
      status: 'Rendering',
      progress: 18,
      createdAt: new Date().toISOString(),
      downloadFilename: `${slug || 'manga'}-${input.resolution.replace(/\s+/g, '').toLowerCase()}.${input.format.toLowerCase()}`,
    };
    const existing = loadExports();
    saveExports([job, ...existing]);
    return job;
  },

  async completePreviewExport(id: string, simulateFailure = false): Promise<ExportJob> {
    const existing = loadExports();
    const updated = existing.map((j) =>
      j.id === id
        ? {
            ...j,
            status: (simulateFailure ? 'Failed' : 'Completed') as ExportJob['status'],
            progress: simulateFailure ? j.progress : 100,
          }
        : j
    );
    saveExports(updated);
    const found = updated.find((j) => j.id === id);
    if (!found) throw new Error('Export job not found');
    return found;
  },
};
