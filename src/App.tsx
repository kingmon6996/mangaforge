import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { MangaPreloader } from './components/manga/MangaPreloader';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ProtectedRoute } from './components/ui/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LandingPage from './pages/LandingPage';
import StudioEditorPage from './pages/StudioEditorPage';
import AssetsPage from './pages/dashboard/AssetsPage';
import CharactersPage from './pages/dashboard/CharactersPage';
import CreateMangaPage from './pages/dashboard/CreateMangaPage';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import ExportsPage from './pages/dashboard/ExportsPage';
import HelpPage from './pages/dashboard/HelpPage';
import ProjectsPage from './pages/dashboard/ProjectsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import StoryLibraryPage from './pages/dashboard/StoryLibraryPage';
import TemplatesPage from './pages/dashboard/TemplatesPage';
import { AuthProvider } from './store/AuthContext';
import { StudioDataProvider } from './store/StudioDataContext';

export default function App() {
  const [showPreloader, setShowPreloader] = useState(
    () => typeof window !== 'undefined' && window.location.pathname === '/'
  );

  return (
    <ErrorBoundary>
      <AuthProvider>
        <StudioDataProvider>
          {showPreloader && <MangaPreloader onComplete={() => setShowPreloader(false)} />}
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<AuthPage mode="signup" />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardOverview />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="create" element={<CreateMangaPage />} />
                <Route path="characters" element={<CharactersPage />} />
                <Route path="stories" element={<StoryLibraryPage />} />
                <Route path="templates" element={<TemplatesPage />} />
                <Route path="assets" element={<AssetsPage />} />
                <Route path="exports" element={<ExportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="help" element={<HelpPage />} />
              </Route>

              <Route
                path="/studio/:projectId"
                element={
                  <ProtectedRoute>
                    <StudioEditorPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </StudioDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
