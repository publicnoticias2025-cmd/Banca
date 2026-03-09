
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GrowthData } from '../../types';
import Card from '../Card';

const data: GrowthData[] = [
    { name: 'J', bank: 10000, growth: 2400 }, { name: 'F', bank: 13000, growth: 2210 },
    { name: 'M', bank: 12000, growth: 2290 }, { name: 'A', bank: 17800, growth: 2000 },
    { name: 'M', bank: 18900, growth: 2181 }, { name: 'J', bank: 23900, growth: 2500 },
    { name: 'J', bank: 24900, growth: 2100 }, { name: 'A', bank: 28000, growth: 2300 },
    { name: 'S', bank: 32000, growth: 2600 }, { name: 'O', bank: 35000, growth: 2800 },
    { name: 'N', bank: 41000, growth: 3100 }, { name: 'D', bank: 48000, growth: 3500 },
];

const BankrollGrowthChart: React.FC = () => {
    return (
        <Card className="h-[23.5rem]">
            <h2 className="text-lg font-semibold text-white mb-4">Crescimento da Banca</h2>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorBank" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '0.5rem',
                        }}
                        labelStyle={{ color: '#cbd5e1' }}
                    />
                    <Area type="monotone" dataKey="bank" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorBank)" />
                    <Area type="monotone" dataKey="growth" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorGrowth)" />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );
};

export default BankrollGrowthChart;
