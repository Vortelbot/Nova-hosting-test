
import React, { useState, useMemo } from 'react';
import { Node, Bot, BotStatus, SupportedLanguage } from '../types';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (bot: Bot) => void;
  nodes: Node[];
  bots: Bot[];
  userId: string;
}

const DeployModal: React.FC<DeployModalProps> = ({ isOpen, onClose, onDeploy, nodes, bots, userId }) => {
  const [name, setName] = useState('');
  const [nodeId, setNodeId] = useState(nodes[0]?.id || '');
  const [ram, setRam] = useState(512);
  const [cpu, setCpu] = useState(50);
  const [disk, setDisk] = useState(1024);
  const [lang, setLang] = useState<SupportedLanguage>('javascript');
  const [error, setError] = useState('');

  const selectedNode = useMemo(() => nodes.find(n => n.id === nodeId), [nodeId, nodes]);

  const stats = useMemo(() => {
    if (!selectedNode) return { allocatedRam: 0 };
    const nodeBots = bots.filter(b => b.nodeId === selectedNode.id);
    return {
      allocatedRam: nodeBots.reduce((sum, b) => sum + b.maxMemory, 0),
    };
  }, [selectedNode, bots]);

  if (!isOpen) return null;

  const getInitialFile = (l: SupportedLanguage) => {
    switch(l) {
      case 'python': return { name: 'main.py', content: '# Python Application\nprint("Nova Engine Started")' };
      case 'java': return { name: 'Main.java', content: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Java Engine Started");\n  }\n}' };
      case 'rust': return { name: 'main.rs', content: 'fn main() {\n    println!("Rust Engine Started");\n}' };
      case 'go': return { name: 'main.go', content: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Go Engine Started")\n}' };
      case 'cpp': return { name: 'main.cpp', content: '#include <iostream>\nint main() {\n    std::cout << "C++ Engine Started" << std::endl;\n    return 0;\n}' };
      case 'ruby': return { name: 'main.rb', content: 'puts "Ruby Engine Started"' };
      case 'php': return { name: 'index.php', content: '<?php\necho "PHP Engine Started";\n?>' };
      case 'typescript': return { name: 'index.ts', content: 'const message: string = "TypeScript Engine Started";\nconsole.log(message);' };
      default: return { name: 'index.js', content: '// JavaScript Application\nconsole.log("Nova Engine Started");' };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;
    if (ram < 128) return setError('Min. 128MB RAM');
    
    const remainingRam = selectedNode.totalRam - stats.allocatedRam;
    if (ram > remainingRam) return setError(`No capacity.`);

    const newBot: Bot = {
      id: `nb-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name || 'New Instance',
      description: 'Newly deployed Discord bot.',
      status: BotStatus.OFFLINE,
      memoryUsage: 0,
      cpuUsage: 0,
      diskUsage: 0,
      maxMemory: ram,
      maxCpu: cpu,
      maxDisk: disk,
      lastStarted: '',
      nodeId: nodeId,
      language: lang,
      uptime: 0,
      ownerId: userId,
      files: [getInitialFile(lang)]
    };

    onDeploy(newBot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0d0f17] border border-white/10 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Deploy Server</h2>
            <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest mt-1">Resource allocation</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white transition-all bg-white/5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-7 space-y-6">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black text-center uppercase tracking-widest">{error}</div>}

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Instance Name</label>
              <input 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3 text-sm text-white font-bold outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-800"
                placeholder="My Awesome Bot"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Language</label>
                <select 
                  value={lang}
                  onChange={(e) => setLang(e.target.value as SupportedLanguage)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[12px] font-bold text-white outline-none cursor-pointer focus:border-blue-500/50"
                >
                  <option value="javascript">Node.js</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="rust">Rust</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Node</label>
                <select 
                  value={nodeId}
                  onChange={(e) => setNodeId(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[12px] font-bold text-white outline-none cursor-pointer focus:border-blue-500/50"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name.split(' ')[0]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2 text-center">
                  <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest block">RAM (MB)</span>
                  <input type="number" value={ram} onChange={e => setRam(Number(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-lg py-2 text-center text-xs text-white font-black outline-none focus:border-blue-500/50" />
                </div>
                <div className="space-y-2 text-center">
                  <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest block">CPU (%)</span>
                  <input type="number" value={cpu} onChange={e => setCpu(Number(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-lg py-2 text-center text-xs text-white font-black outline-none focus:border-blue-500/50" />
                </div>
                <div className="space-y-2 text-center">
                  <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest block">DISK (MB)</span>
                  <input type="number" value={disk} onChange={e => setDisk(Number(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-lg py-2 text-center text-xs text-white font-black outline-none focus:border-blue-500/50" />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black text-white text-[11px] transition-all shadow-xl shadow-blue-600/20 active:scale-95 border border-white/10 uppercase tracking-widest">
            Provision Instance
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeployModal;
