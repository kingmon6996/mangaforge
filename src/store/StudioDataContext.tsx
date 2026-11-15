import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { IS_PREVIEW_MODE } from '../config/api';
import { assetService } from '../services/assetService';
import { characterService } from '../services/characterService';
import { exportService } from '../services/exportService';
import { projectService } from '../services/projectService';
import { useAuth } from './AuthContext';
import type {
  AssetItem,
  Character,
  ExportJob,
  MangaProject,
  StoryEntry,
  StudioTemplate,
} from '../types/manga';

interface StudioDataContextValue {
  projects: MangaProject[];
  characters: Character[];
  stories: StoryEntry[];
  templates: StudioTemplate[];
  assets: AssetItem[];
  exports: ExportJob[];
  isLoading: boolean;
  error: string | null;
  reloadAll: () => Promise<void>;
  addProject: (project: MangaProject) => Promise<void>;
  updateProject: (project: MangaProject) => Promise<void>;
  duplicateProject: (id: string) => Promise<MangaProject>;
  deleteProject: (id: string) => Promise<void>;
  addCharacter: (character: Character) => Promise<void>;
  updateCharacter: (character: Character) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  addStory: (story: StoryEntry) => Promise<void>;
  uploadAsset: (file: File) => Promise<AssetItem>;
  startExportJob: (
    input: Omit<ExportJob, 'id' | 'status' | 'progress' | 'createdAt' | 'downloadFilename'>,
    simulateFailure?: boolean
  ) => Promise<ExportJob>;
}

const StudioDataContext = createContext<StudioDataContextValue | undefined>(undefined);

export function StudioDataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<MangaProject[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [stories, setStories] = useState<StoryEntry[]>([]);
  const [templates, setTemplates] = useState<StudioTemplate[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [exports, setExports] = useState<ExportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projList, charList, storyList, tplList, astList, expList] = await Promise.all([
        projectService.list(),
        characterService.list(),
        assetService.listStories(),
        assetService.listTemplates(),
        assetService.listAssets(),
        exportService.list(),
      ]);
      setProjects(projList);
      setCharacters(charList);
      setStories(storyList);
      setTemplates(tplList);
      setAssets(astList);
      setExports(expList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load studio workspace data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setProjects([]);
      setCharacters([]);
      setStories([]);
      setTemplates([]);
      setAssets([]);
      setExports([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    void reloadAll();
  }, [isAuthenticated, reloadAll]);

  const addProject = useCallback(async (project: MangaProject) => {
    const saved = await projectService.create(project);
    setProjects((prev) => [saved, ...prev]);
  }, []);

  const updateProject = useCallback(async (project: MangaProject) => {
    const saved = await projectService.update(project);
    setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
  }, []);

  const duplicateProject = useCallback(async (id: string) => {
    const copy = await projectService.duplicate(id);
    setProjects((prev) => [copy, ...prev]);
    return copy;
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await projectService.remove(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addCharacter = useCallback(async (character: Character) => {
    const saved = await characterService.create(character);
    setCharacters((prev) => [saved, ...prev]);
  }, []);

  const updateCharacter = useCallback(async (character: Character) => {
    const saved = await characterService.update(character);
    setCharacters((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
  }, []);

  const deleteCharacter = useCallback(async (id: string) => {
    await characterService.remove(id);
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addStory = useCallback(async (story: StoryEntry) => {
    const saved = await assetService.createStory(story);
    setStories((prev) => [saved, ...prev]);
  }, []);

  const uploadAsset = useCallback(async (file: File) => {
    const uploaded = await assetService.uploadAsset(file);
    setAssets((prev) => [uploaded, ...prev]);
    return uploaded;
  }, []);

  const startExportJob = useCallback(
    async (
      input: Omit<ExportJob, 'id' | 'status' | 'progress' | 'createdAt' | 'downloadFilename'>,
      simulateFailure = false
    ) => {
      const created = await exportService.startExport(input);
      setExports((prev) => [created, ...prev]);

      if (IS_PREVIEW_MODE) {
        setTimeout(async () => {
          try {
            const finished = await exportService.completePreviewExport(created.id, simulateFailure);
            setExports((prev) => prev.map((e) => (e.id === finished.id ? finished : e)));
          } catch {
            // Ignore if unmounted
          }
        }, 1200);
      }

      return created;
    },
    []
  );

  return (
    <StudioDataContext.Provider
      value={{
        projects,
        characters,
        stories,
        templates,
        assets,
        exports,
        isLoading,
        error,
        reloadAll,
        addProject,
        updateProject,
        duplicateProject,
        deleteProject,
        addCharacter,
        updateCharacter,
        deleteCharacter,
        addStory,
        uploadAsset,
        startExportJob,
      }}
    >
      {children}
    </StudioDataContext.Provider>
  );
}

export function useStudioData(): StudioDataContextValue {
  const ctx = useContext(StudioDataContext);
  if (!ctx) throw new Error('useStudioData must be used inside StudioDataProvider');
  return ctx;
}
