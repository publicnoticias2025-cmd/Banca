
import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import Card from '../Card';

const score = 82;
const data = [{ name: 'score', value: score }];

const EmotionalAlert: React.FC = () => {
    return (
        <div className="flex justify-between items-center mt-4">
            <span className="text-slate-400 text-sm">Alerta Emocional</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full">
                Estável
            </span>
        </div>
    )
}

const DisciplineScore: React.FC = () => {
  return (
    <Card className="flex flex-col">
      <h2 className="text-md font-semibold text-white">Disciplina</h2>
      <div className="flex-grow flex items-center justify-center relative -mt-4">
        <ResponsiveContainer width="100%" height={160}>
            <RadialBarChart 
                innerRadius="70%" 
                outerRadius="90%" 
                data={data} 
                startAngle={180} 
                endAngle={0}
                barSize={20}
            >
                <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                </defs>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar 
                    background={{ fill: '#334155' }}
                    dataKey="value" 
                    cornerRadius={10}
                    fill="url(#scoreGradient)"
                />
            </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute flex flex-col items-center justify-center">
            <span className="text-slate-400 text-xs">Score</span>
            <span className="text-4xl font-bold text-white -mt-1">{score}</span>
        </div>
      </div>
      <EmotionalAlert/>
    </Card>
  );
};

export default DisciplineScore;
