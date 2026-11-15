import { useState } from 'react';
import { API_BASE_URL, IS_PREVIEW_MODE } from '../../config/api';
import { useAuth } from '../../store/AuthContext';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [defaultReadingDir, setDefaultReadingDir] = useState<'rtl' | 'ltr'>('rtl');
  const [defaultDpi, setDefaultDpi] = useState<'300 DPI' | '600 DPI'>('300 DPI');
  const [savedBanner, setSavedBanner] = useState(false);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="pb-5 border-b-2 border-[#222222]">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-1">
          Workspace Preferences
        </p>
        <h1 className="font-display text-3xl font-extrabold text-[#171717]">Settings</h1>
      </div>

      <div className="bg-white border-2 border-[#222222] p-6 manga-panel-shadow space-y-5">
        <h2 className="font-display text-lg font-bold text-[#171717]">Creator Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3.5 bg-[#FAF9F6] border border-[#222222]/30">
            <span className="text-xs text-[#737373] block">Verified Email</span>
            <span className="font-bold text-[#171717]">{user?.email}</span>
          </div>
          <div className="p-3.5 bg-[#FAF9F6] border border-[#222222]/30">
            <span className="text-xs text-[#737373] block">Active Plan</span>
            <span className="font-bold text-[#171717]">{user?.plan} Tier</span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#222222]/15 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#171717]">Default Canvas Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="set-dir" className="block text-xs font-bold uppercase mb-1.5">
                Default Reading Order
              </label>
              <select
                id="set-dir"
                value={defaultReadingDir}
                onChange={(e) => setDefaultReadingDir(e.target.value as 'rtl' | 'ltr')}
                className="w-full px-3 py-2 bg-[#FAF9F6] border-2 border-[#222222] text-sm font-semibold"
              >
                <option value="rtl">Right-to-Left (Traditional Japanese)</option>
                <option value="ltr">Left-to-Right (Western / Global)</option>
              </select>
            </div>
            <div>
              <label htmlFor="set-dpi" className="block text-xs font-bold uppercase mb-1.5">
                Default Export DPI
              </label>
              <select
                id="set-dpi"
                value={defaultDpi}
                onChange={(e) => setDefaultDpi(e.target.value as '300 DPI' | '600 DPI')}
                className="w-full px-3 py-2 bg-[#FAF9F6] border-2 border-[#222222] text-sm font-semibold"
              >
                <option value="300 DPI">300 DPI (Standard Print)</option>
                <option value="600 DPI">600 DPI (Press Master)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                setSavedBanner(true);
                setTimeout(() => setSavedBanner(false), 2500);
              }}
              className="px-4 py-2 bg-[#171717] text-white text-xs font-bold border-2 border-[#222222] hover:bg-[#E63946] cursor-pointer"
            >
              Save Preferences
            </button>
            {savedBanner && (
              <span className="text-xs font-bold text-[#16A34A]">Preferences updated.</span>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-[#222222]/15">
          <h2 className="font-display text-sm font-bold text-[#171717] mb-1">
            Backend API Integration
          </h2>
          <p className="font-mono text-xs text-[#525252]">
            Mode: {IS_PREVIEW_MODE ? 'Preview (Local Storage)' : `Production (${API_BASE_URL})`}
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-4 px-4 py-2 border-2 border-[#E63946] text-[#E63946] text-xs font-bold hover:bg-[#E63946] hover:text-white transition-colors cursor-pointer"
          >
            Sign Out of Studio
          </button>
        </div>
      </div>
    </div>
  );
}
