
import React, { useState } from 'react';
import { Bet, Market } from '../../types';
import Card from '../Card';
import { api } from '../../services/api';

interface BetHistoryTableProps {
  dynamicBets?: Bet[];
  markets?: Market[];
  onUpdate?: () => void;
}

const BetHistoryTable: React.FC<BetHistoryTableProps> = ({ dynamicBets, markets = [], onUpdate }) => {
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const displayBets = dynamicBets || [];

  const handleStatusChange = async (betId: string, status: Bet['status']) => {
    await api.updateBetStatus(betId, status);
    setActiveDropdown(null);
    if (onUpdate) onUpdate();
  };

  const handleDelete = async (betId: string) => {
    if (window.confirm('Excluir esta aposta? O capital será recalculado automaticamente.')) {
      await api.deleteBet(betId);
      if (onUpdate) onUpdate();
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBet) {
      await api.updateBet(editingBet.id, editingBet);
      setEditingBet(null);
      if (onUpdate) onUpdate();
    }
  };

  const getMetrics = (bet: Bet) => {
    const minute = bet.minute || 0;
    const implied = bet.odd > 0 ? (1 / bet.odd) * 100 : 0;
    const timeRemaining = Math.max(0, 90 - minute);
    const timeFactor = timeRemaining / 90;
    const adjustedImplied = minute > 0 ? implied * timeFactor : implied;
    
    const ev = ((bet.probability / 100) * bet.odd - 1) * 100;
    const fair = bet.probability > 0 ? (100 / bet.probability).toFixed(2) : '0.00';
    return { implied, adjustedImplied, ev, fair };
  };

  return (
    <Card className="p-0 overflow-hidden border-slate-700/50 shadow-2xl">
      <div className="flex justify-between items-center px-6 py-5 bg-slate-800/30 border-b border-slate-700/50">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-emerald-400">📅</span> Histórico Operacional
        </h2>
        <div className="flex items-center gap-2">
           <span className="text-[10px] text-slate-400 uppercase font-black bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-700">
             {displayBets.length} Operações
           </span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-separate border-spacing-0">
          <thead className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.15em] bg-slate-900/40">
            <tr>
              <th className="px-6 py-4 border-b border-slate-700">Data</th>
              <th className="px-6 py-4 border-b border-slate-700">Jogo / Evento</th>
              <th className="px-6 py-4 border-b border-slate-700">Mercado</th>
              <th className="px-6 py-4 border-b border-slate-700">Odd</th>
              <th className="px-6 py-4 border-b border-slate-700">Stake</th>
              <th className="px-6 py-4 border-b border-slate-700">EV</th>
              <th className="px-6 py-4 border-b border-slate-700">Profit</th>
              <th className="px-6 py-4 border-b border-slate-700">Status</th>
              <th className="px-6 py-4 border-b border-slate-700 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {displayBets.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-slate-500 italic">
                   Nenhuma operação encontrada com os filtros atuais.
                </td>
              </tr>
            ) : displayBets.map((bet) => (
              <tr key={bet.id} className="hover:bg-slate-800/30 transition-all group">
                <td className="px-6 py-5 whitespace-nowrap text-slate-500 font-mono text-xs">
                  {new Date(bet.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-5">
                  <span className="text-white font-bold block">{bet.game}</span>
                  {bet.minute !== undefined && bet.minute > 0 && (
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Minuto: {bet.minute}'</span>
                  )}
                </td>
                <td className="px-6 py-5">
                  <span className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold uppercase tracking-tight">
                    {bet.marketName}
                  </span>
                </td>
                <td className="px-6 py-5 font-mono text-xs text-slate-300">
                  @{bet.odd.toFixed(2)}
                </td>
                <td className="px-6 py-5 text-slate-400 font-mono text-xs">
                  R$ {bet.stake.toLocaleString()}
                </td>
                <td className={`px-6 py-5 font-mono text-xs font-black ${bet.ev >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {bet.ev >= 0 ? '+' : ''}{bet.ev.toFixed(1)}%
                </td>
                <td className={`px-6 py-5 font-black font-mono text-xs ${bet.profit > 0 ? 'text-emerald-400' : bet.profit < 0 ? 'text-red-400' : 'text-slate-600'}`}>
                  {bet.profit > 0 ? `+R$ ${bet.profit.toLocaleString()}` : bet.profit < 0 ? `-R$ ${Math.abs(bet.profit).toLocaleString()}` : 'R$ 0'}
                </td>
                <td className="px-6 py-5 relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === bet.id ? null : bet.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border shadow-sm ${
                      bet.status === 'won' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      bet.status === 'lost' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-slate-700/50 text-slate-400 border-slate-600'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      bet.status === 'won' ? 'bg-emerald-500' : 
                      bet.status === 'lost' ? 'bg-red-500' : 
                      'bg-slate-400'
                    }`}></span>
                    {bet.status}
                    <span className="text-[7px] ml-1 opacity-50">▼</span>
                  </button>

                  {activeDropdown === bet.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                      <div className="absolute top-12 left-4 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 min-w-[120px] animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                        <button onClick={() => handleStatusChange(bet.id, 'won')} className="w-full text-left px-4 py-2 text-[10px] font-bold text-emerald-400 hover:bg-emerald-400/10 uppercase flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ganho (Won)
                        </button>
                        <button onClick={() => handleStatusChange(bet.id, 'lost')} className="w-full text-left px-4 py-2 text-[10px] font-bold text-red-400 hover:bg-red-400/10 uppercase flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-red-500"></span> Perda (Loss)
                        </button>
                        <button onClick={() => handleStatusChange(bet.id, 'pending')} className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-400 hover:bg-slate-800 uppercase flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-slate-500"></span> Pendente
                        </button>
                      </div>
                    </>
                  )}
                </td>
                <td className="px-6 py-5 text-right">
                   <div className="flex justify-end items-center gap-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button onClick={() => setEditingBet(bet)} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Editar">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(bet.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Excluir">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modern Edit Modal */}
      {editingBet && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl p-8 shadow-2xl scale-in-center">
             <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    <span className="text-emerald-400">✏️</span> Editar Operação
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">Refine seus cálculos probabilísticos.</p>
                </div>
                <div className="bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800 text-center shadow-inner">
                   <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">EV Ajustado</p>
                   <p className={`text-2xl font-black ${getMetrics(editingBet).ev >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                     {getMetrics(editingBet).ev >= 0 ? '+' : ''}{getMetrics(editingBet).ev.toFixed(1)}%
                   </p>
                </div>
             </div>

             <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Evento / Jogo</label>
                    <input 
                      type="text" 
                      value={editingBet.game}
                      onChange={(e) => setEditingBet({ ...editingBet, game: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Mercado</label>
                    <select 
                      value={editingBet.marketId}
                      onChange={(e) => setEditingBet({ ...editingBet, marketId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 cursor-pointer shadow-inner"
                    >
                      {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                   <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Minuto</label>
                      </div>
                      <input 
                        type="number"
                        value={editingBet.minute || 0}
                        onChange={(e) => setEditingBet({ ...editingBet, minute: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-mono outline-none focus:border-emerald-500 shadow-inner"
                      />
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Odd</label>
                        <span className="text-[9px] text-slate-500">Imp: {getMetrics(editingBet).implied.toFixed(1)}%</span>
                      </div>
                      <input 
                        type="number" step="0.01"
                        value={editingBet.odd}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingBet({ ...editingBet, odd: val });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-mono outline-none focus:border-emerald-500 shadow-inner"
                      />
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-bold text-emerald-500/70 uppercase">Sua Prob (%)</label>
                      </div>
                      <input 
                        type="number" step="0.1"
                        value={editingBet.probability}
                        onChange={(e) => setEditingBet({ ...editingBet, probability: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-400 text-lg font-mono outline-none focus:border-emerald-500 shadow-inner font-bold"
                      />
                      <p className="text-[8px] text-slate-500 mt-1 uppercase text-center">Ajustada: {getMetrics(editingBet).adjustedImplied.toFixed(1)}%</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Stake (R$)</label>
                      <input 
                        type="number"
                        value={editingBet.stake}
                        onChange={(e) => setEditingBet({ ...editingBet, stake: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-emerald-500 shadow-inner"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Data</label>
                      <input 
                        type="date"
                        value={editingBet.date}
                        onChange={(e) => setEditingBet({ ...editingBet, date: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 shadow-inner"
                      />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Resultado Final</label>
                   <div className="grid grid-cols-3 gap-2">
                     {['pending', 'won', 'lost'].map(st => (
                       <button 
                         key={st} type="button"
                         onClick={() => setEditingBet({ ...editingBet, status: st as any })}
                         className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${
                            editingBet.status === st 
                            ? (st === 'won' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' : st === 'lost' ? 'bg-red-500 text-slate-950 shadow-red-500/20' : 'bg-slate-700 text-white')
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                         }`}
                       >
                         {st}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setEditingBet(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95">Cancelar</button>
                  <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95">Salvar Alterações</button>
                </div>
             </form>
           </div>
        </div>
      )}
    </Card>
  );
};

export default BetHistoryTable;
