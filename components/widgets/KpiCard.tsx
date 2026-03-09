
import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import Card from '../Card';

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative';
  hasChart?: boolean;
}

const chartData = [
  { name: 'A', uv: 400 }, { name: 'B', uv: 300 }, { name: 'C', uv: 600 },
  { name: 'D', uv: 450 }, { name: 'E', uv: 700 }, { name: 'F', uv: 500 },
];

const KpiCard: React.FC<KpiCardProps> = ({ title, value, change, changeType, hasChart = false }) => {
  const isPositive = changeType === 'positive';
  const valueColor = title === 'Drawdown Máx' ? 'text-red-400' : 'text-white';
  const glowStyle = title === 'Banca Atual' ? {boxShadow: '0 0 20px rgba(16,185,129,0.4)'} : {};

  return (
    <Card className="relative overflow-hidden" style={glowStyle}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className={`text-2xl lg:text-3xl font-bold mt-1 ${valueColor}`}>{value}</p>
          {change && (
            <p className={`text-xs mt-2 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {change}
            </p>
          )}
        </div>
        {hasChart && (
          <div className="w-20 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line type="monotone" dataKey="uv" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
       {title === 'Banca Atual' && <div className="absolute top-0 left-0 h-full w-1 bg-emerald-400"></div>}
    </Card>
  );
};

export default KpiCard;
