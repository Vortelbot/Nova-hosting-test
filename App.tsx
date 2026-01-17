
import React, { useState, useEffect } from 'react';
import { Bot, BotStatus, Node, LogEntry, User } from './types';
import { initialBots, initialNodes, users as initialUsers } from './store/mockData';
import Sidebar from './components/Sidebar';
import BotCard from './components/BotCard';
import Console from './components/Console';
import StatsChart from './components/StatsChart';
import DeployModal from './components/DeployModal';
import FileManager from './components/FileManager';
import ActivityTab from './components/ActivityTab';
import Login from './components/Login';
import AdminNodes from './components/AdminNodes';
import AdminServers from './components/AdminServers';
import AdminUsers from './components/AdminUsers';
import ServerSettings from './components/ServerSettings';
import ServerAI from './components/ServerAI';
import { simulateExecution, processBotCommand } from './services/geminiService';

const DB_PREFIX = 'nova_release_final_v2';
const KEYS = {
  BOTS: `${DB_PREFIX}_bots`,
  NODES: `${DB_PREFIX}_nodes`,
  AUTH: `${DB_PREFIX}_auth_user`,
  USERS: `${DB_PREFIX}_all_users`
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(KEYS.AUTH);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(KEYS.USERS);
      const usersList: User[] = saved ? JSON.parse(saved) : initialUsers;
      return usersList.map(u => u.id === 'user-admin' ? { ...u, isSuspended: false } : u);
    } catch {
      return initialUsers;
    }
  });

  const [view, setView] = useState(() => localStorage.getItem('nh_view') || 'dashboard');
  const [serverTab, setServerTab] = useState(() => localStorage.getItem('nh_server_tab') || 'console');
  const [bots, setBots] = useState<Bot[]>(() => {
    try {
      const saved = localStorage.getItem(KEYS.BOTS);
      return saved ? JSON.parse(saved) : initialBots;
    } catch {
      return initialBots;
    }
  });
  
  const [nodes] = useState<Node[]>(initialNodes);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(() => localStorage.getItem('nh_selected_bot'));
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>({});
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [stats, setStats] = useState<Record<string, { time: string; cpu: number; mem: number }[]>>({});

  useEffect(() => {
    localStorage.setItem(KEYS.BOTS, JSON.stringify(bots));
    localStorage.setItem(KEYS.USERS, JSON.stringify(allUsers));
    localStorage.setItem('nh_view', view);
    localStorage.setItem('nh_server_tab', serverTab);
    if (selectedBotId) localStorage.setItem('nh_selected_bot', selectedBotId);
    
    if (user) {
      localStorage.setItem(KEYS.AUTH, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.AUTH);
    }
  }, [bots, view, serverTab, selectedBotId, user, allUsers]);

  const selectedBot = bots.find(b => b.id === selectedBotId) || null;

  // Real-time Heartbeat & Stats Update
  useEffect(() => {
    const interval = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString();
      
      setBots(prev => prev.map(bot => {
        if (bot.status === BotStatus.RUNNING) {
          if (Math.random() > 0.95) {
            addLog(bot.id, `[DEBUG] Shard 0: Heartbeat acknowledged (Latency: ${Math.floor(Math.random() * 30 + 15)}ms)`, 'info');
          }

          const newCpu = Number((Math.random() * 2 + 0.1).toFixed(1));
          const newMem = Number((bot.memoryUsage + (Math.random() - 0.45) * 0.5).toFixed(1));
          
          setStats(s => ({
            ...s,
            [bot.id]: [...(s[bot.id] || []), { time: timeStr, cpu: newCpu, mem: Math.max(10, newMem) }].slice(-40)
          }));

          return { ...bot, cpuUsage: newCpu, memoryUsage: Math.max(10, newMem), uptime: (bot.uptime || 0) + 1 };
        }
        return bot;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addLog = (botId: string, message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => ({
      ...prev,
      [botId]: [...(prev[botId] || []), { timestamp: new Date().toLocaleTimeString(), message, type }].slice(-250)
    }));
  };

  const handleCommand = async (botId: string, cmd: string) => {
    const bot = bots.find(b => b.id === botId);
    if (!bot) return;

    if (cmd === 'clear') {
      setLogs(prev => ({ ...prev, [botId]: [] }));
      return;
    }

    // Echo the command immediately
    addLog(botId, `container@nova:~$ ${cmd}`, 'system');

    if (bot.status === BotStatus.RUNNING) {
      // Small simulated network lag for command processing
      await new Promise(r => setTimeout(r, 400));
      
      const responses = await processBotCommand(cmd, bot.files, bot.language);
      for (const res of responses) {
        await new Promise(r => setTimeout(r, 200));
        addLog(botId, res, 'info');
      }
    } else {
      await new Promise(r => setTimeout(r, 100));
      addLog(botId, `[ERROR] Cannot execute command: Process is offline.`, 'error');
    }
  };

  const handleAction = async (botId: string, action: 'start' | 'stop' | 'restart') => {
    const bot = bots.find(b => b.id === botId);
    if (!bot) return;

    if (action === 'start' || action === 'restart') {
      setBots(prev => prev.map(b => b.id === botId ? { ...b, status: BotStatus.STARTING } : b));
      addLog(botId, `container@nova:~$ ${bot.language === 'javascript' ? 'node index.js' : 'python main.py'}`, 'system');
      
      await new Promise(r => setTimeout(r, 600));
      addLog(botId, `[INFO] Initializing virtual environment...`, 'info');
      
      const executionLogs = await simulateExecution(bot.files, bot.language);
      let fatalError = false;
      
      for (const line of executionLogs) {
        await new Promise(r => setTimeout(r, 400));
        const isError = line.toLowerCase().includes('error') || line.toLowerCase().includes('failed');
        if (isError && line.includes('Authentication')) fatalError = true;
        addLog(botId, line, isError ? 'error' : 'info');
      }

      if (fatalError) {
        setBots(prev => prev.map(b => b.id === botId ? { ...b, status: BotStatus.ERROR } : b));
        setTimeout(() => setBots(prev => prev.map(b => b.id === botId && b.status === BotStatus.ERROR ? { ...b, status: BotStatus.OFFLINE } : b)), 2000);
      } else {
        setBots(prev => prev.map(b => b.id === botId ? { ...b, status: BotStatus.RUNNING, uptime: 0 } : b));
      }
    } else {
      setBots(prev => prev.map(b => b.id === botId ? { ...b, status: BotStatus.STOPPING } : b));
      addLog(botId, "[INFO] Terminating child process...", "warn");
      await new Promise(r => setTimeout(r, 800));
      setBots(prev => prev.map(b => b.id === botId ? { ...b, status: BotStatus.OFFLINE, cpuUsage: 0, memoryUsage: 0, uptime: 0 } : b));
    }
  };

  const toggleBotSuspension = (botId: string) => {
    setBots(prev => prev.map(b => b.id === botId ? { ...b, isSuspended: !b.isSuspended } : b));
  };

  const toggleUserSuspension = (userId: string) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: !u.isSuspended } : u));
  };

  const updateBot = (updatedBot: Bot) => {
    setBots(prev => prev.map(b => b.id === updatedBot.id ? updatedBot : b));
  };

  if (!user) return <Login onLogin={setUser} storageKey={KEYS.USERS} />;

  const userBots = bots.filter(b => b.ownerId === user.id);
  const serverTabs = ['console', 'files', 'activity', ...(selectedBot?.aiEnabled ? ['ai'] : []), 'settings'];

  return (
    <div className="flex h-screen bg-[#030407] text-zinc-300 font-inter antialiased overflow-hidden">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        isAdmin={user.role === 'admin'} 
        user={user} 
        onLogout={() => setUser(null)} 
        onOpenDeploy={() => setIsDeployOpen(true)}
      />
      
      <main className="flex-1 overflow-y-auto p-10 md:p-14 scroll-smooth h-full">
        <div className="max-w-[1800px] mx-auto pb-24">
          
          {view === 'dashboard' && (
            <div className="space-y-16 animate-in fade-in duration-500">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                <div>
                  <h1 className="text-6xl font-black tracking-tighter text-white mb-3">Cluster Fleet</h1>
                  <p className="text-zinc-600 text-[12px] uppercase font-black tracking-[0.6em] flex items-center gap-4">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]"></span>
                    24/7 Hosting Verified
                  </p>
                </div>
                <div className="flex gap-6">
                   <div className="glass px-10 py-6 rounded-[2rem] flex flex-col items-center justify-center min-w-[160px]">
                      <span className="text-[11px] font-black text-zinc-600 uppercase tracking-widest mb-2">Cluster Nodes</span>
                      <span className="text-3xl font-black text-white">{nodes.length}</span>
                   </div>
                   <button onClick={() => setIsDeployOpen(true)} className="bg-blue-600 hover:bg-blue-500 px-12 py-6 rounded-[2rem] text-[14px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-blue-600/40 active:scale-95 border border-white/10 text-white">
                      + Launch Instance
                   </button>
                </div>
              </div>

              {userBots.length === 0 ? (
                <div className="grid grid-cols-1 gap-12 max-w-5xl mx-auto">
                   <div className="glass rounded-[4rem] p-16 border-2 border-dashed border-white/5 space-y-12 text-center">
                      <h2 className="text-3xl font-black text-white mb-4">Launch your first 24/7 Bot</h2>
                      <p className="text-zinc-500 max-w-md mx-auto">Choose from our worldwide infrastructure. High-performance NVMe storage and dedicated resources await your deployment.</p>
                      <button onClick={() => setIsDeployOpen(true)} className="bg-white text-black px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-2xl shadow-white/10">
                         Create Instance
                      </button>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-10">
                  {userBots.map(bot => (
                    <BotCard key={bot.id} bot={bot} onClick={(b) => { setSelectedBotId(b.id); setView('server-details'); }} />
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'admin-servers' && <AdminServers bots={bots} users={allUsers} onManage={(id) => { setSelectedBotId(id); setView('server-details'); }} onToggleSuspend={toggleBotSuspension} />}
          {view === 'admin-nodes' && <AdminNodes nodes={nodes} bots={bots} />}
          {view === 'admin-users' && <AdminUsers users={allUsers} onToggleSuspend={toggleUserSuspension} currentUser={user} />}

          {view === 'server-details' && selectedBot && (
            <div className="space-y-12 animate-in slide-in-from-bottom-10">
               <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                  <div className="flex items-center gap-8">
                    <button onClick={() => setView('dashboard')} className="w-12 h-12 flex items-center justify-center glass rounded-xl text-zinc-500 hover:text-white transition-all">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                      <h1 className="text-4xl font-black text-white tracking-tighter">{selectedBot.name}</h1>
                      <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                         <span className="text-blue-500/80 font-black">Node: {selectedBot.nodeId}</span>
                         <span>| IP: 45.13.252.11</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 glass p-3 rounded-2xl border border-white/5">
                    <button onClick={() => handleAction(selectedBot.id, 'start')} disabled={selectedBot.status === BotStatus.RUNNING || selectedBot.status === BotStatus.STARTING} className="px-6 py-3 rounded-xl bg-emerald-600/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-5">Start</button>
                    <button onClick={() => handleAction(selectedBot.id, 'restart')} className="px-6 py-3 rounded-xl bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Restart</button>
                    <button onClick={() => handleAction(selectedBot.id, 'stop')} disabled={selectedBot.status === BotStatus.OFFLINE} className="px-6 py-3 rounded-xl bg-red-600/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-5">Stop</button>
                  </div>
               </div>

               <div className="flex gap-10 border-b border-white/5 overflow-x-auto">
                  {serverTabs.map(t => (
                    <button key={t} onClick={() => setServerTab(t)} className={`pb-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${serverTab === t ? 'border-blue-500 text-white' : 'border-transparent text-zinc-600'}`}>{t}</button>
                  ))}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-10">
                     {serverTab === 'console' && (
                        <>
                          <Console 
                            logs={logs[selectedBot.id] || []} 
                            botName={selectedBot.name} 
                            status={selectedBot.status}
                            onCommand={(cmd) => handleCommand(selectedBot.id, cmd)} 
                          />
                          <div className="glass rounded-[3rem] p-8 border border-white/5">
                            <StatsChart data={stats[selectedBot.id] || []} />
                          </div>
                        </>
                     )}
                     {serverTab === 'files' && <FileManager files={selectedBot.files} onUpdateFiles={(f) => setBots(prev => prev.map(b => b.id === selectedBot.id ? { ...b, files: f } : b))} />}
                     {serverTab === 'activity' && <ActivityTab activities={[]} />}
                     {serverTab === 'ai' && selectedBot.aiEnabled && <ServerAI bot={selectedBot} onUpdateBot={updateBot} />}
                     {serverTab === 'settings' && <ServerSettings bot={selectedBot} onUpdateBot={updateBot} />}
                  </div>

                  <div className="lg:col-span-4 space-y-10">
                      <div className="glass rounded-[2rem] p-10 space-y-8 border border-white/5">
                        <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Instance Allocation</h4>
                        <div className="space-y-4">
                           {[
                             { l: 'Memory Limit', v: `${selectedBot.maxMemory} MB` },
                             { l: 'CPU Share', v: `${selectedBot.maxCpu}%` },
                             { l: 'Storage Space', v: `${selectedBot.maxDisk} MB` },
                             { l: 'Language', v: selectedBot.language.toUpperCase() }
                           ].map((it, i) => (
                             <div key={i} className="flex justify-between">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase">{it.l}</span>
                                <span className="text-xs font-black text-white">{it.v}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      <DeployModal isOpen={isDeployOpen} onClose={() => setIsDeployOpen(false)} nodes={nodes} bots={bots} userId={user.id} onDeploy={nb => { setBots(p => [...p, nb]); setView('dashboard'); }} />
    </div>
  );
};

export default App;
