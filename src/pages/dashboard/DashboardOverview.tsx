import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Download,
  FolderPlus,
  PenTool,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useStudioData } from '../../store/StudioDataContext';
import { MangaImage } from '../../components/manga/MangaDecorations';

export default function DashboardOverview() {
  const { user } = useAuth();
  const { projects, characters, exports: exportJobs, isLoading } = useStudioData();
  const navigate = useNavigate();

  const totalPages = projects.reduce((sum, p) => sum + p.pages.length, 0);

  const stats = [
    { label: 'Total Manga Projects', value: projects.length, detail: 'Active series & drafts' },
    { label: 'Total Pages Created', value: totalPages, detail: 'Across all chapters' },
    { label: 'Saved Characters', value: characters.length, detail: 'Locked turnaround sheets' },
    { label: 'Recent Exports', value: exportJobs.length, detail: 'PDF & PNG renders' },
  ];

  const shortcuts = [
    {
      title: 'Create New Manga',
      description: 'Launch the 5-step AI story-to-panel generator.',
      to: '/dashboard/create',
      icon: Sparkles,
      accent: 'bg-[#E63946] text-white',
    },
    {
      title: 'Open Panel Studio',
      description: 'Jump directly into the interactive manga canvas editor.',
      to: projects[0] ? `/studio/${projects[0].id}` : '/dashboard/projects',
      icon: PenTool,
      accent: 'bg-[#171717] text-white',
    },
    {
      title: 'New Character Sheet',
      description: 'Define visual consistency traits and expressions.',
      to: '/dashboard/characters',
      icon: UserPlus,
      accent: 'bg-white text-[#171717]',
    },
    {
      title: 'Export Chapter Pack',
      description: 'Configure 300–600 DPI grayscale or color press outputs.',
      to: '/dashboard/exports',
      icon: Download,
      accent: 'bg-white text-[#171717]',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-[#222222]">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-1.5">
            Production Workspace
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#171717]">
            Welcome back, Creator.
          </h1>
          <p className="text-sm text-[#525252] mt-1">
            Signed in as {user?.email || 'creator@mangaforge.jp'} · {user?.plan || 'Creator'} Plan
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard/create')}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#171717] text-white text-sm font-bold border-2 border-[#222222] manga-panel-shadow hover:bg-[#E63946] transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Manga Project</span>
        </button>
      </div>

      {/* KPI Metrics Row */}
      <section aria-label="Studio Metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border-2 border-[#222222] p-5 manga-panel-shadow-sm"
          >
            <p className="text-xs font-semibold text-[#737373]">{stat.label}</p>
            <p className="font-display text-3xl font-extrabold text-[#171717] mt-2 tabular-nums">
              {isLoading ? '—' : stat.value}
            </p>
            <p className="text-xs text-[#525252] mt-1">{stat.detail}</p>
          </div>
        ))}
      </section>

      {/* Quick Creation Shortcuts */}
      <section>
        <h2 className="font-display text-lg font-bold text-[#171717] mb-4">
          Quick Creation Shortcuts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.to}
                className="bg-white border-2 border-[#222222] p-5 manga-panel-shadow-sm manga-card-interactive flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-9 h-9 border-2 border-[#222222] flex items-center justify-center ${item.accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#737373]" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-[#171717]">{item.title}</h3>
                  <p className="text-xs text-[#525252] mt-1 leading-relaxed">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Projects + Recent Exports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Projects */}
        <section className="lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-[#171717]">Recent Manga Projects</h2>
            <Link
              to="/dashboard/projects"
              className="text-xs font-bold text-[#E63946] hover:underline"
            >
              View All Projects
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-64 bg-[#EAE7E0] border-2 border-[#222222] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((proj) => (
                <article
                  key={proj.id}
                  className="bg-white border-2 border-[#222222] manga-panel-shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[16/10] border-b-2 border-[#222222] overflow-hidden bg-[#F1EFEA]">
                      <MangaImage
                        src={proj.coverImageUrl}
                        alt={proj.title}
                        fallbackTitle={proj.title}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#737373]">
                        <span className="text-[#E63946] font-bold">{proj.genre}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{proj.pages.length} pages</span>
                        <span aria-hidden="true">·</span>
                        <span>{proj.status}</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-[#171717] mt-1 truncate">
                        {proj.title}
                      </h3>
                    </div>
                  </div>
                  <div className="px-4 pb-4 flex items-center justify-between gap-2">
                    <Link
                      to={`/studio/${proj.id}`}
                      className="flex-1 text-center px-3 py-2 bg-[#171717] text-white text-xs font-bold border border-[#222222] hover:bg-[#E63946] transition-colors"
                    >
                      Open in Studio
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Saved Characters & Recent Exports */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white border-2 border-[#222222] p-5 manga-panel-shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#222222]/15">
              <h2 className="font-display text-base font-bold text-[#171717]">Saved Characters</h2>
              <Link to="/dashboard/characters" className="text-xs font-bold text-[#E63946] hover:underline">
                Manage
              </Link>
            </div>
            <div className="space-y-3">
              {characters.slice(0, 3).map((char) => (
                <div key={char.id} className="flex items-center gap-3">
                  <div className="w-11 h-11 shrink-0 border-2 border-[#222222] overflow-hidden bg-[#F1EFEA]">
                    <MangaImage
                      src={char.referenceImageUrl}
                      alt={char.name}
                      fallbackTitle={char.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#171717] truncate">{char.name}</p>
                    <p className="text-xs text-[#737373] truncate">{char.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border-2 border-[#222222] p-5 manga-panel-shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#222222]/15">
              <h2 className="font-display text-base font-bold text-[#171717]">Recent Exports</h2>
              <Link to="/dashboard/exports" className="text-xs font-bold text-[#E63946] hover:underline">
                Export Center
              </Link>
            </div>
            {exportJobs.length === 0 ? (
              <p className="text-xs text-[#737373]">No exports queued yet.</p>
            ) : (
              <div className="space-y-2.5">
                {exportJobs.slice(0, 3).map((job) => (
                  <div
                    key={job.id}
                    className="p-2.5 bg-[#FAF9F6] border border-[#222222]/25 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#171717] truncate">{job.projectTitle}</p>
                      <p className="font-mono text-[11px] text-[#737373]">
                        {job.format} · {job.resolution}
                      </p>
                    </div>
                    <BookOpen className="w-3.5 h-3.5 text-[#E63946] shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
