
import React from 'react';
import Card from '../Card';

const heatmapData = [
  [1, 2, 4, 5, 5, 8, 9, 9],
  [2, 3, 5, 6, 7, 9, 8, 9],
  [1, 1, 3, 4, 6, 7, 8, 9],
  [0, 1, 2, 3, 4, 5, 6, 7],
];

const getColor = (value: number) => {
  if (value >= 8) return 'bg-emerald-500/80';
  if (value >= 6) return 'bg-lime-500/80';
  if (value >= 4) return 'bg-yellow-500/80';
  if (value >= 2) return 'bg-orange-500/80';
  return 'bg-red-500/80';
};

const PerformanceHeatmap: React.FC = () => {
  const days = ['S', 'T', 'Q', 'Q', 'Q', 'S', 'S'];
  return (
    <Card>
      <h2 className="text-md font-semibold text-white mb-4">Heatmap de Performance</h2>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-8 gap-2 text-center text-xs text-slate-400">
            <div/>
            {days.map((day, i) => <div key={i}>{day}</div>)}
        </div>
        <div className="flex flex-col gap-2">
        {heatmapData.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-8 gap-2 items-center">
            <div className="text-xs text-slate-400 text-center">{rowIndex + 1}</div>
            {row.map((value, colIndex) => (
              <div key={colIndex} className={`w-full aspect-square rounded-md flex items-center justify-center ${getColor(value)}`}>
                <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
              </div>
            ))}
          </div>
        ))}
        </div>
      </div>
    </Card>
  );
};

export default PerformanceHeatmap;
