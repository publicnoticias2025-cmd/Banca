
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import KpiCard from '../components/widgets/KpiCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { BankrollStats, GrowthData, BankrollConfig } from '../types';

const BankrollPage: React.FC = () => {
  const [stats, setStats] = useState<BankrollStats | null>(null);
  const [config, setConfig] = useState<BankrollConfig | null>(null);
  const [projection, setProjection] = useState<GrowthData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Local form state for modal
  const [formConfig, setFormConfig] = useState<BankrollConfig>({
    initialBank: 10000,
    dailyInterest: 2,
    periodDays: 30
  });

  const load = async () => {
    const [s, c] = await Promise.all([api.getBankrollStats(), api.getBankConfig()]);
    setStats(s);
    setConfig(c);
    setFormConfig(c);
    const p = await api.getGrowthProjection({ 
      dailyTargetPct: c.dailyInterest, 
      horizonDays: c.periodDays 
    });
    setProjection(p);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateBankConfig(formConfig);
    setIsModalOpen(false);
    load();
  };

  if (!stats || !config) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
    </div>
  );

  const finalGoalValue = config.initialBank * Math.pow(1 + (config.dailyInterest / 100), config.periodDays);
  const dailyProjectedProfit = stats.current * (config.dailyInterest / 100);
  const remainingToday = dailyProjectedProfit - stats.todayProfit;
  const progressPercent = Math.min(100, (stats.current / finalGoalValue) * 100);
  const todayProgressPercent = Math.min(100, Math.max(0, (stats.todayProfit / dailyProjectedProfit) * 100));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white">💰 Gestão de Banca</h1>
          <p className="text-slate-400">Controle de capital, projeções exponenciais e metas estratégicas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-transparent border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-white px-6 py-2 rounded-lg transition-all font-semibold flex items-center gap-2"
        >
          ⚙️ Configurar Banca
        </button>
      </header>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Banca Inicial" value={`R$ ${stats.initial.toLocaleString()}`} />
        <KpiCard title="Capital Atual" value={`R$ ${stats.current.toLocaleString()}`} />
        <KpiCard title="Crescimento" value={`${stats.growthPct.toFixed(1)}%`} changeType="positive" />
        <KpiCard title="ROI Acumulado" value={`${stats.roi.toFixed(1)}%`} />
        <KpiCard title="Drawdown" value={`${stats.drawdown}%`} changeType="negative" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Projection Chart */}
        <Card className="lg:col-span-2 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Projeção Exponencial</h2>
              <p className="text-sm text-slate-400">Juros compostos de {config.dailyInterest}% ao dia por {config.periodDays} dias.</p>
            </div>
          </div>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projection}>
                <defs>
                  <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${(val/1000).toFixed(1)}k`} />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#10b981' }}
                  formatter={(val: number) => `R$ ${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                />
                <Area type="monotone" dataKey="projected" stroke="#10b981" fillOpacity={1} fill="url(#colorProj)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Goals & Simulation Column */}
        <div className="flex flex-col gap-6">
          {/* Daily Meta Block */}
          <Card className={`${remainingToday <= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/40 border-slate-700/50'}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Meta de Hoje</h3>
              {remainingToday <= 0 && <span className="text-emerald-400 text-[10px] font-bold uppercase animate-pulse">✓ Concluída</span>}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-white">R$ {dailyProjectedProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <div className="flex justify-between mt-1">
                  <p className="text-[10px] text-slate-500">Realizado: <span className="text-emerald-400 font-bold">R$ {stats.todayProfit.toLocaleString()}</span></p>
                  <p className="text-[10px] text-slate-500">Restante: <span className={remainingToday > 0 ? 'text-yellow-400' : 'text-emerald-400'}>R$ {Math.max(0, remainingToday).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></p>
                </div>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${remainingToday <= 0 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-yellow-500'}`} 
                  style={{ width: `${todayProgressPercent}%` }}
                ></div>
              </div>
            </div>
          </Card>

          {/* Final Period Meta Block */}
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">Meta Final do Plano</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Capital Final Projetado</p>
                <p className="text-2xl font-bold text-white">R$ {finalGoalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-emerald-500 font-semibold mt-1">Crescimento Total: +{((finalGoalValue/stats.initial - 1) * 100).toFixed(0)}%</p>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-500 uppercase">Progresso do Período</span>
                  <span className="text-white font-bold">{progressPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
            </div>
          </Card>

          {/* Scenarios */}
          <Card>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Simulador de Impacto</h3>
            <div className="space-y-3">
              {[
                { label: `Cenário Otimista (+${(config.dailyInterest * 2).toFixed(1)}%)`, val: stats.current * (config.dailyInterest * 2 / 100), color: 'text-emerald-400' },
                { label: `Cenário Base (+${config.dailyInterest.toFixed(1)}%)`, val: stats.current * (config.dailyInterest / 100), color: 'text-emerald-500' },
                { label: `Cenário Crítico (-${(config.dailyInterest * 1.5).toFixed(1)}%)`, val: stats.current * (config.dailyInterest * -1.5 / 100), color: 'text-red-400' },
                { label: 'Pior Caso (-10%)', val: stats.current * -0.10, color: 'text-red-600' },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">{item.label}</span>
                  <span className={`font-mono font-bold ${item.color}`}>
                    {item.val >= 0 ? '+' : ''}R$ {item.val.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-8 shadow-2xl scale-in-center">
            <h2 className="text-2xl font-bold text-white mb-2">⚙️ Configurar Capital</h2>
            <p className="text-slate-400 text-sm mb-8">Defina os parâmetros do seu planejamento de juros compostos.</p>
            
            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Banca Inicial (R$)</label>
                <input 
                  type="number" 
                  value={formConfig.initialBank}
                  onChange={(e) => setFormConfig({...formConfig, initialBank: Number(e.target.value)})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Ex: 10000"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Juros Diário Esperado (%)</label>
                <input 
                  type="number" step="0.1"
                  value={formConfig.dailyInterest}
                  onChange={(e) => setFormConfig({...formConfig, dailyInterest: Number(e.target.value)})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-emerald-400 font-bold outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Ex: 2.0"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Período de Operação (dias)</label>
                <input 
                  type="number" 
                  value={formConfig.periodDays}
                  onChange={(e) => setFormConfig({...formConfig, periodDays: Number(e.target.value)})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Ex: 30"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                >
                  Salvar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankrollPage;
