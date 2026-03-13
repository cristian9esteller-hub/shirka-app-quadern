
import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { Student, ClassGroup, AttendanceStatus, AttendanceData } from '../types';

interface AssistenciaProps {
    students: Student[];
    classes: ClassGroup[];
    attendanceData: AttendanceData;
    setAttendanceData: React.Dispatch<React.SetStateAction<AttendanceData>>;
}

const StatusButton: React.FC<{
    label: AttendanceStatus;
    activeStatus: AttendanceStatus;
    onClick: () => void;
}> = ({ label, activeStatus, onClick }) => {
    const isActive = label === activeStatus;
    const colors: Record<AttendanceStatus, string> = {
        Present: 'text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
        Falta: 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
        Retard: 'text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
        Justificat: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    };
     const dotColors: Record<AttendanceStatus, string> = {
        Present: 'bg-green-500',
        Falta: 'bg-red-500',
        Retard: 'bg-yellow-500',
        Justificat: 'bg-blue-500',
    };

    return (
        <button onClick={onClick} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${isActive ? `bg-white dark:bg-card-dark shadow-sm border ${colors[label]}` : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800'}`}>
            {isActive && <span className={`w-2 h-2 rounded-full ${dotColors[label]}`}></span>}
            {label}
        </button>
    );
}

const Assistencia: React.FC<AssistenciaProps> = ({ students: allStudents, classes, attendanceData, setAttendanceData }) => {
    const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
    const [hasChanges, setHasChanges] = useState(false);
    const [session, setSession] = useState<'mati' | 'tarda'>('mati');
    const [currentDate, setCurrentDate] = useState(new Date());
    
    useEffect(() => {
        if (!selectedClassId && classes.length > 0) {
            setSelectedClassId(classes[0].id);
        }
    }, [classes, selectedClassId]);

    const dateKey = currentDate.toISOString().split('T')[0];
    const classStudents = allStudents.filter(s => s.classId === selectedClassId);
    const dailyAttendance = attendanceData[dateKey] || {};

    const attendanceList = classStudents.map(student => ({
        ...student,
        status: dailyAttendance[student.id] || { mati: 'Present' as AttendanceStatus, tarda: 'Present' as AttendanceStatus }
    }));

    const updateStatus = (studentId: string, status: AttendanceStatus) => {
        setAttendanceData(prev => {
            const newAttendanceData = JSON.parse(JSON.stringify(prev));
            if (!newAttendanceData[dateKey]) {
                newAttendanceData[dateKey] = {};
            }
            const studentStatus = newAttendanceData[dateKey][studentId] || { mati: 'Present', tarda: 'Present' };
            studentStatus[session] = status;
            newAttendanceData[dateKey][studentId] = studentStatus;
            return newAttendanceData;
        });
        setHasChanges(true);
    };

    const markAllPresent = () => {
         setAttendanceData(prev => {
            const newAttendanceData = JSON.parse(JSON.stringify(prev));
            if (!newAttendanceData[dateKey]) {
                newAttendanceData[dateKey] = {};
            }
            classStudents.forEach(student => {
                const studentStatus = newAttendanceData[dateKey][student.id] || { mati: 'Present', tarda: 'Present' };
                studentStatus[session] = 'Present';
                newAttendanceData[dateKey][student.id] = studentStatus;
            });
            return newAttendanceData;
        });
        setHasChanges(true);
    }

    const navigateDate = (amount: number) => {
        setCurrentDate(d => {
            const newDate = new Date(d);
            newDate.setDate(d.getDate() + amount);
            return newDate;
        });
    }
    
    const presentCount = attendanceList.filter(s => s.status[session] === 'Present').length;
    const absentCount = attendanceList.filter(s => s.status[session] === 'Falta').length;
    const lateCount = attendanceList.filter(s => s.status[session] === 'Retard' || s.status[session] === 'Justificat').length;

    return (
        <div className="flex-1 bg-background-light dark:bg-background-dark">
            <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assistència Diària</h1>
                        <div className="mt-2 relative">
                            <Icon name="groups" className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                            <select 
                                value={selectedClassId} 
                                onChange={e => setSelectedClassId(e.target.value)}
                                className="appearance-none bg-transparent font-semibold text-primary py-1 pl-10 pr-4 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg self-stretch">
                            <button onClick={() => setSession('mati')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex-1 ${session === 'mati' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>Matí</button>
                            <button onClick={() => setSession('tarda')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex-1 ${session === 'tarda' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>Tarda</button>
                        </div>
                        <div className="flex flex-row gap-3 items-center bg-card-light dark:bg-card-dark p-2 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm self-stretch">
                            <button onClick={() => navigateDate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><Icon name="chevron_left" type="outlined" /></button>
                            <div className="flex items-center gap-2 px-4 py-1 border-l border-r border-gray-100 dark:border-gray-700">
                                <Icon name="calendar_today" type="outlined" className="text-primary text-xl" />
                                <span className="font-semibold min-w-[140px] text-center">{currentDate.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                            </div>
                            <button onClick={() => navigateDate(1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><Icon name="chevron_right" type="outlined" /></button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">Total Alumnes</p><p className="text-2xl font-bold">{attendanceList.length}</p></div><div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500"><Icon name="groups" type="outlined" /></div></div>
                    <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-sm border border-l-4 border-l-primary border-gray-100 dark:border-gray-800 flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">Presents</p><p className="text-2xl font-bold">{presentCount}</p></div><div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-dark"><Icon name="check_circle" type="outlined" /></div></div>
                    <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-sm border border-l-4 border-l-red-500 border-gray-100 dark:border-gray-800 flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">Absents</p><p className="text-2xl font-bold text-red-600 dark:text-red-400">{absentCount}</p></div><div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400"><Icon name="cancel" type="outlined" /></div></div>
                    <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-sm border border-l-4 border-l-yellow-400 border-gray-100 dark:border-gray-800 flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">Retards / Justif.</p><p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{lateCount}</p></div><div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400"><Icon name="schedule" type="outlined" /></div></div>
                </div>

                <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-semibold flex items-center gap-2"><Icon name="list_alt" type="outlined" className="text-gray-400" /> Llistat d'Alumnes</h3>
                        <button onClick={markAllPresent} className="text-sm font-medium text-primary hover:text-primary-dark flex items-center gap-1"><Icon name="done_all" type="outlined" className="text-base" /> Marcar tots Present</button>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                       {attendanceList.length > 0 ? attendanceList.map(s => (
                           <div key={s.id} className="group grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50">
                               <div className="col-span-4 flex items-center gap-4">
                                   <img alt={s.name} src={s.avatar} className="h-10 w-10 rounded-full object-cover" />
                                   <div><p className="text-sm font-semibold">{s.name}</p><p className="text-xs text-gray-500">ID: {s.id.slice(-5)}</p></div>
                               </div>
                               <div className="col-span-6 flex items-center justify-start md:justify-center">
                                   <div className="inline-flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1 gap-1">
                                       {(['Present', 'Falta', 'Retard', 'Justificat'] as AttendanceStatus[]).map(st => <StatusButton key={st} label={st} activeStatus={s.status[session]} onClick={() => updateStatus(s.id, st)} />)}
                                   </div>
                               </div>
                               <div className="col-span-2 flex justify-end">
                                    <button className="text-gray-400 hover:text-primary p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Icon name="chat_bubble_outline" type="outlined" /></button>
                               </div>
                           </div>
                       )) : (
                           <div className="text-center py-10 text-gray-500">
                               <Icon name="sentiment_dissatisfied" className="text-3xl mb-2" />
                               <p>No hi ha alumnes en aquesta classe.</p>
                           </div>
                       )}
                    </div>
                </div>
            </main>
            {hasChanges && (
                <div className="fixed bottom-6 left-0 right-0 z-40 px-4">
                    <div className="max-w-md mx-auto flex justify-center">
                        <div className="bg-gray-900 text-white rounded-full shadow-lg px-6 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex flex-col text-sm"><span className="font-bold">Canvis pendents</span></div>
                            <div className="h-8 w-px bg-white/20"></div>
                            <button onClick={() => setHasChanges(false)} className="bg-primary hover:bg-primary-dark text-slate-900 font-semibold py-2 px-6 rounded-full flex items-center gap-2"><Icon name="save" type="outlined" className="text-sm" /> Desar Canvis</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Assistencia;
