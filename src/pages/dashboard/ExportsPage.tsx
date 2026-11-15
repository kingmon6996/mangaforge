import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { useStudioData } from '../../store/StudioDataContext';
import type { ExportFormat, ExportJob } from '../../types/manga';
import { formatExportEstimate } from '../../utils/editorLogic';

export default function ExportsPage() {
  const { projects, exports: exportJobs, startExportJob } = useStudioData();
  const navigate = useNavigate();

  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [format, setFormat] = useState<ExportFormat>('PDF');
  const [resolution, setResolution] = useState<ExportJob['resolution']>('300 DPI');
  const [pageSize, setPageSize] = useState<ExportJob['pageSize']>('B5 Manga');
  const [scope, setScope] = useState<ExportJob['scope']>('Complete Chapter');
  const [quality, setQuality] = useState<ExportJob['quality']>('Print Master');
  const [includeDialogue, setIncludeDialogue] = useState(true);
  const [colorMode, setColorMode] = useState<ExportJob['colorMode']>('Grayscale');
  const [submitting, setSubmitting] = useState(false);

  const selectedProject = projects.find((p) => p.id === projectId) || projects[0];
  const estimatedSize = formatExportEstimate(
    scope === 'Single Page' ? 1 : Math.max(1, selectedProject?.pages.length || 2),
    resolution,
    format
  );

  const handleExport = async (simulateFailure = false) => {
    if (!selectedProject) return;
    setSubmitting(true);
    try {
      await startExportJob(
        {
          projectId: selectedProject.id,
          projectTitle: selectedProject.title,
          format,
          resolution,
          pageSize,
          scope,
          quality,
          includeDialogue,
          colorMode,
        },
        simulateFailure
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b-2 border-[#222222]">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-1">
          Press & Digital Delivery
        </p>
        <h1 className="font-display text-3xl font-extrabold text-[#171717]">Export Center</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Export Settings Form */}
        <div className="lg:col-span-5 bg-white border-2 border-[#222222] p-6 manga-panel-shadow space-y-4">
          <h2 className="font-display text-lg font-bold text-[#171717] pb-3 border-b border-[#222222]/15">
            Render Configuration
          </h2>

          {projects.length === 0 ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-[#525252]">Create a manga project before exporting.</p>
              <button
                type="button"
                onClick={() => navigate('/dashboard/create')}
                className="px-4 py-2 bg-[#E63946] text-white text-xs font-bold border-2 border-[#222222] cursor-pointer"
              >
                Create Manga
              </button>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="exp-project" className="block text-xs font-bold uppercase mb-1.5">
                  Manga Project
                </label>
                <select
                  id="exp-project"
                  value={selectedProject?.id || ''}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F6] border-2 border-[#222222] text-sm font-semibold"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.pages.length} pages)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-bold uppercase mb-1.5">Format</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['PDF', 'PNG', 'JPEG'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormat(fmt)}
                      className={`py-2 text-xs font-mono font-bold border-2 border-[#222222] cursor-pointer ${
                        format === fmt ? 'bg-[#171717] text-white' : 'bg-[#FAF9F6]'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="exp-res" className="block text-xs font-bold uppercase mb-1.5">
                    Resolution
                  </label>
                  <select
                    id="exp-res"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as ExportJob['resolution'])}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border-2 border-[#222222] text-xs font-bold"
                  >
                    <option value="150 DPI">150 DPI (Web)</option>
                    <option value="300 DPI">300 DPI (Standard Print)</option>
                    <option value="600 DPI">600 DPI (Press Master)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="exp-size" className="block text-xs font-bold uppercase mb-1.5">
                    Page Size
                  </label>
                  <select
                    id="exp-size"
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as ExportJob['pageSize'])}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border-2 border-[#222222] text-xs font-bold"
                  >
                    <option value="B5 Manga">B5 Manga</option>
                    <option value="A4 Editorial">A4 Editorial</option>
                    <option value="US Tankobon">US Tankobon</option>
                    <option value="Webtoon Vertical">Webtoon Vertical</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="exp-scope" className="block text-xs font-bold uppercase mb-1.5">
                    Scope
                  </label>
                  <select
                    id="exp-scope"
                    value={scope}
                    onChange={(e) => setScope(e.target.value as ExportJob['scope'])}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border-2 border-[#222222] text-xs font-bold"
                  >
                    <option value="Single Page">Single Page</option>
                    <option value="Complete Chapter">Complete Chapter</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="exp-color" className="block text-xs font-bold uppercase mb-1.5">
                    Color Mode
                  </label>
                  <select
                    id="exp-color"
                    value={colorMode}
                    onChange={(e) => setColorMode(e.target.value as ExportJob['colorMode'])}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border-2 border-[#222222] text-xs font-bold"
                  >
                    <option value="Grayscale">Grayscale Ink</option>
                    <option value="Color">Full Color</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="exp-quality" className="block text-xs font-bold uppercase mb-1.5">
                    Export Quality
                  </label>
                  <select
                    id="exp-quality"
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as ExportJob['quality'])}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border-2 border-[#222222] text-xs font-bold"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Print Master">Print Master</option>
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDialogue}
                      onChange={(e) => setIncludeDialogue(e.target.checked)}
                      className="w-4 h-4 accent-[#E63946]"
                    />
                    <span>Include dialogue</span>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-[#F1EFEA] border border-[#222222] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#525252]">Estimated Package Size</span>
                <span className="font-mono font-bold text-[#171717] tabular-nums">
                  {estimatedSize}
                </span>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleExport(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#E63946] text-white text-sm font-bold border-2 border-[#222222] manga-panel-shadow-sm hover:bg-[#171717] transition-colors disabled:opacity-60 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Queueing Render...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Start Export Render</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Export Queue & History */}
        <div className="lg:col-span-7 bg-white border-2 border-[#222222] p-6 manga-panel-shadow">
          <h2 className="font-display text-lg font-bold text-[#171717] pb-3 mb-4 border-b border-[#222222]/15">
            Render Queue & Downloads
          </h2>

          {exportJobs.length === 0 ? (
            <p className="text-sm text-[#737373] py-8 text-center">
              No export renders triggered yet.
            </p>
          ) : (
            <div className="space-y-3">
              {exportJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 border-2 border-[#222222] bg-[#FAF9F6] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {job.status === 'Completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                      ) : job.status === 'Failed' ? (
                        <AlertCircle className="w-4 h-4 text-[#E63946] shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-[#E63946] animate-spin shrink-0" />
                      )}
                      <h3 className="font-display font-bold text-sm text-[#171717] truncate">
                        {job.projectTitle}
                      </h3>
                    </div>
                    <p className="font-mono text-xs text-[#525252] mt-1 tabular-nums">
                      {job.format} · {job.resolution} · {job.pageSize} · {job.colorMode} ·{' '}
                      {job.includeDialogue ? 'With Dialogue' : 'Clean Art'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-bold tabular-nums">
                      {job.status === 'Rendering' ? `${job.progress}%` : job.status}
                    </span>
                    {job.status === 'Completed' && job.downloadUrl && (
                      <a
                        href={job.downloadUrl}
                        download={job.downloadFilename}
                        className="px-3 py-1.5 bg-[#171717] text-white text-xs font-bold border border-[#222222] hover:bg-[#E63946] cursor-pointer"
                      >
                        Download
                      </a>
                    )}
                    {job.status === 'Completed' && !job.downloadUrl && (
                      <span className="text-[11px] text-[#737373]">Preview only</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
