import { useNavigate } from 'react-router-dom';
import { LayoutTemplate } from 'lucide-react';
import { useStudioData } from '../../store/StudioDataContext';

export default function TemplatesPage() {
  const { templates, projects } = useStudioData();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b-2 border-[#222222]">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-1">
          Page Grid Presets
        </p>
        <h1 className="font-display text-3xl font-extrabold text-[#171717]">Manga Page Templates</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <article
            key={tpl.id}
            className="bg-white border-2 border-[#222222] p-5 manga-panel-shadow flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-[#737373] mb-3">
                <span className="font-bold text-[#E63946]">{tpl.category}</span>
                <span className="tabular-nums">{tpl.panelCount} panels</span>
              </div>

              {/* Wireframe Preview */}
              <div className="h-44 border-2 border-[#222222] bg-[#FAF9F6] p-2.5 grid grid-cols-2 gap-1.5 mb-4">
                {Array.from({ length: tpl.panelCount }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`border border-[#222222] bg-white ${
                      tpl.presetKey === 'splash-focus' && idx === 0
                        ? 'col-span-2 row-span-2'
                        : tpl.presetKey === 'cinematic-widescreen'
                          ? 'col-span-2'
                          : ''
                    }`}
                  />
                ))}
              </div>

              <h2 className="font-display text-lg font-bold text-[#171717]">{tpl.name}</h2>
              <p className="text-xs text-[#525252] mt-1 leading-relaxed">{tpl.description}</p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(projects[0] ? `/studio/${projects[0].id}?preset=${tpl.presetKey}` : '/dashboard/create')
              }
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#171717] text-white text-xs font-bold border-2 border-[#222222] hover:bg-[#E63946] transition-colors cursor-pointer"
            >
              <LayoutTemplate className="w-4 h-4" />
              <span>Open in Studio</span>
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
