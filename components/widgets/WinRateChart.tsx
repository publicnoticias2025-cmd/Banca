
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { WinRateData } from '../../types';
import Card from '../Card';

const data: WinRateData[] = [
  { name: 'W1', value: 20 }, { name: 'W2', value: 35 }, { name: 'W3', value: 30 },
  { name: 'W4', value: 45 }, { name: 'W5', value: 40 }, { name: 'W6', value: 55 },
  { name: 'W7', value: 60 }, { name: 'W8', value: 50 }, { name: 'W9', value: 70 },
  { name: 'W10', value: 80 }, { name: 'W11', value: 75 }, { name: 'W12', value: 90 },
];
const colors = ['#10b981'];

const WinRateChart: React.FC = () => {
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-md font-semibold text-white">Win Rate <span className="text-emerald-400">57.2%</span></h2>
        <h2 className="text-md font-semibold text-white">EV Médio <span className="text-emerald-400">+6.8%</span></h2>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" hide={true} />
          <YAxis hide={true} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
             {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="url(#barGradient)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default WinRateChart;
