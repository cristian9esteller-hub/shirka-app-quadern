
import React, { useState, useMemo, useEffect } from 'react';
import Icon from '../components/Icon';
import { Student, ClassGroup, EvaluationData, Activity, SubjectEvaluation } from '../types';
import GlobalPerformanceChart from '../components/GlobalPerformanceChart';

declare var XLSX: any;

interface AvaluacioProps {
    students: Student[];
    classes: ClassGroup[];
    evaluationData: EvaluationData;
    setEvaluationData: React.Dispatch<React.SetStateAction<EvaluationData>>;
    subjects: string[];
}

const TRIMESTRES = ['1r Trim', '2n Trim', '3r Trim'];

const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-slate-400';
    if (grade < 5) return 'text-red-500';
    if (grade >= 9) return 'text-primary font-bold';
    return 'text-slate-700 dark:text-slate-200';
};

const getAvgColor = (avg: number) => {
    if (avg < 5) return 'text-red-500';
    if (avg >= 9) return 'text-primary';
    if (avg >= 7) return 'text-blue-600 dark:text-blue-400';
    if (avg >= 5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-slate-700 dark:text-slate-300';
};

const Avaluacio: React.FC<AvaluacioProps> = ({ students, classes, evaluationData, setEvaluationData, subjects }) => {
    const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
    const [activeSubject, setActiveSubject] = useState(subjects[0] || '');
    const [activeTerm, setActiveTerm] = useState(TRIMESTRES[0]);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isChartModalOpen, setIsChartModalOpen] = useState(false);
    
    // Ensure activeSubject is valid if subjects list changes
    useEffect(() => {
        if (subjects.length > 0 && !subjects.includes(activeSubject)) {
            setActiveSubject(subjects[0]);
        }
    }, [subjects, activeSubject]);

    // Activity Form State
    const [newActivityName, setNewActivityName] = useState('');
    const [newActivityWeight, setNewActivityWeight] = useState(20);
    const [newActivityDate, setNewActivityDate] = useState(new Date().toISOString().split('T')[0]);

    // Derived Data
    const classStudents = useMemo(() => students.filter(s => s.classId === selectedClassId), [students, selectedClassId]);
    
    const currentEval: SubjectEvaluation = useMemo(() => {
        return evaluationData[selectedClassId]?.[activeSubject]?.[activeTerm] || { activities: [], grades: {} };
    }, [evaluationData, selectedClassId, activeSubject, activeTerm]);

    const handleUpdateGrade = (studentId: string, activityId: string, value: string) => {
        const grade = value === '' ? null : parseFloat(value.replace(',', '.'));
        if (grade !== null && (isNaN(grade) || grade < 0 || grade > 10)) return;

        setEvaluationData(prev => {
            const newData = { ...prev };
            if (!newData[selectedClassId]) newData[selectedClassId] = {};
            if (!newData[selectedClassId][activeSubject]) newData[selectedClassId][activeSubject] = {};
            if (!newData[selectedClassId][activeSubject][activeTerm]) {
                newData[selectedClassId][activeSubject][activeTerm] = { activities: [], grades: {} };
            }

            const evalObj = newData[selectedClassId][activeSubject][activeTerm];
            if (!evalObj.grades[studentId]) evalObj.grades[studentId] = {};
            evalObj.grades[studentId][activityId] = grade;

            return newData;
        });
    };

    const handleUpdateActivity = (activityId: string, newWeight: number) => {
        if (isNaN(newWeight) || newWeight < 0 || newWeight > 100) return;

        setEvaluationData(prev => {
            const newData = JSON.parse(JSON.stringify(prev));
            const evalObj = newData[selectedClassId]?.[activeSubject]?.[activeTerm];
            if (!evalObj) return prev;

            const activity = evalObj.activities.find((a: Activity) => a.id === activityId);
            if (activity) {
                activity.weight = newWeight;
            }
            return newData;
        });
    };

    const handleAddActivity = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newActivityName.trim()) return;

        const newActivity: Activity = {
            id: `act-${Date.now()}`,
            name: newActivityName,
            weight: newActivityWeight,
            date: newActivityDate
        };

        setEvaluationData(prev => {
            const newData = { ...prev };
            if (!newData[selectedClassId]) newData[selectedClassId] = {};
            if (!newData[selectedClassId][activeSubject]) newData[selectedClassId][activeSubject] = {};
            if (!newData[selectedClassId][activeSubject][activeTerm]) {
                newData[selectedClassId][activeSubject][activeTerm] = { activities: [], grades: {} };
            }

            newData[selectedClassId][activeSubject][activeTerm].activities.push(newActivity);
            return newData;
        });

        setIsActivityModalOpen(false);
        setNewActivityName('');
    };

    const handleDeleteActivity = (activityId: string) => {
        if (!confirm('Segur que vols eliminar aquesta activitat i totes les seves notes?')) return;

        setEvaluationData(prev => {
            const newData = { ...prev };
            const evalObj = newData[selectedClassId][activeSubject][activeTerm];
            evalObj.activities = evalObj.activities.filter(a => a.id !== activityId);
            
            Object.keys(evalObj.grades).forEach(studentId => {
                delete evalObj.grades[studentId][activityId];
            });

            return newData;
        });
    };

    const calculateStudentAverage = (studentId: string) => {
        const studentGrades = currentEval.grades[studentId] || {};
        let weightedSum = 0;
        let totalWeight = 0;

        currentEval.activities.forEach(act => {
            const grade = studentGrades[act.id];
            if (grade !== null && grade !== undefined) {
                weightedSum += grade * (act.weight / 100);
                totalWeight += (act.weight / 100);
            }
        });

        if (totalWeight === 0) return 0;
        return weightedSum / totalWeight;
    };

    const performanceStats = useMemo(() => {
        const stats = { na: 0, as: 0, an: 0, ae: 0 };
        if (classStudents.length === 0) return stats;

        classStudents.forEach(student => {
            const avg = calculateStudentAverage(student.id);
            if (avg > 0) { // Only count students with grades
                if (avg < 5) stats.na++;
                else if (avg < 7) stats.as++;
                else if (avg < 9) stats.an++;
                else stats.ae++;
            }
        });
        return stats;
    }, [classStudents, currentEval]);

    const classAverage = useMemo(() => {
        if (classStudents.length === 0) return 0;
        const sums = classStudents.map(s => calculateStudentAverage(s.id));
        const validSums = sums.filter(s => s > 0);
        if (validSums.length === 0) return 0;
        return validSums.reduce((a, b) => a + b, 0) / validSums.length;
    }, [classStudents, currentEval]);

    const handleExport = () => {
        if (classStudents.length === 0) return;

        const data = classStudents.map(student => {
            const row: any = { 'Alumne': student.name };
            currentEval.activities.forEach(act => {
                row[act.name] = currentEval.grades[student.id]?.[act.id] ?? '';
            });
            row['Mitjana'] = calculateStudentAverage(student.id).toFixed(2);
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Notes");
        XLSX.writeFile(wb, `Avaluacio_${activeSubject}_${selectedClassId}.xlsx`);
    };

    const totalWeight = currentEval.activities.reduce((sum, a) => sum + a.weight, 0);

    return (
        <div className="bg-background-light dark:bg-background-dark h-full flex flex-col">
            {/* Toolbar */}
            <div className="px-6 py-5 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shrink-0">
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <div className="relative group">
                        <select 
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="appearance-none bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-200 py-2.5 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium transition-all cursor-pointer"
                        >
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <Icon name="groups" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl" />
                    </div>

                    <div className="relative group">
                        <select 
                            value={activeSubject}
                            onChange={(e) => setActiveSubject(e.target.value)}
                            className="appearance-none bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-200 py-2.5 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium transition-all cursor-pointer"
                        >
                            {subjects.map(m => <option key={m}>{m}</option>)}
                        </select>
                        <Icon name="menu_book" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl" />
                    </div>

                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                        {TRIMESTRES.map(term => (
                            <button 
                                key={term} 
                                onClick={() => setActiveTerm(term)} 
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTerm === term ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
                     <button 
                        onClick={() => setIsChartModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 transition-colors shadow-sm"
                    >
                        <Icon name="pie_chart" type="outlined" className="text-[18px]" />
                        <span className="hidden sm:inline">Veure Gràfic Global</span>
                    </button>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        <Icon name="download" type="outlined" className="text-[18px]" />
                        <span className="hidden sm:inline">Exportar</span>
                    </button>
                    <button 
                        onClick={() => setIsActivityModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-900 bg-primary hover:bg-primary-dark rounded-lg shadow-sm shadow-primary/30 transition-all"
                    >
                        <Icon name="add" className="text-[18px]" />
                        Nova Activitat
                    </button>
                </div>
            </div>

            {/* Data Grid */}
            <div className="flex-1 px-6 pb-6 min-h-0 overflow-hidden flex flex-col">
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold sticky top-0 z-20 shadow-sm">
                                <tr>
                                    <th className="sticky left-0 bg-slate-50 dark:bg-slate-900 px-4 py-4 border-b border-r border-slate-200 dark:border-slate-700 w-64 z-10">
                                        <div className="flex items-center gap-2">Alumne <Icon name="arrow_downward" className="text-[16px]" /></div>
                                    </th>
                                    {currentEval.activities.map(act => (
                                        <th key={act.id} className="group px-4 py-2 border-b border-r border-slate-200 dark:border-slate-700 min-w-[140px]">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="truncate max-w-[100px]">{act.name}</span>
                                                    <button onClick={() => handleDeleteActivity(act.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                                                        <Icon name="delete" className="text-[14px]" />
                                                    </button>
                                                </div>
                                                <div className="flex justify-between text-[10px] items-center">
                                                    <span className="opacity-60">{new Date(act.date).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}</span>
                                                    <div className="flex items-center bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded font-bold">
                                                        <input 
                                                          type="number" 
                                                          value={act.weight}
                                                          onChange={e => handleUpdateActivity(act.id, parseInt(e.target.value))}
                                                          className="w-8 text-right bg-transparent outline-none"
                                                          min="0" max="100"
                                                        />
                                                        <span>%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                    {currentEval.activities.length === 0 && (
                                        <th className="px-4 py-8 text-center text-slate-400 border-b border-slate-200 dark:border-slate-700 italic">No hi ha activitats creades</th>
                                    )}
                                    <th className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 min-w-[100px] text-right bg-slate-100/50 dark:bg-slate-800 sticky right-0 z-10">Mitjana</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium">
                                {classStudents.map((s) => (
                                <tr key={s.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="sticky left-0 bg-surface-light dark:bg-surface-dark group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50 px-4 py-3 border-b border-r border-slate-200 dark:border-slate-700 z-10">
                                        <div className="flex items-center gap-3">
                                            <img alt={s.name} src={s.avatar} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" />
                                            <p className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-[180px]">{s.name}</p>
                                        </div>
                                    </td>
                                    {currentEval.activities.map(act => {
                                        const grade = currentEval.grades[s.id]?.[act.id];
                                        return (
                                            <td key={act.id} className="px-2 py-2 border-b border-r border-slate-200 dark:border-slate-700 text-center">
                                                <input 
                                                    className={`w-full text-center bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded p-1.5 font-bold transition-all ${getGradeColor(grade ?? null)}`} 
                                                    type="text" 
                                                    defaultValue={grade === null || grade === undefined ? '' : grade.toString()} 
                                                    placeholder="-"
                                                    onBlur={(e) => handleUpdateGrade(s.id, act.id, e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                                />
                                            </td>
                                        );
                                    })}
                                    {currentEval.activities.length === 0 && <td className="border-b border-slate-200 dark:border-slate-700"></td>}
                                    <td className={`px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-right font-bold bg-slate-50 dark:bg-slate-800/50 sticky right-0 z-10 ${getAvgColor(calculateStudentAverage(s.id))}`}>
                                        {calculateStudentAverage(s.id) > 0 ? calculateStudentAverage(s.id).toFixed(1) : '-'}
                                    </td>
                                </tr>
                                ))}
                                {classStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={currentEval.activities.length + 2} className="p-12 text-center text-slate-500 italic">No hi ha alumnes en aquesta classe.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                     <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-6 flex-wrap">
                            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>NA (&lt;5)</div>
                            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>AS (5-6)</div>
                            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>AN (7-8)</div>
                            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-primary"></span>AE (9-10)</div>
                            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
                            <div className={`flex items-center gap-2 font-bold ${totalWeight === 100 ? 'text-primary' : 'text-amber-500'}`}>
                                <Icon name={totalWeight === 100 ? "check_circle" : "warning"} className="text-sm" />
                                Pes Total: {totalWeight}% {totalWeight !== 100 && '(hauria de sumar 100%)'}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-surface-dark px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-800">
                            <span>Mitjana de la classe: </span>
                            <span className={`font-bold text-sm ${getAvgColor(classAverage)}`}>{classAverage > 0 ? classAverage.toFixed(2) : '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {isChartModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                        <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Icon name="pie_chart" className="text-primary" /> Rendiment Global
                            </h2>
                            <button onClick={() => setIsChartModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <Icon name="close" />
                            </button>
                        </header>
                        <main className="p-6">
                            <GlobalPerformanceChart data={performanceStats} />
                        </main>
                    </div>
                </div>
            )}

            {isActivityModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                        <form onSubmit={handleAddActivity}>
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Icon name="assignment" className="text-primary" /> Nova Activitat Avaluable
                                </h2>
                                <button type="button" onClick={() => setIsActivityModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <Icon name="close" />
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nom de l'activitat</label>
                                    <input 
                                        type="text" 
                                        required
                                        autoFocus
                                        value={newActivityName}
                                        onChange={e => setNewActivityName(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder="Ex: Examen Unitat 3, Redacció..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Pes (%)</label>
                                        <input 
                                            type="number" 
                                            required
                                            min="1"
                                            max="100"
                                            value={newActivityWeight}
                                            onChange={e => setNewActivityWeight(parseInt(e.target.value))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
                                        <input 
                                            type="date" 
                                            required
                                            value={newActivityDate}
                                            onChange={e => setNewActivityDate(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg leading-relaxed italic border border-slate-100 dark:border-slate-700/50">
                                    * L'activitat s'afegirà al trimestre i assignatura seleccionats actualment. Pots modificar el pes total més endavant afegint o eliminant activitats.
                                </p>
                            </div>

                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsActivityModalOpen(false)}
                                    className="flex-1 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    CANCEL·LAR
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                                >
                                    AFEGIR
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Avaluacio;
