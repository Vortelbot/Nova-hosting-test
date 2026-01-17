
import React from 'react';

const DeploymentGuide: React.FC = () => {
  const steps = [
    {
      title: 'Option A: Vercel (Recommended)',
      description: 'The easiest way to host this panel. Vite project with custom build output.',
      commands: [
        'npm install -g vercel',
        'vercel'
      ],
      note: 'CRITICAL: Change "Output Directory" in Vercel settings to "build" (NOT "dist")!'
    },
    {
      title: 'Option B: Self-Hosted (VPS)',
      description: 'Host it on your own Linux server using Nginx.',
      commands: [
        'git clone https://your-repo/novahost.git',
        'cd novahost',
        'npm install',
        'npm run build',
        'sudo cp -r build/* /var/www/html/'
      ],
      note: 'Ensure your Nginx config points to the /build folder.'
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4">
        <h1 className="text-5xl font-black text-white tracking-tighter">Cloud Deployment Center</h1>
        <p className="text-zinc-600 text-[12px] uppercase font-black tracking-[0.6em] flex items-center gap-4">
          <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]"></span>
          Ready for Production Output
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {steps.map((step, idx) => (
          <div key={idx} className="glass rounded-[3rem] p-12 border border-white/5 space-y-8 flex flex-col h-full">
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-white tracking-tight">{step.title}</h2>
              <p className="text-zinc-500 text-sm leading-relaxed">{step.description}</p>
            </div>

            <div className="flex-1 space-y-4">
               <div className="bg-black/80 rounded-2xl p-6 border-2 border-zinc-900 font-mono text-xs overflow-x-auto">
                  {step.commands.map((cmd, cIdx) => (
                    <div key={cIdx} className="flex gap-4 mb-2 last:mb-0">
                      <span className="text-zinc-800 select-none">$</span>
                      <span className="text-blue-400">{cmd}</span>
                    </div>
                  ))}
               </div>
               <div className="flex gap-3 items-center p-4 bg-orange-600/10 rounded-xl border border-orange-500/20">
                  <svg className="w-5 h-5 text-orange-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest">{step.note}</p>
               </div>
            </div>

            <button className="w-full py-4 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95">
               Copy Command Sequence
            </button>
          </div>
        ))}
      </div>

      <div className="glass rounded-[3rem] p-12 border border-white/5">
        <h3 className="text-xl font-black text-white mb-6 tracking-tight">Deployment Steps for Vercel</h3>
        <div className="space-y-6 text-sm text-zinc-400">
           <p className="flex items-start gap-4"><span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black shrink-0">1</span> Import your repository to Vercel dashboard.</p>
           <p className="flex items-start gap-4"><span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black shrink-0">2</span> Open "Build and Output Settings".</p>
           <p className="flex items-start gap-4"><span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black shrink-0">3</span> Under <b>Output Directory</b>, toggle "Override" and type <b>build</b> (it defaults to dist).</p>
           <p className="flex items-start gap-4"><span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black shrink-0">4</span> Add your <b>API_KEY</b> to Environment Variables.</p>
           <p className="flex items-start gap-4"><span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black shrink-0">5</span> Click "Deploy".</p>
        </div>
      </div>
    </div>
  );
};

export default DeploymentGuide;
