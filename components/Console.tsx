
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry, BotStatus } from '../types';
import { analyzeLogs } from '../services/geminiService';

interface ConsoleProps {
  logs: LogEntry[];
  botName: string;
  status?: BotStatus;
  onCommand?: (cmd: string) => void;
}

const Console: React.FC<ConsoleProps> = ({ logs, botName, status, onCommand }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      if (onCommand) onCommand(inputValue);
      setInputValue('');
    }
  };

  const handleAIAnalysis = async () => {
    if (logs.length === 0) return;
    setAnalyzing(true);
    const result = await analyzeLogs(logs.slice(-40).map(l => l.message));
    setAnalysisResult(result);
    setAnalyzing(false);
  };

  return (
    <div className="bg-[#020305] border border-white/10 rounded-[2rem] flex flex-col h-[600px] overflow-hidden shadow-2xl relative group">
      <div className="bg-[#080911] px-8 py-5 border-b border-white/5 flex items-center justify-between backdrop-blur-3xl relative z-20">
        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            <div className={`w-3 h-3 rounded-full ${status === BotStatus.RUNNING ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-red-500/40'}`}></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/40"></div>
            <div className="w-3 h-3 rounded-full bg-blue-500/40"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black font-mono text-zinc-500 uppercase tracking-widest">
              Live Terminal <span className="text-zinc-800 mx-2">|</span> container@nova
            </span>
            {status === BotStatus.RUNNING && (
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Gateway: Connected • Latency: 24ms</span>
            )}
          </div>
        </div>
        <button 
          onClick={handleAIAnalysis}
          disabled={analyzing || logs.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-blue-600 hover:text-white disabled:opacity-10 active:scale-95"
        >
          {analyzing ? "Synthesizing Fix..." : "AI Debugger"}
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 p-8 font-mono text-[13px] leading-relaxed overflow-y-auto space-y-1.5 selection:bg-blue-600/40 scroll-smooth relative z-10 custom-scrollbar bg-black/40"
      >
        {logs.map((log, idx) => (
          <div key={idx} className="flex gap-4 group/line animate-in fade-in slide-in-from-left-1 duration-200">
            <span className="text-zinc-800 shrink-0 select-none font-bold">[{log.timestamp}]</span>
            <span className={`
              ${log.type === 'error' ? 'text-red-400 font-bold' : ''}
              ${log.type === 'warn' ? 'text-yellow-400 font-bold' : ''}
              ${log.type === 'info' ? 'text-zinc-300' : ''}
              ${log.type === 'system' ? 'text-blue-400 font-bold' : ''}
            `}>
              {log.message}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-800 select-none opacity-20">
             <p className="text-[10px] font-black uppercase tracking-[0.8em]">Awaiting Boot Signal</p>
          </div>
        )}
      </div>

      <div className="bg-[#05060a] p-5 px-8 flex items-center gap-4 border-t border-white/5 backdrop-blur-3xl relative z-20">
        <span className="text-zinc-700 font-mono text-sm font-black shrink-0">container@nova:~$</span>
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleCommand}
          placeholder={status === BotStatus.RUNNING ? "Type commands for your bot..." : "Start the bot to use the terminal"} 
          disabled={status === BotStatus.OFFLINE}
          className="bg-transparent border-none outline-none text-sm font-mono flex-1 text-white placeholder:text-zinc-900 tracking-wider disabled:cursor-not-allowed"
        />
      </div>

      {analysisResult && (
        <div className="absolute inset-x-0 bottom-24 mx-8 p-6 bg-blue-600 rounded-2xl shadow-2xl z-[100] animate-in slide-in-from-bottom-5 border border-white/20">
           <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">AI Neural Analysis</h4>
              <button onClick={() => setAnalysisResult(null)} className="text-white/60 hover:text-white font-black">✕</button>
           </div>
           <p className="text-xs text-blue-50 leading-relaxed font-bold">{analysisResult}</p>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.5); }
      `}</style>
    </div>
  );
};

export default Console;
