
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { api } from '../services/api';
import { MarketStats, Market } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const MarketPage: React.FC = () => {
  const [stats, setStats] = useState<MarketStats[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Market['category']>('Gols');
  const [newType, setNewType] = useState<Market['type']>('Back');
  const [newStake, setNewStake] = useState(1);

  const loadData = async () => {
    const [s, m] = await Promise.all([api.getMarketStats(), api.getMarkets()]);
    setStats(s);
    setMarkets(m);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    await api.addMarket({
      name: newName,
      category: newCategory,
      type: newType,
      isActive: true,
      marketStakePercent: newStake
    });
    setNewName('');
    setNewStake(1);
    setIsRegistering(false);
    loadData();
  };

  const toggleStatus = async (id: string) => {
    await api.toggleMarketStatus(id);
    loadData();
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white">📊 Centro de Mercados</h1>
          <p className="text-slate-400">Gerencie tipos de apostas e defina limites específicos por mercado.</p>
        </div>
        <button 
          onClick={() => setIsRegistering(!isRegistering)}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold px-6 py-2 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
        >
          {isRegistering ? 'Fechar' : '➕ Cadastrar Mercado'}
        </button>
      </header>

      {isRegistering && (
        <Card className="animate-in slide-in-from-top duration-300 border-emerald-500/30">
          <h2 className="text-lg font-bold text-white mb-4">Novo Mercado</h2>
          <form onSubmit={handleAddMarket} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="text-xs text-slate-500 uppercase mb-1 block">Nome do Mercado</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Escanteios Over 9.5"
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-emerald-500 text-sm shadow-inner"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase mb-1 block">Categoria</label>
              <select 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-emerald-500 text-sm shadow-inner"
              >
                <option>Gols</option>
                <option>Escanteios</option>
                <option>Cartões</option>
                <option>Handicap</option>
                <option>Resultado Final</option>
                <option>Resultado Correto</option>
                <option>Outros</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase mb-1 block">Tipo</label>
              <select 
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-emerald-500 text-sm shadow-inner"
              >
                <option>Back</option>
                <option>Lay</option>
                <option>Ambos</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase mb-1 block">Stake (%)</label>
              <input 
                type="number" step="0.1"
                value={newStake}
                onChange={(e) => setNewStake(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-emerald-500 text-sm shadow-inner"
              />
            </div>
            <button type="submit" className="bg-emerald-500 text-slate-900 font-bold py-2 rounded hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/10">
              Salvar
            </button>
          </form>
        </Card>
      )}

      {/* Quick Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.slice(0, 4).map((m, idx) => (
          <Card key={idx} className="relative overflow-hidden group border-l-4 border-emerald-500 bg-slate-800/40">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.category}</p>
            <h3 className="text-lg font-bold text-white mt-1">{m.marketName}</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">ROI</p>
                <p className={`text-lg font-black ${m.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{m.roi.toFixed(1)}%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase">Win Rate</p>
                <p className="text-lg font-black text-white">{m.winRate.toFixed(0)}%</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between items-center">
               <span className="text-[10px] text-slate-500 uppercase font-bold">Market Score</span>
               <span className="text-xs font-black text-emerald-400">{m.score.toFixed(0)}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market List & Stats */}
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">Ranking de Performance Real</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-separate border-spacing-0">
              <thead className="text-[10px] text-slate-500 uppercase font-black tracking-widest bg-slate-900/40">
                <tr>
                  <th className="px-6 py-4">Mercado</th>
                  <th className="px-6 py-4 text-right">Stake (%)</th>
                  <th className="px-6 py-4 text-right">ROI</th>
                  <th className="px-6 py-4 text-right">Lucro</th>
                  <th className="px-6 py-4 text-right">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {markets.map((m) => {
                  const s = stats.find(st => st.marketId === m.id);
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition-all group">
                      <td className="px-6 py-5">
                        <p className="font-bold text-white">{m.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-tighter">{m.category} • {m.type}</p>
                      </td>
                      <td className="px-6 py-5 text-right font-mono text-xs text-slate-400">
                        {m.marketStakePercent || 1}%
                      </td>
                      <td className={`px-6 py-5 text-right font-black text-xs ${s && s.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {s ? `${s.roi.toFixed(1)}%` : '-'}
                      </td>
                      <td className={`px-6 py-5 text-right font-mono text-xs font-bold ${s && s.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {s ? `R$ ${s.profit.toFixed(0)}` : 'R$ 0'}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase border ${m.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                          {m.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <button 
                          onClick={() => toggleStatus(m.id)}
                          className="text-[9px] font-black uppercase text-slate-500 hover:text-white transition-all underline decoration-slate-700 hover:decoration-emerald-500"
                         >
                           {m.isActive ? 'Desativar' : 'Ativar'}
                         </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Charts and Context */}
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-emerald-400">📉</span> ROI por Mercado
            </h2>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} layout="vertical" margin={{ left: -10, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="marketName" type="category" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '10px' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar dataKey="roi" radius={[0, 4, 4, 0]} barSize={10}>
                    {stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.roi >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="bg-emerald-500/5 border-emerald-500/10">
            <h2 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">Vantagem Operacional</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Melhor ROI</span>
                <span className="text-xs font-black text-white uppercase">{stats[0]?.marketName || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Fator de Exposição</span>
                <span className="text-xs font-black text-emerald-400">{stats[0]?.score.toFixed(0)} pts</span>
              </div>
              <div className="mt-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Seu motor estatístico indica que o mercado <strong>{stats[0]?.marketName}</strong> possui a maior expectativa matemática. No modo <strong>"Stake por Mercado"</strong>, o sistema priorizará alocação de capital nestas entradas de alto valor.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketPage;
