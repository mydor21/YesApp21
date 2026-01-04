
import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Ticket, Zap, ArrowRight, Target, Crown, Calendar, Trophy, ChevronRight, UserCheck, ShieldCheck, Heart
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
  const progress = Math.min(100, (current / (target || 1)) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest italic">
        <span className="text-slate-500 truncate mr-2">{label}</span>
        <span className="text-slate-950 shrink-0 font-black">{current} / {target}</span>
      </div>
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
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
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black rounded-[32px] md:rounded-[40px] p-6 md:p-8 text-white shadow-2xl relative overflow-hidden border-b-4 border-rose-600">
      <div className="absolute -right-10 -top-10 opacity-10 rotate-12"><Calendar size={180} /></div>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-500 mb-1 italic text-white">Prossimo Obiettivo</p>
          <h2 className="text-3xl md:text-4xl font-display font-black italic uppercase tracking-tighter leading-none text-white">WES SEMINAR<br/><span className="text-indigo-500">14 FEBBRAIO</span></h2>
        </div>
        <div className="flex gap-2 md:gap-4">
          {[
            { label: 'G', val: timeLeft.days },
            { label: 'O', val: timeLeft.hours },
            { label: 'M', val: timeLeft.min },
            { label: 'S', val: timeLeft.sec }
          ].map(unit => (
            <div key={unit.label} className="flex flex-col items-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
                <span className="text-xl md:text-2xl font-black italic text-white">{unit.val}</span>
              </div>
              <span className="text-[7px] font-black text-rose-500 mt-1 uppercase text-white">{unit.label}</span>
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

  const structuralStats = useMemo(() => {
    const fls = network.filter(ibo => normalizeId(ibo.uplineId || "") === normalizeId(user.id));
    const active = fls.filter(f => (networkStats.get(normalizeId(f.id))?.vpg || 0) > 0).length;
    const lcs = fls.filter(f => (networkStats.get(normalizeId(f.id))?.vpg || 0) >= 1200).length;
    return { active, lcs };
  }, [network, user.id, networkStats]);

  const nextObjective = useMemo(() => 
    getAutoTarget(orgStats.totalVpg, structuralStats.active, structuralStats.lcs), 
    [orgStats.totalVpg, structuralStats]
  );

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

  const formatMonthLabel = (m: string) => {
    if (m === 'ALL') return 'Totali';
    const [year, month] = m.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('it-IT', { month: 'short' }).toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-32 animate-in fade-in duration-1000">
      
      <WESCountdown targetDateStr={wesDate} />

      {/* HEADER LEADER */}
      <div className="bg-white rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Crown size={150} /></div>
        <div className="flex items-center space-x-6 relative z-10 w-full md:w-auto">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-900 rounded-2xl md:rounded-[32px] flex items-center justify-center text-white text-2xl md:text-4xl font-black italic shadow-xl border-4 border-indigo-600/20">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-black text-slate-950 uppercase italic tracking-tighter leading-none">
              {formatDisplayName(user.name)}
            </h1>
            <div className="flex items-center space-x-2 mt-2">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100 shrink-0">
                {user.qualification}
              </span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100 italic shrink-0">
                {orgStats.totalVpg} PV
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 md:p-8 rounded-3xl md:rounded-[36px] text-white flex items-center space-x-4 md:space-x-6 shadow-2xl w-full md:w-auto md:min-w-[280px]">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg"><Target size={24} /></div>
          <div>
            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest italic mb-0.5">Focus Attuale</p>
            <p className="text-xl md:text-2xl font-black italic uppercase leading-none text-white">{nextObjective.label}</p>
            <p className="text-[8px] text-slate-400 mt-1 font-bold leading-tight italic max-w-[150px]">{nextObjective.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* KPI TOTALI COMPATTATI */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
          {[
            { label: 'Punti Gruppo', val: orgStats.totalVpg, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Biglietti BBS', val: orgStats.totalBbs, icon: Ticket, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Biglietti WES', val: orgStats.totalWes, icon: Zap, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Abbonati CEP', val: orgStats.totalCep, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: `Nuovi (${formatMonthLabel(globalMonthFilter)})`, val: orgStats.newRecruits, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' }
          ].map((kpi, i) => (
            <div key={i} className="bg-white p-4 md:p-6 rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-xl flex flex-col items-center text-center space-y-1 md:space-y-2 hover:scale-105 transition-transform">
              <div className={`p-2 md:p-3 ${kpi.bg} ${kpi.color} rounded-xl md:rounded-2xl`}><kpi.icon size={18} /></div>
              <div>
                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest italic leading-none">{kpi.label}</p>
                <p className={`text-xl md:text-2xl font-black italic ${kpi.color}`}>{kpi.val}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          <Scorecard habits={habits} onToggleHabit={onToggleHabit} />
        </div>
      </div>

      <div className="bg-white rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-2xl p-6 md:p-10 space-y-6 md:space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 md:space-x-4">
             <div className="p-2 md:p-3 bg-indigo-50 text-indigo-700 rounded-xl md:rounded-2xl border border-indigo-100"><UserCheck size={20} /></div>
             <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-950 uppercase italic leading-none">Situazione Frontline</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">Monitoraggio Segni Vitali N21</p>
             </div>
          </div>
          <button onClick={() => onNavigate?.('network')} className="text-[8px] md:text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center hover:underline">
            Vedi Tutti <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {frontlines.map((ibo) => {
            const stats = networkStats.get(normalizeId(ibo.id)) || { bbs: 0, wes: 0, cep: 0, vpg: 0, recruits: 0 };
            const subFrontlines = network.filter(f => normalizeId(f.uplineId || "") === normalizeId(ibo.id));
            const subActive = subFrontlines.filter(f => (networkStats.get(normalizeId(f.id))?.vpg || 0) > 0).length;
            const subLc = subFrontlines.filter(f => (networkStats.get(normalizeId(f.id))?.vpg || 0) >= 1200).length;
            const target = getAutoTarget(stats.vpg, subActive, subLc);

            return (
              <div key={ibo.id} className="bg-slate-50 p-6 md:p-8 rounded-[40px] border border-slate-200 space-y-6 hover:bg-indigo-50/40 transition-all flex flex-col justify-between group relative overflow-hidden">
                <div className="space-y-6 relative z-10">
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl italic shadow-md shrink-0">
                        {ibo.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm md:text-base font-black text-slate-950 uppercase italic truncate">{formatDisplayName(ibo.name)}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {ibo.vitalSigns.hasCEP && <ShieldCheck size={14} className="text-emerald-600" />}
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ID: {ibo.id}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-indigo-600 px-3 py-2 rounded-xl shrink-0 text-center shadow-lg border border-white/10">
                       <p className="text-[7px] font-black text-indigo-100 uppercase tracking-widest italic leading-none mb-1">Target</p>
                       <p className="text-[11px] font-black text-white uppercase italic leading-none whitespace-nowrap tracking-tight">{target.label}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-5 pt-4 border-t border-slate-300/50">
                    <ProgressBar label="Punti Gruppo (VPG)" current={stats.vpg} target={target.minVpg} color="bg-indigo-600" />
                    <ProgressBar label="Biglietti BBS" current={stats.bbs} target={target.bbs} color="bg-blue-600" />
                    <ProgressBar label="Biglietti WES" current={stats.wes} target={target.wes} color="bg-rose-600" />
                    <ProgressBar label="Abbonamenti CEP" current={stats.cep} target={target.cep} color="bg-emerald-600" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-300 mt-2">
                  <div className="flex items-center space-x-2">
                     <Users size={16} className="text-orange-600" />
                     <span className="text-[11px] font-black text-slate-950 uppercase italic">
                        {globalMonthFilter === 'ALL' ? `Totale Squadra: ${stats.recruits}` : `Nuovi Ingressi: +${stats.recruits}`}
                     </span>
                  </div>
                  <button onClick={() => onNavigate?.('coach')} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-indigo-600 transition-all shadow-md">
                    <Zap size={14} className="text-indigo-400" />
                    <span>Analisi Hub</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AZIONI MASTER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <button onClick={() => onNavigate?.('prospects')} className="bg-slate-900 p-6 md:p-10 rounded-3xl md:rounded-[48px] text-white flex items-center justify-between group shadow-2xl hover:bg-indigo-950 transition-all border-b-8 border-rose-600">
           <div className="flex items-center space-x-4 md:space-x-6">
              <div className="p-3 md:p-5 bg-rose-600 rounded-xl md:rounded-[28px] shadow-xl"><Heart size={24} /></div>
              <div className="text-left">
                <p className="text-lg md:text-2xl font-black italic uppercase tracking-tighter leading-none text-white">Miniera d'Oro</p>
                <p className="text-[8px] md:text-[10px] text-rose-400 font-bold uppercase tracking-widest mt-1">Gestisci la Lista Nomi</p>
              </div>
           </div>
           <ArrowRight className="group-hover:translate-x-3 transition-transform text-rose-400" size={24} />
        </button>

        <button onClick={() => onNavigate?.('goals')} className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[48px] border border-slate-100 flex items-center justify-between group shadow-xl hover:shadow-2xl transition-all border-b-8 border-emerald-500">
           <div className="flex items-center space-x-4 md:space-x-6">
              <div className="p-3 md:p-5 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-[28px] shadow-lg border border-emerald-100"><Target size={24} /></div>
              <div className="text-left">
                <p className="text-lg md:text-2xl font-black italic uppercase tracking-tighter text-slate-950 leading-none">Obiettivi SMART</p>
                <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Definisci il tuo successo</p>
              </div>
           </div>
           <ArrowRight className="group-hover:translate-x-3 transition-transform text-emerald-500" size={24} />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
