
import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Ticket, Zap, ArrowRight, Target, Crown, Calendar, ClipboardList, Trophy, ChevronRight, Star, UserCheck, ShieldCheck, Heart
} from 'lucide-react';
import { IBO, Prospect, DailyHabits } from '../types';
import { getAutoTarget } from '../services/qualificationService';
import { calculateNetworkStats, normalizeId } from '../services/statsService';
import Scorecard from './Scorecard';

interface DashboardProps {
  user: IBO;
  network: IBO[];
  prospects: Prospect[];
  habits: DailyHabits;
  onToggleHabit: (habit: keyof Omit<DailyHabits, 'lastUpdated'>) => void;
  onNavigate?: (tab: string) => void;
  globalMonthFilter: string;
  wesDate: string;
}

const formatDisplayName = (name: string) => {
  if (!name) return "Leader";
  return name.replace(/,/g, '').replace(/\s+/g, ' ').trim();
};

const ProgressBar = ({ label, current, target, color }: { label: string, current: number, target: number, color: string }) => {
  const progress = Math.min(100, (current / target) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest italic">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-600">{current} / {target}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

const WESCountdown = ({ targetDateStr }: { targetDateStr: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, min: 0, sec: 0 });

  useEffect(() => {
    const targetDate = new Date(targetDateStr).getTime();
    if (isNaN(targetDate)) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, min: 0, sec: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        min: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        sec: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDateStr]);

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden border-b-4 border-rose-600">
      <div className="absolute -right-10 -top-10 opacity-10 rotate-12"><Calendar size={180} /></div>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 mb-2 italic">Countdown Strategico</p>
          <h2 className="text-4xl font-display font-black italic uppercase tracking-tighter leading-none">WES SEMINAR<br/><span className="text-indigo-500">14 FEBBRAIO</span></h2>
        </div>
        <div className="flex gap-4">
          {[
            { label: 'G', val: timeLeft.days },
            { label: 'O', val: timeLeft.hours },
            { label: 'M', val: timeLeft.min },
            { label: 'S', val: timeLeft.sec }
          ].map(unit => (
            <div key={unit.label} className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
                <span className="text-2xl font-black italic">{unit.val}</span>
              </div>
              <span className="text-[8px] font-black text-rose-500 mt-2 uppercase">{unit.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user, network, habits, onToggleHabit, onNavigate, globalMonthFilter, wesDate }) => {
  const networkStats = useMemo(() => calculateNetworkStats(network, globalMonthFilter), [network, globalMonthFilter]);

  const orgStats = useMemo(() => {
    const stats = networkStats.get(normalizeId(user.id)) || { bbs: 0, wes: 0, cep: 0, vpg: 0, recruits: 0 };
    return {
      totalVpg: Number(user.vitalSigns.groupPV || 0), 
      totalBbs: stats.bbs,
      totalWes: stats.wes,
      totalCep: stats.cep,
      newRecruits: stats.recruits
    };
  }, [networkStats, user]);

  const frontlines = useMemo(() => {
    return network
      .filter(ibo => normalizeId(ibo.uplineId || "") === normalizeId(user.id))
      .filter(ibo => {
          const stats = networkStats.get(normalizeId(ibo.id));
          return (stats?.vpg || 0) > 0;
      })
      .sort((a, b) => {
          const statsA = networkStats.get(normalizeId(a.id))?.vpg || 0;
          const statsB = networkStats.get(normalizeId(b.id))?.vpg || 0;
          return statsB - statsA;
      });
  }, [network, user.id, networkStats]);

  const nextObjective = useMemo(() => getAutoTarget(orgStats.totalVpg), [orgStats.totalVpg]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in duration-1000">
      
      <WESCountdown targetDateStr={wesDate} />

      {/* HEADER LEADER */}
      <div className="bg-white rounded-[48px] p-10 shadow-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Crown size={150} /></div>
        <div className="flex items-center space-x-8 relative z-10">
          <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center text-white text-4xl font-black italic shadow-xl border-4 border-indigo-600/20">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              {formatDisplayName(user.name)}
            </h1>
            <div className="flex items-center space-x-3 mt-3">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                {user.qualification}
              </span>
              <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100 italic">
                {orgStats.totalVpg} PV
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[36px] text-white flex items-center space-x-6 shadow-2xl min-w-[280px]">
          <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg"><Target size={32} /></div>
          <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic mb-1">Il Tuo Obiettivo</p>
            <p className="text-2xl font-black italic uppercase leading-none">{nextObjective.label}</p>
            <p className="text-[9px] text-slate-500 mt-2 font-bold max-w-[150px] leading-tight italic">{nextObjective.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KPI GRID TOTALI */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
          {[
            { label: 'Punti Gruppo', val: orgStats.totalVpg, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Totale BBS', val: orgStats.totalBbs, icon: Ticket, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Totale WES', val: orgStats.totalWes, icon: Zap, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Nuovi Ingressi', val: orgStats.newRecruits, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' }
          ].map((kpi, i) => (
            <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl flex flex-col items-center text-center space-y-3 hover:scale-105 transition-transform">
              <div className={`p-4 ${kpi.bg} ${kpi.color} rounded-2xl`}><kpi.icon size={24} /></div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{kpi.label}</p>
                <p className={`text-3xl font-black italic ${kpi.color}`}>{kpi.val}</p>
              </div>
            </div>
          ))}
        </div>
        {/* SCORECARD */}
        <div className="lg:col-span-1">
          <Scorecard habits={habits} onToggleHabit={onToggleHabit} />
        </div>
      </div>

      {/* SEZIONE FRONTLINE */}
      <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl p-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100"><UserCheck size={24} /></div>
             <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic leading-none">Situazione Frontline</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Monitoraggio Segni Vitali N21</p>
             </div>
          </div>
          <button onClick={() => onNavigate?.('network')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center hover:underline">
            Vedi Mappa Completa <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frontlines.map((ibo) => {
            const stats = networkStats.get(normalizeId(ibo.id)) || { bbs: 0, wes: 0, cep: 0, vpg: 0, recruits: 0 };
            const target = getAutoTarget(stats.vpg);
            return (
              <div key={ibo.id} className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-6 hover:bg-indigo-50/30 transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-lg italic shadow-md">
                        {ibo.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase italic truncate max-w-[120px]">{formatDisplayName(ibo.name)}</p>
                        <div className="flex items-center space-x-1 mt-0.5">
                          {ibo.vitalSigns.hasCEP && <ShieldCheck size={10} className="text-emerald-500" />}
                          <span className="text-[8px] font-black text-slate-400 uppercase">ID: {ibo.id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter italic leading-none">Target</p>
                       <p className="text-[11px] font-black text-slate-900 uppercase italic">{target.label}</p>
                    </div>
                  </div>
                  <div className="space-y-3 pt-2">
                    <ProgressBar label="PV Gruppo" current={stats.vpg} target={target.minVpg} color="bg-indigo-600" />
                    <ProgressBar label="CEP Gruppo" current={stats.cep} target={target.cep} color="bg-emerald-500" />
                    <ProgressBar label="Biglietti BBS" current={stats.bbs} target={target.bbs} color="bg-blue-500" />
                    <ProgressBar label="Biglietti WES" current={stats.wes} target={target.wes} color="bg-rose-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="flex items-center space-x-2">
                     <Users size={14} className="text-orange-500" />
                     <span className="text-[10px] font-black text-slate-900 uppercase italic">Nuovi: +{stats.recruits}</span>
                  </div>
                  <button onClick={() => onNavigate?.('coach')} className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Zap size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AZIONI MASTER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button onClick={() => onNavigate?.('prospects')} className="bg-slate-900 p-10 rounded-[48px] text-white flex items-center justify-between group shadow-2xl hover:bg-indigo-950 transition-all border-b-8 border-rose-600">
           <div className="flex items-center space-x-6">
              {/* Fix: Added missing Heart icon from lucide-react */}
              <div className="p-5 bg-rose-600 rounded-[28px] shadow-xl"><Heart size={32} /></div>
              <div className="text-left">
                <p className="text-2xl font-black italic uppercase tracking-tighter">Miniera d'Oro</p>
                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">Gestisci la Lista Nomi</p>
              </div>
           </div>
           <ArrowRight className="group-hover:translate-x-3 transition-transform text-rose-400" size={32} />
        </button>

        <button onClick={() => onNavigate?.('goals')} className="bg-white p-10 rounded-[48px] border border-slate-100 flex items-center justify-between group shadow-xl hover:shadow-2xl transition-all border-b-8 border-emerald-500">
           <div className="flex items-center space-x-6">
              <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[28px] shadow-lg border border-emerald-100"><Target size={32} /></div>
              <div className="text-left">
                <p className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Obiettivi SMART</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Definisci il tuo successo</p>
              </div>
           </div>
           <ArrowRight className="group-hover:translate-x-3 transition-transform text-emerald-500" size={32} />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
