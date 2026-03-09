
import React from 'react';
import Card from '../components/Card';
import WinRateChart from '../components/widgets/WinRateChart';
import PerformanceHeatmap from '../components/widgets/PerformanceHeatmap';

const StatisticsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <header className="mb-2">
        <h1 className="text-3xl font-bold text-white">Estatísticas Avançadas</h1>
        <p className="text-slate-400">Análise de variância, EV e comportamento operacional.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WinRateChart />
        <PerformanceHeatmap />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-slate-500 mb-4">Melhor Mercado</h3>
          <p className="text-2xl font-bold text-emerald-400">Gols Over 2.5</p>
          <p className="text-xs text-slate-500 mt-1">ROI: 32% | Volume: 15%</p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-slate-500 mb-4">Pior Mercado</h3>
          <p className="text-2xl font-bold text-red-400">BTTS - Não</p>
          <p className="text-xs text-slate-500 mt-1">ROI: -12% | Volume: 8%</p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-slate-500 mb-4">Odd Média Green</h3>
          <p className="text-2xl font-bold text-white">1.92</p>
          <p className="text-xs text-slate-500 mt-1">Esperado: 1.85</p>
        </Card>
      </div>
    </div>
  );
};

export default StatisticsPage;
