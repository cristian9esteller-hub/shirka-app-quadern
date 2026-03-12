import React, { useState, useMemo, useEffect } from 'react';
import Icon from '@/components/Icon';
import { StudentAvatar } from '@/components/StudentAvatar';
import XLSX from 'xlsx-js-style';
import { useData } from '@/contexts/DataContext';
import type { AttendanceStatus, AttendanceRecord } from '@/types';
import { toast } from 'sonner';

const StatusButton: React.FC<{
  label: AttendanceStatus;
  activeStatus: AttendanceStatus;
  onClick: () => void;
}> = ({ label, activeStatus, onClick }) => {
  const isActive = label === activeStatus;

  const statusStyles: Record<AttendanceStatus, string> = {
    Present: isActive ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105 border-primary' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 text-slate-400 hover:bg-white hover:text-slate-600',
    Falta: isActive ? 'bg-[#ef4444] text-white shadow-lg shadow-red-500/30 scale-105 border-[#ef4444]' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 text-slate-400 hover:bg-white hover:text-slate-600',
    Retard: isActive ? 'bg-[#f59e0b] text-white shadow-lg shadow-amber-500/30 scale-105 border-[#f59e0b]' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 text-slate-400 hover:bg-white hover:text-slate-600',
    Justificat: isActive ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/30 scale-105 border-[#3b82f6]' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 text-slate-400 hover:bg-white hover:text-slate-600',
  };

  return (
    <button
      onClick={onClick}
      className={`px-8 py-3.5 rounded-2xl text-xs font-black transition-all border uppercase tracking-[0.15em] active:scale-95 ${statusStyles[label]}`}
    >
      {label}
    </button>
  );
};

const Assistencia: React.FC = () => {
  const { students: allStudents, classes, attendance, upsertAttendance: onUpsertAttendance } = useData();
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [localAttendance, setLocalAttendance] = useState<Record<string, { morningStatus: AttendanceStatus; afternoonStatus: AttendanceStatus }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [session, setSession] = useState<'mati' | 'tarda'>('mati');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportSelectionMode, setExportSelectionMode] = useState<'all' | 'specific'>('all');
  const [selectedExportStudentIds, setSelectedExportStudentIds] = useState<string[]>([]);
  const [exportStartDate, setExportStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculate day difference for safety limit
  const diffDays = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const isExportDisabled = diffDays > 31;

  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const dateKey = currentDate.toISOString().split('T')[0];

  // Initialize local attendance from global data when date or class changes
  useEffect(() => {
    const initialLocal: Record<string, { morningStatus: AttendanceStatus; afternoonStatus: AttendanceStatus }> = {};
    allStudents.filter(s => s.classId === selectedClassId).forEach(student => {
      const record = attendance.find(a => a.studentId === student.id && a.date === dateKey);
      initialLocal[student.id] = record
        ? { morningStatus: record.morningStatus, afternoonStatus: record.afternoonStatus }
        : { morningStatus: 'Present', afternoonStatus: 'Present' };
    });
    setLocalAttendance(initialLocal);
  }, [attendance, dateKey, selectedClassId, allStudents]);

  const classStudents = useMemo(() => allStudents.filter(s => s.classId === selectedClassId), [allStudents, selectedClassId]);

  const getAttendance = (studentId: string): { mati: AttendanceStatus; tarda: AttendanceStatus } => {
    const local = localAttendance[studentId];
    if (local) return { mati: local.morningStatus, tarda: local.afternoonStatus };
    return { mati: 'Present', tarda: 'Present' };
  };

  const attendanceList = useMemo(() => {
    const filtered = classStudents.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered.map(student => ({
      ...student,
      status: getAttendance(student.id),
    }));
  }, [classStudents, attendance, dateKey, searchTerm]);

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setLocalAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [session === 'mati' ? 'morningStatus' : 'afternoonStatus']: status
      }
    }));
  };

  const markAllPresent = () => {
    const updated = { ...localAttendance };
    classStudents.forEach(student => {
      updated[student.id] = {
        ...updated[student.id],
        [session === 'mati' ? 'morningStatus' : 'afternoonStatus']: 'Present'
      };
    });
    setLocalAttendance(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Process all local changes to global state/Supabase
      const promises = Object.entries(localAttendance).map(([studentId, status]) =>
        onUpsertAttendance(
          studentId,
          selectedClassId,
          dateKey,
          status.morningStatus,
          status.afternoonStatus
        )
      );
      await Promise.all(promises);
      toast.success('Assistència desada correctament');
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Error al desar l\'assistència');
    } finally {
      setIsSaving(false);
    }
  };

  const navigateDate = (amount: number) => {
    setCurrentDate(d => {
      const newDate = new Date(d);
      newDate.setDate(d.getDate() + amount);
      return newDate;
    });
  };

  const handleExportExcel = () => {
    setIsExportModalOpen(true);
    // Reiniciar selección por defecto
    setSelectedExportStudentIds(classStudents.map(s => s.id));
    setExportSelectionMode('all');
  };

  const processExport = () => {
    const start = new Date(exportStartDate);
    const end = new Date(exportEndDate);
    const dateArray: string[] = [];
    let current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dateArray.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() + 1);
    }

    const studentsToExport = exportSelectionMode === 'all'
      ? classStudents
      : classStudents.filter(s => selectedExportStudentIds.includes(s.id));

    if (studentsToExport.length === 0) return;

    // Excel: Leyenda inicial
    const legendRow = [
      { v: "LLEGENDA EXPORTACIÓ SHIRKA: P = Present | A = Absent (1.0) | a = Absent (0.5) | R = Retràs | J = Justificat", t: 's', s: { font: { bold: true, color: { rgb: "444444" } } } }
    ];

    const headerRow = ['ALUMNE', ...dateArray, 'TOTAL FALTES'];

    const aoaData = [
      legendRow,
      headerRow.map(h => ({
        v: h,
        t: 's',
        s: {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "475569" } },
          border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
          alignment: { horizontal: 'center' }
        }
      }))
    ];

    studentsToExport.forEach(student => {
      let totalFaltesValue = 0;
      const row: any[] = [
        { v: student.name, t: 's', s: { font: { bold: true }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } } }
      ];

      dateArray.forEach(date => {
        const record = attendance.find(a => a.studentId === student.id && a.date === date);
        let displayValue = 'P';
        let color = "F0FDF4"; // Light green for Presence

        if (record) {
          const m = record.morningStatus;
          const a = record.afternoonStatus;

          if (m === 'Falta' && a === 'Falta') {
            displayValue = 'A';
            color = "FEF2F2"; // Red
            totalFaltesValue += 1.0;
          } else if (m === 'Falta' || a === 'Falta') {
            displayValue = 'a';
            color = "FFF1F2"; // Lighter red/pink
            totalFaltesValue += 0.5;
          } else if (m === 'Retard' || a === 'Retard') {
            displayValue = 'R';
            color = "FFFBEB"; // Yellow
          } else if (m === 'Justificat' || a === 'Justificat') {
            displayValue = 'J';
            color = "EFF6FF"; // Blue
          }
        }

        row.push({
          v: displayValue,
          t: 's',
          s: {
            fill: { fgColor: { rgb: color.replace('#', '') } },
            alignment: { horizontal: 'center' },
            border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
          }
        });
      });

      row.push({
        v: totalFaltesValue,
        t: 'n',
        s: {
          font: { bold: true },
          fill: { fgColor: { rgb: totalFaltesValue > 0 ? "FEF2F2" : "F1F5F9" } },
          alignment: { horizontal: 'center' },
          border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
        }
      });
      aoaData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoaData);

    // Ajustamos anchos
    ws['!cols'] = [
      { wch: 30 }, // Alumno
      ...dateArray.map(() => ({ wch: 6 })),
      { wch: 15 } // Total
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Informe Assistència");

    const fileName = `Informe_Asistencia_${exportStartDate}_a_${exportEndDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setIsExportModalOpen(false);
  };

  const presentCount = attendanceList.filter(s => s.status[session] === 'Present').length;
  const absentCount = attendanceList.filter(s => s.status[session] === 'Falta').length;
  const lateCount = attendanceList.filter(s => s.status[session] === 'Retard').length;
  const justifiedCount = attendanceList.filter(s => s.status[session] === 'Justificat').length;

  const monthlySummary = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return classStudents.map(student => {
      const studentAttendance = attendance.filter(a => {
        const d = new Date(a.date);
        return a.studentId === student.id && d >= start && d <= end;
      });

      let presents = 0, faltas = 0, retards = 0, justificats = 0;

      studentAttendance.forEach(record => {
        [record.morningStatus, record.afternoonStatus].forEach((status: any) => {
          if (status === 'Present') presents++;
          else if (status === 'Falta') faltas++;
          else if (status === 'Retard') retards++;
          else if (status === 'Justificat') justificats++;
        });
      });

      return {
        id: student.id,
        name: student.name,
        presents,
        faltas,
        retards,
        justificats
      };
    });
  }, [classStudents, attendance, startDate, endDate]);

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-card rounded-[2.5rem] border-2 border-dashed border-border mt-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Icon name="fact_check" className="text-4xl text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Sense classes configurades</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Configura les teves classes al Perfil per començar a portar el control d'assistència.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full">
      <main className="p-4 md:p-8 lg:p-10 w-full max-w-full h-full flex flex-col overflow-y-auto bg-[#f8fafc] dark:bg-slate-950 scrollbar-hide">
        <header className="flex flex-col gap-8 mb-8 shrink-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Icon name="fact_check" className="text-2xl" />
              </div>
              <div>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-0.5">Control d'Assistència</p>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-slate-900 dark:text-white font-black text-3xl uppercase tracking-tight">{classes.find(c => c.id === selectedClassId)?.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-[#b1454b]/5 text-[#b1454b] px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#b1454b]/10 transition-all uppercase tracking-widest border border-[#b1454b]/10"
              >
                <Icon name="description" className="text-lg" />
                Exportar
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/20">
            <div className="flex items-center gap-5 bg-slate-50 dark:bg-slate-800/50 px-8 py-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 min-w-[350px] flex-1">
              <Icon name="search" className="text-slate-400 text-2xl" />
              <input
                type="text"
                placeholder="Cercar per nom d'alumne..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-base font-black w-full placeholder:text-slate-300"
              />
            </div>

            <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 hidden xl:block"></div>

            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="bg-transparent px-6 py-2 text-sm font-black focus:outline-none cursor-pointer uppercase tracking-tight text-slate-700 dark:text-slate-200"
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 hidden xl:block"></div>

            <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl items-center">
              <button
                onClick={() => setSession('mati')}
                className={`px-8 py-3 text-xs font-black rounded-xl transition-all ${session === 'mati' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200/50' : 'text-slate-400'}`}
              >
                MATÍ
              </button>
              <button
                onClick={() => setSession('tarda')}
                className={`px-8 py-3 text-xs font-black rounded-xl transition-all ${session === 'tarda' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200/50' : 'text-slate-400'}`}
              >
                TARDA
              </button>
            </div>

            <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 hidden xl:block"></div>

            <div className="flex items-center gap-1 ml-auto pr-3">
              <button onClick={() => navigateDate(-1)} className="p-3 text-slate-300 hover:text-primary transition-all active:scale-90"><Icon name="chevron_left" className="text-xl" /></button>
              <div className="px-8 py-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm min-w-[240px] text-center cursor-pointer hover:border-primary/30 transition-all flex items-center justify-center">
                <span className="font-black text-sm uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  {currentDate.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <button onClick={() => navigateDate(1)} className="p-3 text-slate-300 hover:text-primary transition-all active:scale-90"><Icon name="chevron_right" className="text-xl" /></button>

              <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 mx-3"></div>

              <button
                onClick={markAllPresent}
                className="flex items-center gap-2 text-slate-400 hover:text-primary px-5 py-3 text-sm font-black uppercase tracking-widest transition-all"
                title="Marcar tots Present"
              >
                <Icon name="done_all" className="text-xl" />
                Present
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-3 bg-emerald-500 text-white px-8 py-3.5 rounded-2xl font-black text-base hover:bg-emerald-600 transition-all uppercase tracking-widest shadow-xl shadow-emerald-500/20 min-w-[200px] justify-center active:scale-95"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Icon name="save" className="text-xl" />
                )}
                {isSaving ? 'DESANT...' : 'DESAR LLISTA'}
              </button>
            </div>
          </div>
        </header>

        {/* Stats cards - COMPACT */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white dark:bg-card p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 text-lg"><Icon name="groups" /></div>
            <div><p className="text-[9px] text-slate-400 font-black uppercase mb-0.5 tracking-widest">Alumnes</p><p className="text-xl font-black text-slate-800 dark:text-white leading-none">{attendanceList.length}</p></div>
          </div>
          <div className="bg-white dark:bg-card p-4 rounded-[1.5rem] border-l-4 border-l-primary border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-lg"><Icon name="check_circle" /></div>
            <div><p className="text-[9px] text-slate-400 font-black uppercase mb-0.5 tracking-widest">Presents</p><p className="text-xl font-black text-slate-800 dark:text-white leading-none">{presentCount}</p></div>
          </div>
          <div className="bg-white dark:bg-card p-4 rounded-[1.5rem] border-l-4 border-l-red-500 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 text-lg"><Icon name="cancel" /></div>
            <div><p className="text-[9px] text-slate-400 font-black uppercase mb-0.5 tracking-widest">Absents</p><p className="text-xl font-black text-red-500 dark:text-red-400 leading-none">{absentCount}</p></div>
          </div>
          <div className="bg-white dark:bg-card p-4 rounded-[1.5rem] border-l-4 border-l-amber-400 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-500 text-lg"><Icon name="schedule" /></div>
            <div><p className="text-[9px] text-slate-400 font-black uppercase mb-0.5 tracking-widest">Retards/Just.</p><p className="text-xl font-black text-amber-500 leading-none">{lateCount + justifiedCount}</p></div>
          </div>
        </div>

        {/* Student list */}
        <div className="bg-white dark:bg-card rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/30 overflow-hidden shrink-0">
          <div className="px-10 py-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 text-slate-400">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">
              Llistat de Control d'Aula • Sessió de {session.toUpperCase()}
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{attendanceList.length} ALUMNES REGISTRATS</span>
          </div>

          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {attendanceList.length > 0 ? attendanceList.map(s => (
              <div key={s.id} className="group flex flex-col md:flex-row gap-8 px-12 py-3 items-center hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 dark:hover:bg-white/5 justify-between">
                <div className="flex items-center gap-8 min-w-[350px]">
                  <StudentAvatar student={s} size="list" />
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-base font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{s.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full uppercase tracking-widest">Alumne</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center shrink-0">
                  <div className="flex bg-[#f8fafc] dark:bg-slate-900/50 p-2 rounded-2xl gap-3 items-center border border-slate-100 dark:border-slate-800 shadow-inner">
                    {(['Present', 'Falta', 'Retard', 'Justificat'] as AttendanceStatus[]).map(st => (
                      <StatusButton key={st} label={st} activeStatus={s.status[session]} onClick={() => updateStatus(s.id, st)} />
                    ))}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-24 bg-slate-50/10">
                <Icon name="sentiment_dissatisfied" className="text-6xl text-slate-200 mb-4" />
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">No s'han trobat alumnes que coincideixin amb la cerca</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Summary Table */}
        <div className="mt-12 bg-white dark:bg-card rounded-[2rem] shadow-xl border border-border overflow-hidden">
          <div className="px-10 py-6 border-b border-border bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
            <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <Icon name="analytics" className="text-primary text-xl" />
              Resum Estadístiques Mensuals
            </h3>
            <span className="text-[9px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
              {new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f8fafc] dark:bg-slate-900/80 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-10 py-5">Alumne</th>
                  <th className="px-10 py-5 text-center text-primary">Presents</th>
                  <th className="px-10 py-5 text-center text-red-500">Faltes</th>
                  <th className="px-10 py-5 text-center text-amber-500">Retards</th>
                  <th className="px-10 py-5 text-center text-blue-500">Justificats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {monthlySummary.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-10 py-5 font-black text-sm text-slate-700 dark:text-slate-200 uppercase tracking-tight">{row.name}</td>
                    <td className="px-10 py-5 text-center text-sm font-bold">{row.presents}</td>
                    <td className="px-10 py-5 text-center text-sm font-black text-red-500">{row.faltas}</td>
                    <td className="px-10 py-5 text-center text-sm font-bold text-amber-500">{row.retards}</td>
                    <td className="px-10 py-5 text-center text-sm font-bold text-blue-500">{row.justificats}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>


      {/* MODAL EXPORTACIÓ */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#b1454b]/10 flex items-center justify-center text-[#b1454b]">
                  <Icon name="description" className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Exportar Assistència</h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Informe detallat d'aula</p>
                </div>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                <Icon name="close" className="text-xl text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
              {/* Selecció d'Alumnes */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Selecció d'Alumnes</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl gap-2">
                  <button
                    onClick={() => setExportSelectionMode('all')}
                    className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${exportSelectionMode === 'all' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}
                  >
                    TOTA LA CLASSE
                  </button>
                  <button
                    onClick={() => setExportSelectionMode('specific')}
                    className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${exportSelectionMode === 'specific' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}
                  >
                    ESPECÍFICS
                  </button>
                </div>

                {exportSelectionMode === 'specific' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 animate-in fade-in slide-in-from-top-2">
                    {classStudents.map(student => (
                      <label key={student.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedExportStudentIds.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedExportStudentIds([...selectedExportStudentIds, student.id]);
                            else setSelectedExportStudentIds(selectedExportStudentIds.filter(id => id !== student.id));
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{student.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Selecció de Dates */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Rang de Dates (Màx 31 dies)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-300 uppercase ml-1">Inici</span>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/30 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-300 uppercase ml-1">Fi</span>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/30 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Avis de límit de dies */}
                {(() => {
                  const start = new Date(exportStartDate);
                  const end = new Date(exportEndDate);
                  const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  if (days > 31) {
                    return (
                      <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center gap-3 animate-in shake-1 duration-200">
                        <Icon name="error" className="text-red-500" />
                        <span className="text-[10px] font-black text-red-500 uppercase">Error: El rang seleccionat és de {days} dies. El màxim permès és de 31 per qüestions de rendiment i format.</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Informació Comptabilitat */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-start gap-4">
                <Icon name="info" className="text-slate-400 mt-1" />
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-tight">
                  <span className="text-primary">Nota sobre Faltes:</span> De forma automàtica, cada sessió (Matí o Tarda) on hi hagi una Falta computarà com a <span className="text-[#b1454b]">0,5</span>. Una falta de dia complet (dues sessions) sumarà <span className="text-[#b1454b]">1,0</span> al total.
                </p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex gap-4">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="flex-1 py-3 text-xs font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest transition-all"
              >
                CANCEL·LAR
              </button>
              <button
                onClick={processExport}
                disabled={(() => {
                  const start = new Date(exportStartDate);
                  const end = new Date(exportEndDate);
                  const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  return days > 31 || (exportSelectionMode === 'specific' && selectedExportStudentIds.length === 0);
                })()}
                className="flex-[2] bg-[#b1454b] text-white py-3.5 rounded-2xl font-black text-xs hover:bg-[#9a3b41] disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-[#b1454b]/20 uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <Icon name="file_download" className="text-lg" />
                GENERAR INFORME EXCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assistencia;
