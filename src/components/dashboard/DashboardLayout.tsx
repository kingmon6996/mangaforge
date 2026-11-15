import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  Download,
  FolderKanban,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useStudioData } from '../../store/StudioDataContext';
import { MangaLogo } from '../manga/MangaLogo';

const SIDEBAR_ITEMS = [
  { label: 'Dashboard Overview', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'My Projects', to: '/dashboard/projects', icon: FolderKanban },
  { label: 'Create New Manga', to: '/dashboard/create', icon: Sparkles },
  { label: 'Characters', to: '/dashboard/characters', icon: Users },
  { label: 'Story Library', to: '/dashboard/stories', icon: BookOpen },
  { label: 'Templates', to: '/dashboard/templates', icon: LayoutTemplate },
  { label: 'Assets', to: '/dashboard/assets', icon: ImageIcon },
  { label: 'Exports', to: '/dashboard/exports', icon: Download },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings },
  { label: 'Help & Support', to: '/dashboard/help', icon: HelpCircle },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { projects, exports: exportJobs } = useStudioData();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchMatches = searchQuery.trim()
    ? projects.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/', { replace: true });
  };

  const usagePercent = user
    ? Math.min(100, Math.round((user.monthlyPagesUsed / user.monthlyPagesLimit) * 100))
    : 26;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#171717] flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[256px] shrink-0 bg-[#F1EFEA] border-r-2 border-[#222222] flex flex-col justify-between transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col min-h-0 flex-1">
          <div className="h-16 px-5 border-b-2 border-[#222222] bg-white flex items-center justify-between">
            <Link to="/" aria-label="MangaForge Home">
              <MangaLogo size={28} />
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 border border-[#222222] bg-white"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto studio-scroll p-3 space-y-1" aria-label="Studio Navigation">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold border-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-[#171717] text-white border-[#222222] manga-panel-shadow-sm'
                        : 'bg-transparent text-[#171717] border-transparent hover:bg-white hover:border-[#222222]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t-2 border-[#222222] bg-white">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span>Monthly Pages</span>
            <span className="font-mono tabular-nums">
              {user?.monthlyPagesUsed ?? 42} / {user?.monthlyPagesLimit ?? 160}
            </span>
          </div>
          <div className="h-2 bg-[#EAE7E0] border border-[#222222] overflow-hidden">
            <div className="h-full bg-[#E63946]" style={{ width: `${usagePercent}%` }} />
          </div>
          <p className="text-[11px] text-[#737373] mt-1.5">{user?.plan ?? 'Creator'} Workspace</p>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Studio Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b-2 border-[#222222] px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 border-2 border-[#222222] bg-[#FAF9F6]"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Project Search */}
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
              <label htmlFor="studio-project-search" className="sr-only">
                Search manga projects
              </label>
              <input
                id="studio-project-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search manga projects..."
                className="w-full pl-9 pr-3 py-2 bg-[#FAF9F6] border-2 border-[#222222] text-sm text-[#171717] focus:outline-none focus:border-[#E63946]"
              />
              {searchMatches.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-[#222222] manga-panel-shadow z-40 max-h-60 overflow-y-auto">
                  {searchMatches.map((proj) => (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        navigate(`/studio/${proj.id}`);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-[#F1EFEA] flex items-center justify-between border-b border-[#222222]/10 last:border-b-0 cursor-pointer"
                    >
                      <span className="font-semibold text-[#171717] truncate">{proj.title}</span>
                      <span className="font-mono text-xs text-[#E63946] shrink-0">{proj.genre}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((p) => !p);
                  setProfileOpen(false);
                }}
                aria-label="Notifications"
                aria-expanded={notifOpen}
                className="p-2 border-2 border-[#222222] bg-[#FAF9F6] hover:bg-[#EAE7E0] cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border-2 border-[#222222] manga-panel-shadow p-3 z-40">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222222]/15">
                    <span className="font-display text-xs font-bold uppercase tracking-wider">
                      Studio Updates
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-[#737373] hover:text-[#171717]"
                    >
                      Close
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    {exportJobs.slice(0, 2).map((job) => (
                      <div key={job.id} className="p-2 bg-[#FAF9F6] border border-[#222222]/20">
                        <p className="font-bold text-[#171717] truncate">{job.projectTitle}</p>
                        <p className="text-[#525252] mt-0.5">
                          {job.format} ({job.resolution}) — {job.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((p) => !p);
                  setNotifOpen(false);
                }}
                aria-label="Account menu"
                aria-expanded={profileOpen}
                className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-[#222222] bg-[#FAF9F6] hover:bg-[#EAE7E0] text-xs font-bold cursor-pointer"
              >
                <span className="w-5 h-5 bg-[#171717] text-white flex items-center justify-center font-mono text-[11px]">
                  {(user?.name || 'C').charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline max-w-[110px] truncate">
                  {user?.name || 'Creator'}
                </span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white border-2 border-[#222222] manga-panel-shadow p-3 z-40">
                  <div className="pb-2 mb-2 border-b border-[#222222]/15">
                    <p className="text-sm font-bold text-[#171717] truncate">{user?.name}</p>
                    <p className="text-xs text-[#737373] truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setProfileOpen(false)}
                    className="block px-2.5 py-2 text-xs font-semibold hover:bg-[#F1EFEA]"
                  >
                    Workspace Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-2.5 py-2 text-xs font-bold text-[#E63946] hover:bg-[#F1EFEA] flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Create New CTA */}
            <button
              type="button"
              onClick={() => navigate('/dashboard/create')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#E63946] text-white text-xs font-bold border-2 border-[#222222] manga-panel-shadow-sm hover:bg-[#171717] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create New</span>
            </button>
          </div>
        </header>

        {/* Workspace Page Body */}
        <main className="flex-1 p-5 sm:p-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
