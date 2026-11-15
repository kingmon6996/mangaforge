export default function HelpPage() {
  const guides = [
    {
      title: '01. Panel Grid & Reading Order',
      body: 'Use the Studio Editor bottom bar to toggle Right-to-Left (RTL) Japanese manga pacing or Left-to-Right (LTR) global publishing layouts.',
    },
    {
      title: '02. Locking Character Consistency',
      body: 'Create a detailed turnaround sheet in the Characters tab before launching multi-page generation so hairstyles, scars, and outfits stay consistent.',
    },
    {
      title: '03. Speech Bubble Lettering',
      body: 'Switch between Speech, Shout, Thought, and Narration styles in the Properties Panel, and drag tail directions to anchor dialogue cleanly.',
    },
    {
      title: '04. Press-Ready Exports',
      body: 'Choose 300 DPI or 600 DPI Grayscale PDF in the Export Center when preparing B5 Tankobon or A4 print proofs.',
    },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="pb-5 border-b-2 border-[#222222]">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#E63946] mb-1">
          Documentation
        </p>
        <h1 className="font-display text-3xl font-extrabold text-[#171717]">Help & Studio Guide</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {guides.map((g) => (
          <article key={g.title} className="bg-white border-2 border-[#222222] p-5 manga-panel-shadow-sm">
            <h2 className="font-display text-base font-bold text-[#171717] mb-2">{g.title}</h2>
            <p className="text-sm text-[#525252] leading-relaxed">{g.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
