import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PerformanceStats {
  na: number;
  as: number;
  an: number;
  ae: number;
}

interface GlobalPerformanceChartProps {
  data: PerformanceStats;
}

const SEGMENTS = [
  { key: 'na', label: 'NA (<5)', color: 'hsl(var(--destructive))' },
  { key: 'as', label: 'AS (5-6)', color: '#eab308' },
  { key: 'an', label: 'AN (7-8)', color: '#3b82f6' },
  { key: 'ae', label: 'AE (9-10)', color: 'hsl(var(--primary))' },
];

const GlobalPerformanceChart: React.FC<GlobalPerformanceChartProps> = ({ data }) => {
  const total = data.na + data.as + data.an + data.ae;

  if (total === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p className="text-lg font-medium">No hi ha dades per mostrar</p>
        <p className="text-sm mt-1">Afegeix notes als alumnes per veure el gràfic.</p>
      </div>
    );
  }

  const chartData = SEGMENTS
    .map(seg => ({ name: seg.label, value: data[seg.key as keyof PerformanceStats], color: seg.color }))
    .filter(d => d.value > 0);

  return (
    <div className="space-y-4">
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} alumnes (${((value / total) * 100).toFixed(1)}%)`, name]}
              contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {SEGMENTS.map(seg => {
          const count = data[seg.key as keyof PerformanceStats];
          return (
            <div key={seg.key} className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
              <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <div>
                <p className="text-sm font-bold text-foreground">{seg.label}</p>
                <p className="text-xs text-muted-foreground">{count} alumnes ({total > 0 ? ((count / total) * 100).toFixed(1) : 0}%)</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Total: <span className="font-bold text-foreground">{total}</span> alumnes avaluats
      </div>
    </div>
  );
};

export default GlobalPerformanceChart;
