
import React from 'react';
import KpiCard from './widgets/KpiCard';
import BankrollGrowthChart from './widgets/BankrollGrowthChart';
import WinRateChart from './widgets/WinRateChart';
import PerformanceHeatmap from './widgets/PerformanceHeatmap';
import BetHistoryTable from './widgets/BetHistoryTable';
import StakeManagementCard from './widgets/StakeManagementCard';
import DisciplineScore from './widgets/DisciplineScore';
import { BellIcon, CogIcon, SlidersHorizontalIcon } from './icons/Icons';

const DashboardGrid: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
       <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Welcome back, get a summary of your performance.</p>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <button className="p-2 rounded-full hover:bg-slate-800"><SlidersHorizontalIcon className="w-5 h-5"/></button>
          <button className="p-2 rounded-full hover:bg-slate-800 relative">
            <BellIcon className="w-5 h-5"/>
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          <button className="p-2 rounded-full hover:bg-slate-800"><CogIcon className="w-5 h-5"/></button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Banca Atual" value="R$12,450" change="+2.5%" changeType="positive" />
        <KpiCard title="ROI" value="18.5%" change="+1.2%" changeType="positive" />
        <KpiCard title="Lucro Total" value="R$2,450" change="+R$150" changeType="positive" />
        <KpiCard title="Drawdown Máx" value="-15.7%" change="-0.5%" changeType="negative" hasChart={true} />
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

export default DashboardGrid;
