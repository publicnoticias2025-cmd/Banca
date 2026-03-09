
import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { api } from '../../services/api';
import { StakeConfig, BankrollStats } from '../../types';

const RiskLevelBar: React.FC<{ level: number }> = ({ level }) => {
  const totalBars = 18;
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: totalBars }).map((_, i) => {
        let color = 'bg-slate-600';
        if (i < level) {
          if (i < totalBars * 0.6) color = 'bg-emerald-500';
          else if (i < totalBars * 0.8) color = 'bg-yellow-500';
          else color = 'bg-red-500';
        }
        if (i === level - 1) {
            return <div key={i} className={`h-4 w-4 rounded-sm ${color} shadow-[0_0_10px] shadow-emerald-400 transition-all`}></div>
        }
        return <div key={i} className={`h-2 flex-1 rounded-full ${color} transition-all`}></div>;
      })}
    </div>
  );
};

const StakeManagementCard: React.FC = () => {
  const [stakeConfig, setStakeConfig] = useState<StakeConfig | null>(null);
  const [bankStats, setBankStats] = useState<BankrollStats | null>(null);

  useEffect(() => {
    const load = async () => {
      const [sc, bs] = await Promise.all([api.getStakeConfig(), api.getBankrollStats()]);
      setStakeConfig(sc);
      setBankStats(bs);
    };
    load();
  }, []);

  if (!stakeConfig || !bankStats) return null;

  // Calculate generic recommended stake for display (assuming 2.00 odd and 55% prob for visualization)
  const recommended = api.calculateRecommendedStake(bankStats.current, stakeConfig, {
    odd: 2.00,
    probability: 55,
  });

  const getModeLabel = (mode: string) => {
    switch(mode) {
      case 'manual': return 'Manual';
      case 'percent': return `${stakeConfig.percent}% da Banca`;
      case 'kelly': return `Kelly (${stakeConfig.kellyFraction === 1 ? 'Full' : 'Fração'})`;
      case 'market': return 'Por Mercado';
      default: return 'Desconhecido';
    }
  };

  return (
    <Card className="h-full flex flex-col justify-between border-emerald-500/10">
      <h2 className="text-lg font-bold text-white mb-4">Gestão de Stake</h2>

      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Capital Ativo:</span>
          <span className="font-bold text-white">R$ {bankStats.current.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Modelo Ativo:</span>
          <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-widest">{getModeLabel(stakeConfig.mode)}</span>
        </div>
      </div>
      
      <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center shadow-[0_0_20px_rgba(16,185,129,0.05)]">
        <p className="text-[10px] text-emerald-500 uppercase font-black tracking-[0.2em]">Stake Base Sugerida</p>
        <p className="text-4xl font-black text-white mt-2">R$ {recommended > 0 ? recommended.toLocaleString() : '---'}</p>
        <p className="text-[8px] text-slate-500 mt-2 uppercase">Baseada em ROI médio e exposição segura</p>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Nível de Exposição</p>
          <span className="text-[10px] text-emerald-400 font-bold">CONTROLADO</span>
        </div>
        <RiskLevelBar level={stakeConfig.mode === 'kelly' ? 14 : stakeConfig.mode === 'manual' ? 8 : 11} />
      </div>
    </Card>
  );
};

export default StakeManagementCard;
