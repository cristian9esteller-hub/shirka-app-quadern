import React, { useState, useMemo, useEffect } from 'react';
import Icon from '@/components/Icon';
import GlobalPerformanceChart from '@/components/GlobalPerformanceChart';
import { StudentAvatar } from '@/components/StudentAvatar';
import XLSX from 'xlsx-js-style';
import { useData } from '@/contexts/DataContext';

const TRIMESTRES = ['1r Trim', '2n Trim', '3r Trim'];

const getGradeColor = (grade: number | null) => {
  if (grade === null) return 'text-muted-foreground';
  if (grade < 5) return 'text-destructive';
  if (grade >= 9) return 'text-primary font-bold';
  return 'text-foreground';
};

const getAvgColor = (avg: number) => {
  if (avg < 5) return 'text-destructive';
  if (avg >= 9) return 'text-primary';
  if (avg >= 7) return 'text-blue-600 dark:text-blue-400';
  if (avg >= 5) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-foreground';
};

const Avaluacio: React.FC = () => {
  const { students, classes, activities, grades, profile, addActivity: onAddActivity, updateActivity: onUpdateActivity, deleteActivity: onDeleteActivity, upsertGrade: onUpsertGrade } = useData();
  const subjects = profile.subjects;

  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [activeSubject, setActiveSubject] = useState(subjects[0] || '');
  const [activeTerm, setActiveTerm] = useState(TRIMESTRES[0]);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [showFullView, setShowFullView] = useState(false);

  // Ensure activeSubject is valid if subjects list changes
  const classSubjects = useMemo(() => {
    const cls = classes.find(c => c.id === selectedClassId);
    return cls?.subjects && cls.subjects.length > 0 ? cls.subjects : subjects;
  }, [classes, selectedClassId, subjects]);

  useEffect(() => {
    if (classSubjects.length > 0 && !classSubjects.includes(activeSubject)) {
      setActiveSubject(classSubjects[0]);
    }
  }, [classSubjects, activeSubject]);

  // Activity Form State
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityWeight, setNewActivityWeight] = useState(20);
  const [newActivityDate, setNewActivityDate] = useState(new Date().toISOString().split('T')[0]);

  const classStudents = useMemo(() => students.filter(s => s.classId === selectedClassId), [students, selectedClassId]);

  const currentActivities = useMemo(() => {
    if (showFullView) {
      // Limit to max 10 activities and sort by date descending to show recent ones
      return activities
        .filter(a => a.classId === selectedClassId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    }
    return activities.filter(a => a.classId === selectedClassId && a.subject === activeSubject && a.term === activeTerm);
  }, [activities, selectedClassId, activeSubject, activeTerm, showFullView]);

  const getGrade = (studentId: string, activityId: string): number | null => {
    const g = grades.find(g => g.activityId === activityId && g.studentId === studentId);
    return g ? g.grade : null;
  };

  const calculateStudentAverage = (studentId: string) => {
    let weightedSum = 0, totalWeight = 0;
    currentActivities.forEach(act => {
      const grade = getGrade(studentId, act.id);
      if (grade !== null && grade !== undefined) {
        weightedSum += grade * (act.weight / 100);
        totalWeight += act.weight / 100;
      }
    });
    return totalWeight === 0 ? 0 : weightedSum / totalWeight;
  };

  const performanceStats = useMemo(() => {
    const stats = { na: 0, as: 0, an: 0, ae: 0 };
    if (classStudents.length === 0) return stats;
    classStudents.forEach(student => {
      const avg = calculateStudentAverage(student.id);
      if (avg > 0) {
        if (avg < 5) stats.na++;
        else if (avg < 7) stats.as++;
        else if (avg < 9) stats.an++;
        else stats.ae++;
      }
    });
    return stats;
  }, [classStudents, currentActivities, grades]);

  const classAverage = useMemo(() => {
    if (classStudents.length === 0) return 0;
    const avgs = classStudents.map(s => calculateStudentAverage(s.id)).filter(a => a > 0);
    if (avgs.length === 0) return 0;
    return avgs.reduce((a, b) => a + b, 0) / avgs.length;
  }, [classStudents, currentActivities, grades]);

  const totalWeight = currentActivities.reduce((sum, a) => sum + a.weight, 0);

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName.trim()) return;
    onAddActivity({
      name: newActivityName,
      weight: newActivityWeight,
      date: newActivityDate,
      classId: selectedClassId,
      subject: activeSubject,
      term: activeTerm,
    });
    setIsActivityModalOpen(false);
    setNewActivityName('');
    setNewActivityWeight(20);
  };

  const handleGradeChange = (studentId: string, activityId: string, value: string) => {
    const grade = value === '' ? null : parseFloat(value.replace(',', '.'));
    if (grade !== null && (isNaN(grade) || grade < 0 || grade > 10)) return;
    onUpsertGrade(activityId, studentId, grade);
  };

  const handleExport = () => {
    if (classStudents.length === 0) return;
    const data = classStudents.map(student => {
      const row: any = { 'Alumne': student.name };
      currentActivities.forEach(act => {
        row[act.name] = getGrade(student.id, act.id) ?? '';
      });
      row['Mitjana'] = calculateStudentAverage(student.id).toFixed(2);
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    const sheetName = showFullView ? "Avaluació Global" : (activeSubject || "Notes");
    // Ensure sheet name is not longer than 31 characters (Excel limit)
    const validSheetName = sheetName.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, validSheetName);
    const className = classes.find(c => c.id === selectedClassId)?.name || selectedClassId;
    const finalFileName = `Avaluacio_${className.toString().replace(/\s+/g, '_')}_${validSheetName.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, finalFileName);
  };

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-card rounded-[2.5rem] border-2 border-dashed border-border mt-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Icon name="settings" className="text-4xl text-primary animate-spin-slow" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Sense classes configurades</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Configura les teves classes al Perfil per començar a avaluar els teus alumnes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto max-w-full overflow-x-hidden px-4 sm:px-6 lg:px-8">
      {/* Premium Header */}
      {/* Stats Summary */}
      <div className="mt-4 mb-8 bg-card p-6 md:p-8 rounded-[2.5rem] border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rendiment Acadèmic</p>
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary text-[11px] font-black px-3 py-1.5 rounded-full border border-primary/20 whitespace-nowrap tracking-wider uppercase">
              {classStudents.length} ALUMNES REGISTRATS
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Icon name="assignment" className="text-2xl" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-6 mb-8 px-4 lg:px-2">
        {/* Row 1: Selectors & Filters */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
            <div className="flex items-stretch gap-3 flex-1 sm:flex-none">
              <div className="relative group flex-1 sm:w-48">
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="w-full appearance-none bg-secondary/50 border border-border hover:border-primary text-foreground h-[48px] pl-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold transition-all cursor-pointer text-sm"
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Icon name="groups" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-xl" />
              </div>

              <button
                onClick={() => setShowFullView(!showFullView)}
                className={`flex items-center justify-center gap-2 px-4 h-[48px] text-sm font-bold rounded-xl border shadow-sm transition-all flex-none ${showFullView ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-secondary'}`}
                title={showFullView ? 'Veure vista per assignatura' : 'Veure totes les assignatures'}
              >
                <Icon name={showFullView ? 'view_list' : 'grid_view'} type="outlined" className="text-[20px]" />
                <span className="hidden sm:inline">{showFullView ? 'Global' : 'Global'}</span>
              </button>
            </div>

            {!showFullView && (
              <div className="flex flex-col sm:flex-row items-stretch gap-3 flex-1">
                <div className="relative group flex-1 sm:w-48">
                  <select
                    value={activeSubject}
                    onChange={e => setActiveSubject(e.target.value)}
                    className="w-full appearance-none bg-secondary/50 border border-border hover:border-primary text-foreground h-[48px] pl-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold transition-all cursor-pointer text-sm"
                  >
                    {classSubjects.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <Icon name="menu_book" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-xl" />
                </div>
                <div className="flex bg-secondary/50 p-1.5 rounded-xl border border-border/50 h-[48px] flex-1 sm:flex-none">
                  {TRIMESTRES.map(term => (
                    <button
                      key={term}
                      onClick={() => setActiveTerm(term)}
                      className={`flex-1 sm:px-4 flex items-center justify-center text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTerm === term ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {term.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Action Buttons */}
        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-3 w-full">
          <button
            onClick={() => setIsChartModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 whitespace-nowrap px-4 h-[44px] text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors shadow-sm"
          >
            <Icon name="pie_chart" type="outlined" className="text-[18px]" />
            <span>Gràfic de Rendiment</span>
          </button>
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 whitespace-nowrap px-6 h-[44px] text-xs font-black text-white bg-[#b1454b] rounded-xl hover:bg-[#9a3b41] transition-all shadow-lg shadow-[#b1454b]/20 uppercase tracking-widest"
          >
            <Icon name="description" className="text-[18px]" />
            <span>Exportar</span>
          </button>
          <button
            onClick={() => setIsActivityModalOpen(true)}
            className="flex-[2] sm:flex-none flex items-center justify-center gap-2 whitespace-nowrap px-8 h-[44px] text-xs font-bold bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-95"
          >
            <Icon name="add" className="text-[18px]" />
            Nova Activitat
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="bg-card rounded-xl shadow-sm border border-border flex flex-col h-full overflow-hidden">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="bg-secondary text-muted-foreground text-xs uppercase font-semibold sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="sticky left-0 bg-secondary px-3 py-3 border-b border-r border-border w-48 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-2 text-[11px]">Alumne <Icon name="arrow_downward" className="text-[14px]" /></div>
                  </th>
                  {currentActivities.map(act => (
                    <th key={act.id} className={`group px-1 py-2 border-b border-r border-border ${showFullView ? 'min-w-[60px] max-w-[80px]' : 'min-w-[70px] max-w-[90px]'}`}>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span className="truncate max-w-[80px] text-[11px]" title={act.name}>{act.name}</span>
                          {!showFullView && (
                            <button onClick={() => { if (confirm('Segur que vols eliminar aquesta activitat i totes les seves notes?')) onDeleteActivity(act.id); }}
                              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-all">
                              <Icon name="delete" className="text-[13px]" />
                            </button>
                          )}
                        </div>
                        {showFullView && (
                          <span className="text-[8px] opacity-50 truncate">{act.subject} · {act.term}</span>
                        )}
                        <div className="flex justify-between text-[9px] items-center">
                          <span className="opacity-60">{new Date(act.date).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}</span>
                          <div className="flex items-center bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded font-bold text-[9px]">
                            <input
                              type="number"
                              value={act.weight}
                              onChange={e => onUpdateActivity(act.id, { weight: parseInt(e.target.value) })}
                              className="w-7 text-right bg-transparent outline-none text-[9px]"
                              min="0" max="100"
                            />
                            <span>%</span>
                          </div>
                        </div>
                      </div>
                    </th>
                  ))}
                  {currentActivities.length === 0 && (
                    <th className="px-4 py-8 text-center text-muted-foreground border-b border-border italic">No hi ha activitats creades</th>
                  )}
                  <th className="px-4 py-2 border-b border-border min-w-[100px] text-right bg-primary/10 sticky right-0 z-10 font-bold text-primary text-sm">⌀ Mitjana</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {classStudents.map(s => {
                  const avg = calculateStudentAverage(s.id);
                  return (
                    <tr key={s.id} className="group hover:bg-secondary/50 transition-colors">
                      <td className="sticky left-0 bg-card group-hover:bg-secondary/50 px-3 py-2 border-b border-r border-border z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center gap-2">
                          <StudentAvatar student={s} size="sm" />
                          <p className="text-foreground font-semibold truncate max-w-[140px] text-sm">{s.name}</p>
                        </div>
                      </td>
                      {currentActivities.map(act => {
                        const grade = getGrade(s.id, act.id);
                        return (
                          <td key={act.id} className="px-2 py-2 border-b border-r border-border text-center">
                            <input
                              className={`w-full text-center bg-transparent border border-transparent hover:border-border focus:border-primary focus:ring-1 focus:ring-primary/20 rounded font-bold transition-all ${getGradeColor(grade)} ${showFullView ? 'p-1 text-xs' : 'p-1.5 text-sm'}`}
                              type="text"
                              defaultValue={grade === null ? '' : grade.toString()}
                              placeholder="-"
                              onBlur={e => handleGradeChange(s.id, act.id, e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                            />
                          </td>
                        );
                      })}
                      {currentActivities.length === 0 && <td className="border-b border-border" />}
                      <td className={`px-4 py-2 border-b border-border text-right font-bold bg-primary/10 sticky right-0 z-10 text-base ${getAvgColor(avg)}`}>
                        {avg > 0 ? avg.toFixed(1) : '-'}
                      </td>
                    </tr>
                  );
                })}
                {classStudents.length === 0 && (
                  <tr><td colSpan={currentActivities.length + 2} className="p-12 text-center text-muted-foreground italic">No hi ha alumnes en aquesta classe.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Footer */}
          <div className="bg-secondary border-t border-border px-6 py-4 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-destructive" />NA (&lt;5)</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />AS (5-6)</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />AN (7-8)</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-primary" />AE (9-10)</div>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className={`flex items-center gap-2 font-bold ${totalWeight === 100 ? 'text-primary' : 'text-accent'}`}>
                <Icon name={totalWeight === 100 ? 'check_circle' : 'warning'} className="text-sm" />
                Pes Total: {totalWeight}% {totalWeight !== 100 && '(hauria de sumar 100%)'}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-sm border border-border">
              <span>Mitjana de la classe: </span>
              <span className={`font-bold text-sm ${getAvgColor(classAverage)}`}>{classAverage > 0 ? classAverage.toFixed(2) : '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Modal */}
      {isChartModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">
            <header className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Icon name="pie_chart" className="text-primary" /> Rendiment Global
              </h2>
              <button onClick={() => setIsChartModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <Icon name="close" />
              </button>
            </header>
            <main className="p-6">
              <GlobalPerformanceChart data={performanceStats} />
            </main>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden">
            <form onSubmit={handleAddActivity}>
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Icon name="assignment" className="text-primary" /> Nova Activitat Avaluable
                </h2>
                <button type="button" onClick={() => setIsActivityModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <Icon name="close" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Nom de l'activitat</label>
                  <input
                    type="text" required autoFocus
                    value={newActivityName}
                    onChange={e => setNewActivityName(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none text-foreground transition-all"
                    placeholder="Ex: Examen Unitat 3, Redacció..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Pes (%)</label>
                    <input
                      type="number" required min="1" max="100"
                      value={newActivityWeight}
                      onChange={e => setNewActivityWeight(parseInt(e.target.value))}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none text-foreground transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Data</label>
                    <input
                      type="date" required
                      value={newActivityDate}
                      onChange={e => setNewActivityDate(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none text-foreground transition-all"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground bg-secondary p-3 rounded-lg leading-relaxed italic border border-border/50">
                  * L'activitat s'afegirà al trimestre i assignatura seleccionats actualment. Pots modificar el pes total més endavant afegint o eliminant activitats.
                </p>
              </div>
              <div className="p-6 bg-secondary flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="flex-1 py-3 bg-card text-muted-foreground rounded-xl font-bold border border-border hover:bg-secondary transition-colors"
                >
                  CANCEL·LAR
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] hover:opacity-90"
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
