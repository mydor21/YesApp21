
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LayoutDashboard, BrainCircuit, ListFilter, Database, LogOut, 
  Flame, Zap, Ticket, Users, Target, Heart, MessageSquare
} from 'lucide-react';
import { Goal, Message, IBO, VitalSigns, Prospect, DailyHabits } from './types';
import { buildChildrenMap, getDescendantsIds, normalizeId } from './services/statsService';
import Dashboard from './components/Dashboard';
import CoachChat from './components/CoachChat';
import NetworkManager from './components/NetworkManager';
import Auth from './components/Auth';
import DataSync from './components/DataSync';
import HotZone from './components/HotZone';
import EventLists from './components/EventLists';
import MomentumCenter from './components/MomentumCenter';
import GoalManager from './components/GoalManager';
import ProspectManager from './components/ProspectManager';
import LineChat from './components/LineChat';

type TabType = 'dashboard' | 'network' | 'hotzone' | 'coach' | 'sync' | 'events' | 'momentum' | 'goals' | 'prospects' | 'chat';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [autoAnalyzeId, setAutoAnalyzeId] = useState<string | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [globalMonthFilter, setGlobalMonthFilter] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  
  const [wesDate, setWesDate] = useState<string>(() => {
    return localStorage.getItem('yesapp_wes_date') || '2025-02-14T09:00:00';
  });

  const [user, setUser] = useState<IBO | null>(() => {
    try {
      const saved = localStorage.getItem('yesapp_active_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [fullNetwork, setFullNetwork] = useState<IBO[]>(() => {
    try {
      const saved = localStorage.getItem('yesapp_network');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem('yesapp_goals');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [prospects, setProspects] = useState<Prospect[]>(() => {
    try {
      const saved = localStorage.getItem('yesapp_prospects');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [habits, setHabits] = useState<DailyHabits>(() => {
    try {
      const saved = localStorage.getItem('yesapp_habits');
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && new Date(parsed.lastUpdated).toDateString() !== new Date().toDateString()) {
         return { reading: false, audio: false, productUse: false, planShown: false, lastUpdated: Date.now() };
      }
      return parsed || { reading: false, audio: false, productUse: false, planShown: false, lastUpdated: Date.now() };
    } catch { return { reading: false, audio: false, productUse: false, planShown: false, lastUpdated: Date.now() }; }
  });

  const activeUser = useMemo(() => {
    if (!user) return null;
    const found = fullNetwork.find(ibo => normalizeId(ibo.id) === normalizeId(user.id));
    return found || user;
  }, [fullNetwork, user]);

  const [chatMessages, setChatMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('yesapp_chat_history');
      return saved ? JSON.parse(saved) : [{
        id: '1', role: 'model', content: "Protocollo YESAPP Attivo. In attesa di ordini strategici, Carmelo.", timestamp: Date.now()
      }];
    } catch { return []; }
  });

  const isAdmin = useMemo(() => {
    return user?.id === '2502631' || user?.id === 'CARMELO-ADMIN';
  }, [user]);

  const secureNetwork = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return fullNetwork;
    const childrenMap = buildChildrenMap(fullNetwork);
    const myDownlineIds = getDescendantsIds(user.id, childrenMap);
    const myIdNormalized = normalizeId(user.id);
    return fullNetwork.filter(ibo => normalizeId(ibo.id) === myIdNormalized || myDownlineIds.includes(ibo.id));
  }, [fullNetwork, user, isAdmin]);

  const handleUpdateVitalSigns = useCallback((iboId: string, updates: Partial<VitalSigns>) => {
    setFullNetwork(prev => prev.map(ibo => 
      normalizeId(ibo.id) === normalizeId(iboId)
      ? { ...ibo, vitalSigns: { ...ibo.vitalSigns, ...updates, lastUpdate: Date.now() } }
      : ibo
    ));
  }, []);

  const handleToggleHabit = (habit: keyof Omit<DailyHabits, 'lastUpdated'>) => {
    setHabits(prev => ({ ...prev, [habit]: !prev[habit], lastUpdated: Date.now() }));
  };

  const handleLogout = useCallback(() => {
    if (window.confirm("Disconnettere il profilo Diamond?")) {
      localStorage.clear();
      window.location.reload();
    }
  }, []);

  const handleDataLoaded = useCallback((incoming: IBO[], incomingGoals: Goal[], isFullRestore: boolean, newMessages?: Message[]) => {
    setFullNetwork(incoming);
    if (newMessages) setChatMessages(newMessages);
    if (incomingGoals.length > 0) setGoals(incomingGoals);
    localStorage.setItem('yesapp_network', JSON.stringify(incoming));
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('yesapp_active_user', JSON.stringify(user));
      localStorage.setItem('yesapp_network', JSON.stringify(fullNetwork));
      localStorage.setItem('yesapp_chat_history', JSON.stringify(chatMessages));
      localStorage.setItem('yesapp_goals', JSON.stringify(goals));
      localStorage.setItem('yesapp_prospects', JSON.stringify(prospects));
      localStorage.setItem('yesapp_habits', JSON.stringify(habits));
      localStorage.setItem('yesapp_wes_date', wesDate);
    }
  }, [fullNetwork, user, chatMessages, goals, prospects, habits, wesDate]);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.setHeaderColor('#0f172a');
      tg.ready();
    }
    setIsAppReady(true);
  }, []);

  if (!isAppReady) return null;

  if (!activeUser) {
    return <Auth network={fullNetwork} onLoginSuccess={(u) => setUser(u)} onOpenSetup={() => {}} onDataLoaded={handleDataLoaded} />;
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, color: 'text-indigo-600' },
    { id: 'network', label: 'Mappa', icon: ListFilter, color: 'text-slate-600' },
    { id: 'prospects', label: 'Miniera', icon: Heart, color: 'text-rose-500' },
    { id: 'goals', label: 'Obiettivi', icon: Target, color: 'text-emerald-500' },
    { id: 'events', label: 'I Tuoi Leader', icon: Ticket, color: 'text-rose-500' },
    { id: 'momentum', label: 'Challenge', icon: Zap, color: 'text-amber-500' },
    { id: 'hotzone', label: 'Hot Zone', icon: Flame, color: 'text-orange-500' },
    { id: 'coach', label: 'AI Coach', icon: BrainCircuit, color: 'text-indigo-600' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <aside className="w-72 bg-slate-900 border-r border-white/5 flex flex-col hidden md:flex shrink-0 shadow-2xl z-30 relative">
        <div className="p-10 flex items-center space-x-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl italic">Y</div>
          <div>
            <span className="font-display font-black text-2xl tracking-tighter italic block leading-none text-white">YESAPP</span>
            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest italic">Success Hub</span>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pt-4">
          {navigationItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as TabType)} className={`w-full flex items-center space-x-4 px-6 py-5 rounded-[24px] transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={20} className={activeTab === item.id ? 'text-white' : item.color} />
              <span className="text-[11px] font-black uppercase italic tracking-tight">{item.label}</span>
            </button>
          ))}
          {isAdmin && (
            <button onClick={() => setActiveTab('sync')} className={`w-full flex items-center space-x-4 px-6 py-5 rounded-[24px] transition-all ${activeTab === 'sync' ? 'bg-rose-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
              <Database size={20} /><span className="text-[11px] font-black uppercase italic tracking-tight">Admin Hub</span>
            </button>
          )}
        </nav>
        <div className="p-8 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-3 px-4 py-5 rounded-[24px] bg-rose-500/10 text-rose-500 font-black text-[10px] uppercase italic border border-rose-500/20">
            <LogOut size={18} /><span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-12">
        <div className="pb-32 md:pb-0 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard user={activeUser} network={secureNetwork} prospects={prospects} habits={habits} onToggleHabit={handleToggleHabit} onNavigate={(t) => setActiveTab(t as TabType)} globalMonthFilter={globalMonthFilter} wesDate={wesDate} />}
          {activeTab === 'network' && <NetworkManager network={secureNetwork} isAdmin={isAdmin} onUpdateVitalSigns={() => {}} onImportMap={() => setActiveTab('sync')} onAutoAnalyze={(id) => { setAutoAnalyzeId(id); setActiveTab('coach'); }} currentUser={activeUser} globalMonthFilter={globalMonthFilter} />}
          {activeTab === 'events' && <EventLists network={secureNetwork} />}
          {activeTab === 'momentum' && <MomentumCenter network={secureNetwork} onUpdateVitalSigns={handleUpdateVitalSigns} currentUser={activeUser} />}
          {activeTab === 'hotzone' && <HotZone network={secureNetwork} currentUser={activeUser} selectedMonth={globalMonthFilter} onMonthChange={setGlobalMonthFilter} />}
          {activeTab === 'coach' && <CoachChat goals={goals} network={secureNetwork} autoAnalyzeId={autoAnalyzeId} onClearAutoAnalyze={() => setAutoAnalyzeId(null)} messages={chatMessages} onMessagesChange={setChatMessages} />}
          {activeTab === 'goals' && <GoalManager goals={goals} onAddGoal={(g) => setGoals([...goals, g])} onUpdateGoal={(id, u) => setGoals(goals.map(g => g.id === id ? {...g, ...u} : g))} onDeleteGoal={(id) => setGoals(goals.filter(g => g.id !== id))} />}
          {activeTab === 'prospects' && <ProspectManager prospects={prospects} onAddProspect={(p) => setProspects([...prospects, p])} onUpdateProspect={(id, u) => setProspects(prospects.map(p => p.id === id ? {...p, ...u} : p))} onDeleteProspect={(id) => setProspects(prospects.filter(p => p.id !== id))} />}
          {activeTab === 'chat' && <LineChat currentUser={activeUser} network={secureNetwork} />}
          {isAdmin && activeTab === 'sync' && <DataSync network={fullNetwork} messages={chatMessages} onDataLoaded={handleDataLoaded} onBulkUpdateNetwork={() => {}} onArchiveMonth={() => {}} isAdmin={isAdmin} wesDate={wesDate} onUpdateWesDate={(d) => setWesDate(d)} />}
        </div>
        
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-4 flex justify-around items-center z-50 pb-safe shadow-2xl overflow-x-auto">
          {navigationItems.slice(0, 6).map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as TabType)} className={`flex flex-col items-center p-2 min-w-[60px] transition-all ${activeTab === item.id ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
              <item.icon size={22} /><span className="text-[7px] font-black uppercase mt-1 tracking-tighter">{item.label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
