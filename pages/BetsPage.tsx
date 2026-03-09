
import React, { useState, useEffect, useMemo } from 'react';
import BetHistoryTable from '../components/widgets/BetHistoryTable';
import Card from '../components/Card';
import { api } from '../services/api';
import { Bet, Market, StakeConfig, BankrollStats } from '../types';

const BetsPage: React.FC = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [stakeConfig, setStakeConfig] = useState<StakeConfig | null>(null);
  const [bankStats, setBankStats] = useState<BankrollStats | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'won' | 'lost' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Bet Form State
  const [newBet, setNewBet] = useState({
    game: '',
    marketId: '',
    odd: 2.00,
    stake: 0,
    probability: 50.00, // Estimated probability
    minute: 0, // Game minute
    status: 'pending' as Bet['status'],
    date: new Date().toISOString().split('T')[0],
  });

  const load = async () => {
    const [b, m, sc, bs] = await Promise.all([
      api.getBets(), 
      api.getMarkets(), 
      api.getStakeConfig(), 
      api.getBankrollStats()
    ]);
    setBets(b);
    const activeMarkets = m.filter(mark => mark.isActive);
    setMarkets(activeMarkets);
    setStakeConfig(sc);
    setBankStats(bs);
    
    // Set initial market if not set
    if (activeMarkets.length > 0 && !newBet.marketId) {
       const initialMarketId = activeMarkets[0].id;
       const recommended = api.calculateRecommendedStake(bs.current, sc, { 
         odd: newBet.odd, 
         probability: newBet.probability, 
         marketId: initialMarketId 
       });
       setNewBet(prev => ({ ...prev, marketId: initialMarketId, stake: recommended || 100 }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Recalculate suggested stake whenever odd, probability, minute, or market changes
  useEffect(() => {
    if (bankStats && stakeConfig && stakeConfig.mode !== 'manual') {
      const recommended = api.calculateRecommendedStake(bankStats.current, stakeConfig, {
        odd: newBet.odd,
        probability: newBet.probability,
        marketId: newBet.marketId
      });
      if (recommended > 0) {
        setNewBet(prev => ({ ...prev, stake: recommended }));
      }
    }
  }, [newBet.odd, newBet.probability, newBet.minute, newBet.marketId, bankStats, stakeConfig]);

  const handleOddChange = (value: number) => {
    const implied = value > 0 ? (1 / value) * 100 : 0;
    const timeRemaining = Math.max(0, 90 - newBet.minute);
    const timeFactor = timeRemaining / 90;
    const adjusted = implied * (newBet.minute > 0 ? timeFactor : 1);
    
    setNewBet({ 
      ...newBet, 
      odd: value, 
      probability: Number(adjusted.toFixed(2))
    });
  };

  const handleMinuteChange = (min: number) => {
    const implied = newBet.odd > 0 ? (1 / newBet.odd) * 100 : 0;
    const timeRemaining = Math.max(0, 90 - min);
    const timeFactor = timeRemaining / 90;
    const adjusted = implied * (min > 0 ? timeFactor : 1);
    
    setNewBet({
      ...newBet,
      minute: min,
      probability: Number(adjusted.toFixed(2))
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await api.addBet({
        ...newBet
      });
      if (result.error) {
        alert('Erro ao salvar aposta: ' + result.error);
      } else {
        setIsFormOpen(false);
        load();
        // Reset form
        setNewBet({
          game: '',
          marketId: markets[0]?.id || '',
          odd: 2.00,
          stake: 0,
          probability: 50.00,
          minute: 0,
          status: 'pending',
          date: new Date().toISOString().split('T')[0],
        });
      }
    } catch (err) {
      alert('Falha na comunicação com o servidor');
      console.error(err);
    }
  };

  // Metrics calculation
  const impliedProb = newBet.odd > 0 ? (1 / newBet.odd) * 100 : 0;
  const timeRemaining = Math.max(0, 90 - newBet.minute);
  const timeFactor = timeRemaining / 90;
  const timeAdjustedImplied = newBet.minute > 0 ? impliedProb * timeFactor : impliedProb;
  const calculatedEV = ((newBet.probability / 100) * newBet.odd - 1) * 100;
  const fairOdd = newBet.probability > 0 ? (100 / newBet.probability).toFixed(2) : '0.00';
  const advantage = newBet.probability - timeAdjustedImplied;

  // Computed filtered bets
  const filteredBets = useMemo(() => {
    return bets.filter(bet => {
      const matchesStatus = statusFilter === 'all' || bet.status === statusFilter;
      const matchesSearch = bet.game.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (bet.marketName && bet.marketName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [bets, statusFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-emerald-400">⚡</span> Minhas Apostas
          </h1>
          <p className="text-slate-400">Gestão contextualizada e modelagem de valor em tempo real.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={`px-6 py-2 rounded-lg font-bold transition-all transform active:scale-95 shadow-lg flex items-center gap-2 ${
            isFormOpen ? 'bg-slate-800 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-slate-900 shadow-emerald-500/20'
          }`}
        >
          {isFormOpen ? '✖ Fechar' : '➕ Nova Operação'}
        </button>
      </header>

      {isFormOpen && (
        <Card className="animate-in slide-in-from-top duration-300 border-emerald-500/20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Registrar Nova Operação</h2>
            <div className="flex items-center gap-2">
              {stakeConfig?.mode !== 'manual' && (
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-emerald-500/30">
                  ⚙️ Gestão Ativa: {stakeConfig?.mode}
                </span>
              )}
              {newBet.minute > 70 && (
                <span className="bg-red-500/20 text-red-400 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-red-500/30 animate-pulse">
                  ⚠️ Período Crítico
                </span>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="text-xs text-slate-500 uppercase mb-1 block font-bold">Evento / Jogo</label>
              <input 
                type="text" 
                required
                value={newBet.game}
                onChange={(e) => setNewBet({ ...newBet, game: e.target.value })}
                placeholder="Ex: Real Madrid vs Man City"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-emerald-500 transition-all shadow-inner"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase mb-1 block font-bold">Mercado Estratégico</label>
              <select 
                required
                value={newBet.marketId}
                onChange={(e) => setNewBet({ ...newBet, marketId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-emerald-500 cursor-pointer shadow-inner"
              >
                {markets.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase mb-1 block font-bold">Data</label>
              <input 
                type="date" 
                value={newBet.date}
                onChange={(e) => setNewBet({ ...newBet, date: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Modeling Block */}
            <div className="md:col-span-3 lg:col-span-4 grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800 shadow-xl">
               <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase block font-bold">Tempo (Minuto)</label>
                  <input 
                    type="number" min="0" max="100"
                    value={newBet.minute}
                    onChange={(e) => handleMinuteChange(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500 font-mono text-xl"
                  />
                  <div className="flex justify-between px-1">
                    <span className="text-[10px] text-slate-500 uppercase text-[8px]">Restante</span>
                    <span className="text-[10px] text-slate-300 font-bold text-[8px]">{timeRemaining}m</span>
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase block font-bold">Odd Atual</label>
                  <input 
                    type="number" step="0.01" 
                    value={newBet.odd}
                    onChange={(e) => handleOddChange(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500 font-mono text-xl"
                  />
                  <div className="flex justify-between px-1">
                    <span className="text-[10px] text-slate-500 uppercase text-[8px]">Ajustada</span>
                    <span className="text-[10px] text-slate-300 font-bold text-[8px]">{timeAdjustedImplied.toFixed(1)}%</span>
                  </div>
               </div>
               
               <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Sua Probabilidade (%)</label>
                  <input 
                    type="number" step="0.1"
                    value={newBet.probability}
                    min="0" max="100"
                    onChange={(e) => setNewBet({ ...newBet, probability: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg px-4 py-3 text-emerald-400 outline-none focus:border-emerald-500 font-mono text-xl font-bold shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                  />
                  <div className="flex justify-between px-1">
                    <span className="text-[10px] text-slate-500 uppercase text-[8px]">Vantagem</span>
                    <span className={`text-[10px] font-bold text-[8px] ${advantage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {advantage >= 0 ? '+' : ''}{advantage.toFixed(1)}%
                    </span>
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase block font-bold">Stake (R$)</label>
                  <input 
                    type="number" step="1" 
                    value={newBet.stake}
                    onChange={(e) => setNewBet({ ...newBet, stake: Number(e.target.value) })}
                    className={`w-full bg-slate-900 border rounded-lg px-4 py-3 text-white outline-none focus:border-emerald-500 font-mono text-xl ${stakeConfig?.mode !== 'manual' ? 'border-emerald-500/40 text-emerald-400' : 'border-slate-700'}`}
                  />
                  <div className="flex justify-between px-1">
                    <span className="text-[10px] text-slate-500 uppercase text-[8px]">Odd Justa</span>
                    <span className="text-[10px] text-slate-300 font-bold text-[8px]">@{fairOdd}</span>
                  </div>
               </div>

               <div className="flex flex-col justify-center items-center md:items-end px-4 border-l border-slate-800">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">EV Real (Ajustado)</p>
                    <div className="flex items-center gap-2">
                       <p className={`text-4xl font-black tracking-tighter ${calculatedEV >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {calculatedEV >= 0 ? '+' : ''}{calculatedEV.toFixed(1)}%
                       </p>
                    </div>
                    <p className="text-[8px] text-slate-500 mt-1 uppercase font-black tracking-widest">
                      {calculatedEV >= 10 ? '💎 VALOR ALTO' : calculatedEV >= 0 ? '✅ VALOR POSITIVO' : '⚠️ EV NEGATIVO'}
                    </p>
                  </div>
               </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 uppercase mb-1 block font-bold">Status Inicial</label>
              <div className="flex gap-2 h-10">
                {['pending', 'won', 'lost'].map(st => (
                  <button 
                    key={st}
                    type="button"
                    onClick={() => setNewBet({ ...newBet, status: st as any })}
                    className={`flex-1 rounded-lg font-bold text-[10px] uppercase transition-all shadow-sm ${
                      newBet.status === st 
                        ? (st === 'won' ? 'bg-emerald-500 text-slate-900 shadow-emerald-500/20' : st === 'lost' ? 'bg-red-500 text-slate-900 shadow-red-500/20' : 'bg-slate-600 text-white')
                        : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                    }`}
                  >
                    {st === 'won' ? 'Win' : st === 'lost' ? 'Loss' : 'Pendente'}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-4">
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-500 hover:text-white px-6 py-2 transition-colors font-bold uppercase text-[10px]"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-12 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 uppercase text-xs"
              >
                Confirmar Operação
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-5 bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl shadow-inner">🏆</div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Green Total</p>
            <p className="text-3xl font-black text-white">{bets.filter(b => b.status === 'won').length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-5 bg-red-500/5 border-red-500/10 hover:bg-red-500/10 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 text-xl shadow-inner">🛑</div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Red Total</p>
            <p className="text-3xl font-black text-white">{bets.filter(b => b.status === 'lost').length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-5 bg-slate-800/50 border-slate-700/30 hover:bg-slate-800 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-slate-700 flex items-center justify-center text-slate-400 text-xl shadow-inner">⌛</div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Em Aberto</p>
            <p className="text-3xl font-black text-white">{bets.filter(b => b.status === 'pending').length}</p>
          </div>
        </Card>
      </div>

      {/* Table Content */}
      <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
         <BetHistoryTable dynamicBets={filteredBets} markets={markets} onUpdate={load} />
      </div>
    </div>
  );
};

export default BetsPage;
