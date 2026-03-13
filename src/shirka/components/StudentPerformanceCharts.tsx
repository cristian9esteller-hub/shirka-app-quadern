
import React, { useState, useMemo } from 'react';
import Icon from './Icon';
import { Student, EvaluationData } from '../types';

const TRIMESTRES = ['1r Trim', '2n Trim', '3r Trim'];

interface ChartProps {
    student: Student;
    studentsInClass: Student[];
    evaluationData: EvaluationData;
    subject: string;
}

const StudentPerformanceCharts: React.FC<ChartProps> = ({ student, studentsInClass, evaluationData, subject }) => {
    const [chartType, setChartType] = useState<'evolution' | 'comparison'>('evolution');

    const calculateAverage = (studentId: string, termData: any): number | null => {
        if (!termData || !termData.grades || !termData.activities || termData.activities.length === 0) {
            return null;
        }

        const studentGrades = termData.grades[studentId] || {};
        let weightedSum = 0;
        let totalWeight = 0;

        termData.activities.forEach((act: any) => {
            const grade = studentGrades[act.id];
            if (grade !== null && grade !== undefined) {
                weightedSum += grade * act.weight;
                totalWeight += act.weight;
            }
        });

        return totalWeight > 0 ? weightedSum / totalWeight : null;
    };

    const chartData = useMemo(() => {
        const evolution: { term: string; grade: number | null }[] = [];
        const comparison: { term: string; studentAvg: number | null; classAvg: number | null }[] = [];

        TRIMESTRES.forEach(term => {
            const termData = evaluationData[student.classId]?.[subject]?.[term];
            const studentAvg = calculateAverage(student.id, termData);
            
            evolution.push({ term, grade: studentAvg });

            if (termData) {
                const classGrades = studentsInClass
                    .map(s => calculateAverage(s.id, termData))
                    .filter((g): g is number => g !== null);
                
                const classAvg = classGrades.length > 0 ? classGrades.reduce((a, b) => a + b, 0) / classGrades.length : null;
                comparison.push({ term, studentAvg, classAvg });
            } else {
                 comparison.push({ term, studentAvg: null, classAvg: null });
            }
        });

        return { evolution, comparison };

    }, [student, studentsInClass, evaluationData, subject]);


    if (chartData.evolution.every(d => d.grade === null)) {
        return <div className="text-center py-10 text-sm text-slate-400">No hi ha dades per a l'assignatura de {subject}.</div>;
    }

    // SVG rendering for charts
    const width = 300;
    const height = 150;
    const padding = { top: 10, right: 10, bottom: 20, left: 25 };

    const getY = (grade: number) => height - padding.bottom - ((grade / 10) * (height - padding.top - padding.bottom));
    const getX = (index: number, totalPoints: number) => padding.left + (index * (width - padding.left - padding.right) / (totalPoints - 1 || 1));

    return (
        <div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit mb-4">
                <button onClick={() => setChartType('evolution')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${chartType === 'evolution' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500'}`}>Evolució</button>
                <button onClick={() => setChartType('comparison')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${chartType === 'comparison' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500'}`}>Comparativa</button>
            </div>
            
            {chartType === 'evolution' && (
                <div className="w-full">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                        {/* Y-Axis lines and labels */}
                        {[0, 5, 10].map(grade => (
                            <g key={grade}>
                                <line x1={padding.left} y1={getY(grade)} x2={width - padding.right} y2={getY(grade)} stroke="var(--color-slate-200, #e2e8f0)" strokeDasharray="2" />
                                <text x={padding.left - 5} y={getY(grade) + 3} textAnchor="end" fill="var(--color-slate-400, #94a3b8)" fontSize="8">{grade}</text>
                            </g>
                        ))}

                        {/* Data line and points */}
                        <polyline
                            fill="none"
                            stroke="var(--color-primary)"
                            strokeWidth="2"
                            points={chartData.evolution
                                .map((d, i) => d.grade !== null ? `${getX(i, chartData.evolution.length)},${getY(d.grade)}` : '')
                                .filter(Boolean)
                                .join(' ')}
                        />
                        {chartData.evolution.map((d, i) => d.grade !== null && (
                            <g key={i}>
                                <circle cx={getX(i, chartData.evolution.length)} cy={getY(d.grade)} r="3" fill="var(--color-primary)" />
                                <text x={getX(i, chartData.evolution.length)} y={getY(d.grade) - 6} textAnchor="middle" fill="var(--color-slate-600)" fontSize="8" fontWeight="bold">{d.grade.toFixed(1)}</text>
                            </g>
                        ))}

                        {/* X-Axis labels */}
                        {chartData.evolution.map((d, i) => (
                            <text key={i} x={getX(i, chartData.evolution.length)} y={height - 5} textAnchor="middle" fill="var(--color-slate-500)" fontSize="8">{d.term}</text>
                        ))}
                    </svg>
                </div>
            )}

            {chartType === 'comparison' && (
                <div>
                     <div className="flex justify-center gap-4 text-xs mb-2">
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary/50"></span>La teva nota</div>
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-300"></span>Mitjana Classe</div>
                    </div>
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                         {/* Y-Axis lines and labels */}
                        {[0, 5, 10].map(grade => (
                            <g key={grade}>
                                <line x1={padding.left} y1={getY(grade)} x2={width - padding.right} y2={getY(grade)} stroke="var(--color-slate-200, #e2e8f0)" strokeDasharray="2" />
                                <text x={padding.left - 5} y={getY(grade) + 3} textAnchor="end" fill="var(--color-slate-400, #94a3b8)" fontSize="8">{grade}</text>
                            </g>
                        ))}

                        {/* Bars */}
                        {chartData.comparison.map((d, i) => {
                            const barWidth = 12;
                            const x = padding.left + (i * (width - padding.left - padding.right) / chartData.comparison.length) + ((width / chartData.comparison.length - barWidth*2 - 5)/2);
                            
                            return (
                                <g key={i}>
                                    {/* Class Avg Bar */}
                                    {d.classAvg !== null && (
                                        <rect 
                                            x={x}
                                            y={getY(d.classAvg)}
                                            width={barWidth}
                                            height={height - padding.bottom - getY(d.classAvg)}
                                            fill="#cbd5e1"
                                            rx="2"
                                        />
                                    )}
                                    {/* Student Avg Bar */}
                                     {d.studentAvg !== null && (
                                        <rect 
                                            x={x + barWidth + 5}
                                            y={getY(d.studentAvg)}
                                            width={barWidth}
                                            height={height - padding.bottom - getY(d.studentAvg)}
                                            fill="var(--color-primary)"
                                            opacity="0.6"
                                            rx="2"
                                        />
                                    )}
                                     {/* X-Axis labels */}
                                    <text x={x + barWidth + 2.5} y={height - 5} textAnchor="middle" fill="var(--color-slate-500)" fontSize="8">{d.term}</text>
                                </g>
                            )
                        })}
                    </svg>
                </div>
            )}
        </div>
    );
};

export default StudentPerformanceCharts;
