const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export const API_BASE_URL = (viteEnv.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const API_MODE: 'preview' | 'production' =
  viteEnv.VITE_API_MODE === 'production' || Boolean(API_BASE_URL) ? 'production' : 'preview';

export const IS_PREVIEW_MODE = API_MODE === 'preview' && !API_BASE_URL;

export const API_ENDPOINTS = {
  auth: {
    signup: '/auth/signup',
    loginOtp: '/auth/login/otp',
    verifyOtp: '/auth/verify-otp',
    forgotPassword: '/auth/forgot-password',
    verifyResetOtp: '/auth/verify-reset-otp',
    resetPassword: '/auth/reset-password',
    me: '/auth/me',
    logout: '/auth/logout',
  },
  projects: {
    list: '/projects',
    detail: (id: string) => `/projects/${id}`,
    duplicate: (id: string) => `/projects/${id}/duplicate`,
  },
  characters: {
    list: '/characters',
    detail: (id: string) => `/characters/${id}`,
  },
  generation: {
    createProject: '/generation/manga',
    aiEdit: '/generation/editor-action',
  },
  assets: {
    list: '/assets',
    templates: '/templates',
  },
  stories: {
    list: '/stories',
  },
  exports: {
    list: '/exports',
    create: '/exports',
    status: (id: string) => `/exports/${id}`,
  },
} as const;
