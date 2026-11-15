import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { IS_PREVIEW_MODE } from '../../config/api';
import { useAuth } from '../../store/AuthContext';
import { MangaLogo } from '../manga/MangaLogo';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, enterPreviewSession } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && IS_PREVIEW_MODE) {
      enterPreviewSession();
    }
  }, [isLoading, isAuthenticated, enterPreviewSession]);

  if (isLoading || (!isAuthenticated && IS_PREVIEW_MODE)) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center gap-4">
        <MangaLogo size={38} />
        <p className="text-sm text-[#737373]">
          {isLoading ? 'Verifying creator session...' : 'Loading MangaForge preview studio...'}
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
