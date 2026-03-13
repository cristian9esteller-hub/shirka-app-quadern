
import React from 'react';

interface ChartData {
    na: number;
    as: number;
    an: number;
    ae: number;
}

interface GlobalPerformanceChartProps {
    data: ChartData;
}

const GlobalPerformanceChart: React.FC<GlobalPerformanceChartProps> = ({ data }) => {
    const segments = [
        { label: 'No Assoliment (NA)', value: data.na, color: '#ef4444' },
        { label: 'Assoliment Satisfactori (AS)', value: data.as, color: '#f59e0b' },
        { label: 'Assoliment Notable (AN)', value: data.an, color: '#3b82f6' },
        { label: 'Assoliment Excel·lent (AE)', value: data.ae, color: 'var(--color-primary)' },
    ];

    const totalStudents = segments.reduce((sum, seg) => sum + seg.value, 0);

    if (totalStudents === 0) {
        return (
            <div className="text-center py-10 text-slate-500">
                <p>No hi ha dades suficients per mostrar el gràfic.</p>
                <p className="text-xs mt-1">Afegeix notes per veure el rendiment de la classe.</p>
            </div>
        );
    }
    
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercentage = 0;

    return (
        <div className="flex flex-col md:flex-row items-center gap-8 p-4">
            <div className="relative w-48 h-48 shrink-0">
                <svg viewBox="0 0 100 100" className="-rotate-90">
                    {segments.map((seg, index) => {
                        if (seg.value === 0) return null;
                        const percentage = (seg.value / totalStudents) * 100;
                        const offset = (accumulatedPercentage / 100) * circumference;
                        accumulatedPercentage += percentage;

                        return (
                            <circle
                                key={index}
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="transparent"
                                stroke={seg.color}
                                strokeWidth="15"
                                strokeDasharray={`${circumference} ${circumference}`}
                                strokeDashoffset={-offset}
                                className="transition-all duration-500 ease-in-out"
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-slate-800 dark:text-white">{totalStudents}</span>
                    <span className="text-xs text-slate-500">Alumnes</span>
                </div>
            </div>
            <div className="w-full space-y-3">
                {segments.map((seg, index) => {
                    const percentage = totalStudents > 0 ? (seg.value / totalStudents * 100).toFixed(1) : 0;
                    return (
                        <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }}></div>
                                <span className="text-slate-700 dark:text-slate-300">{seg.label}</span>
                            </div>
                            <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <span>{seg.value}</span>
                                <span className="text-xs font-normal text-slate-400">({percentage}%)</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GlobalPerformanceChart;
