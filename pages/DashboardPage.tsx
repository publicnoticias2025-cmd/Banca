
import React, { useState, useEffect } from 'react';
import KpiCard from '../components/widgets/KpiCard';
import BankrollGrowthChart from '../components/widgets/BankrollGrowthChart';
import WinRateChart from '../components/widgets/WinRateChart';
import PerformanceHeatmap from '../components/widgets/PerformanceHeatmap';
import BetHistoryTable from '../components/widgets/BetHistoryTable';
import StakeManagementCard from '../components/widgets/StakeManagementCard';
import DisciplineScore from '../components/widgets/DisciplineScore';
import Card from '../components/Card';
import { BellIcon, CogIcon, SlidersHorizontalIcon } from '../components/icons/Icons';
import { api } from '../services/api';
import { BankrollStats, BankrollConfig } from '../types';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<BankrollStats | null>(null);
  const [config, setConfig] = useState<BankrollConfig | null>(null);

  useEffect(() => {
    const load = async () => {
      const [s, c] = await Promise.all([api.getBankrollStats(), api.getBankConfig()]);
      setStats(s);
      setConfig(c);
    };
    load();
  }, []);

  const dailyTarget = stats && config ? stats.current * (config.dailyInterest / 100) : 0;
  const progressPercent = dailyTarget > 0 ? (stats!.todayProfit / dailyTarget) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
       <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Resumo de performance e métricas em tempo real.</p>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          {/* Small Daily Meta Summary Card inside header row */}
          {stats && config && (
            <Card className="py-2 px-4 flex items-center gap-4 border-emerald-500/20 bg-emerald-500/5">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Projeção Hoje</p>
                <p className="text-sm font-bold text-white">R$ {dailyTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}></div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400">{Math.round(progressPercent)}%</span>
            </Card>
          )}
          <button className="p-2 rounded-full hover:bg-slate-800 transition-colors"><SlidersHorizontalIcon className="w-5 h-5"/></button>
          <button className="p-2 rounded-full hover:bg-slate-800 relative transition-colors">
            <BellIcon className="w-5 h-5"/>
            <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-emerald-500"></span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Banca Atual" value={`R$ ${stats?.current.toLocaleString() || '0'}`} change="+2.5%" changeType="positive" />
        <KpiCard title="ROI" value={`${stats?.roi.toFixed(1) || '0'}%`} change="+1.2%" changeType="positive" />
        <KpiCard title="Lucro Total" value={`R$ ${stats?.totalProfit.toLocaleString() || '0'}`} change="+R$150" changeType="positive" />
        <KpiCard title="Drawdown Máx" value={`${stats?.drawdown || '0'}%`} change="-0.5%" changeType="negative" hasChart={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BankrollGrowthChart />
        </div>
        <div>
          <StakeManagementCard />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WinRateChart />
        <PerformanceHeatmap />
        <DisciplineScore />
      </div>

      <div className="grid grid-cols-1">
        <BetHistoryTable />
      </div>
    </div>
  );
};

export default DashboardPage;
