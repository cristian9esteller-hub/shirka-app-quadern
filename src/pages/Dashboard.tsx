import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import Icon from '@/components/Icon';
import EventCard from '@/components/EventCard';
import { useData } from '@/contexts/DataContext';
import { getSubjectColor, getShortName } from '@/lib/subject-utils';
import { Screen, type CalendarEvent, type Task, type TaskTag, type Meeting, type WeeklySchedule, type ScheduleTimeSlot, type ScheduleClass } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { renderTextWithLinks } from '@/lib/string-utils';
import { isSummerVacation } from "@/lib/school-config";
import ScheduleGrid from '@/components/ScheduleGrid';

const DEFAULT_SCHEDULE: WeeklySchedule = {
  times: [
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '11:30' },
    { start: '11:30', end: '12:30' },
    { start: '12:30', end: '15:00' },
    { start: '15:00', end: '16:00' },
  ],
  days: {
    Dilluns: Array(6).fill({ subject: '', room: '', color: '' }),
    Dimarts: Array(6).fill({ subject: '', room: '', color: '' }),
    Dimecres: Array(6).fill({ subject: '', room: '', color: '' }),
    Dijous: Array(6).fill({ subject: '', room: '', color: '' }),
    Divendres: Array(6).fill({ subject: '', room: '', color: '' }),
  },
};

const EVENT_COLORS: Record<string, { bg: string, light: string, border: string, text: string }> = {
  red: { bg: 'bg-red-500', light: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-500', text: 'text-red-700 dark:text-red-300' },
  blue: { bg: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  green: { bg: 'bg-green-500', light: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-500', text: 'text-green-700 dark:text-green-300' },
  amber: { bg: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-500', text: 'text-amber-700 dark:text-amber-300' },
  purple: { bg: 'bg-purple-500', light: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300' },
  pink: { bg: 'bg-pink-500', light: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-500', text: 'text-pink-700 dark:text-pink-300' },
};

// ScheduleGrid extracted to separate component

// --- Main Component: Dashboard ---
interface DashboardProps {
  onNavigate?: (screen: Screen) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { profile, events, tasks, meetings, addTask, updateTask, deleteTask, schedule: dbSchedule, updateSchedule } = useData();
  const schoolConfig = useMemo(() => ({
    startDate: profile?.schoolStart || '2025-09-08',
    endDate: profile?.schoolEnd || '2026-06-22'
  }), [profile?.schoolStart, profile?.schoolEnd]);
  const userName = profile?.name || 'Usuari';

  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);

  useEffect(() => {
    if (dbSchedule) {
      setSchedule(dbSchedule);
    }
  }, [dbSchedule]);
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [currentTags, setCurrentTags] = useState<TaskTag[]>([]);
  const [tagInputText, setTagInputText] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState('#5f7181');
  const [isSaving, setIsSaving] = useState(false);

  const todayAvisos = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();

    const normalAvisos = events.filter(e => {
      // No mostrar festius o vacances com avisos del dia
      if (e.type === 'festiu' || e.type === 'vacances') return false;

      // Un sol dia
      if (!e.recurring && (e.date === todayStr || e.date?.split('T')[0] === todayStr)) return true;

      // Recurrent setmanal
      if (e.recurring?.type === 'weekly' || (e.recurring && !e.recurring.type)) {
        const start = new Date(e.date + 'T00:00:00');
        return (e.recurring.dayOfWeek === dayOfWeek) && (start <= today);
      }

      // Rang de dates (excepte si és festiu, que ja hem filtrat adalt)
      if (e.recurring?.type === 'range' && e.recurring.endDate) {
        const start = new Date(e.date + 'T00:00:00');
        const end = new Date(e.recurring.endDate + 'T00:00:00');
        return today >= start && today <= end;
      }

      return false;
    });

    const meetingsAvisos = meetings.filter(m => {
      if (!m.recurring && m.date === todayStr) return true;
      if (m.recurring) {
        const start = new Date(m.date + 'T00:00:00');
        return (m.recurring.dayOfWeek === dayOfWeek) && (start <= today);
      }
      return false;
    });

    return [...normalAvisos, ...meetingsAvisos].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [events, meetings]);

  const upcomingEvents = useMemo(() => {
    const results: any[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    now.setHours(0, 0, 0, 0);

    // Comencem des de demà (i=1) fins a 6 dies vista
    for (let i = 1; i <= 6; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + i);
      const targetStr = targetDate.toISOString().split('T')[0];

      // Saltem si per algun error de càlcul targetStr és avui
      if (targetStr === todayStr) continue;

      const targetDayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay();

      // Esdeveniments (sense festius)
      const dayEvents = events.filter(e => {
        if (e.type === 'festiu' || e.type === 'vacances' || e.title.includes('FESTIU')) return false;

        if (!e.recurring && e.date === targetStr) return true;

        if (e.recurring?.type === 'weekly' || (e.recurring && !e.recurring.type)) {
          const start = new Date(e.date + 'T00:00:00');
          return e.recurring.dayOfWeek === targetDayOfWeek && start <= targetDate;
        }

        if (e.recurring?.type === 'range' && e.recurring.endDate) {
          const start = new Date(e.date + 'T00:00:00');
          const end = new Date(e.recurring.endDate + 'T00:00:00');
          return targetDate >= start && targetDate <= end;
        }

        return false;
      });

      // Reunions
      const dayMeetings = meetings.filter(m => {
        if (!m.recurring && m.date === targetStr) return true;
        if (m.recurring) {
          const start = new Date(m.date + 'T00:00:00');
          return m.recurring.dayOfWeek === targetDayOfWeek && start <= targetDate;
        }
        return false;
      });

      [...dayEvents, ...dayMeetings].forEach(ev => {
        results.push({ ...ev, displayDate: targetStr });
      });
    }

    return results.sort((a, b) => a.displayDate.localeCompare(b.displayDate) || (a.time || '').localeCompare(b.time || ''));
  }, [events, meetings]);

  const [editDay, setEditDay] = useState('Dilluns');
  const [editTimeIndex, setEditTimeIndex] = useState(0);
  const [editSubject, setEditSubject] = useState('');
  const [editRoom, setEditRoom] = useState('');

  // Supabase takes care of persistence, but we keep local state for responsiveness
  useEffect(() => {
    if (schedule !== DEFAULT_SCHEDULE && schedule !== dbSchedule) {
      // We don't call updateSchedule automatically to avoid overhead on every keystroke
      // but 'Actualitzar' button will call it.
    }
  }, [schedule, dbSchedule]);

  useEffect(() => {
    if (schedule.days[editDay] && schedule.days[editDay][editTimeIndex]) {
      const current = schedule.days[editDay][editTimeIndex];
      setEditSubject(current.subject); setEditRoom(current.room);
    }
  }, [editDay, editTimeIndex, schedule]);

  const saveEventChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newSchedule = { ...schedule };
      newSchedule.days[editDay][editTimeIndex] = { subject: editSubject, room: editRoom, color: '' };
      setSchedule(newSchedule);
      await updateSchedule(newSchedule);
      toast.success('Horari actualitzat correctament', {
        className: 'bg-green-500 text-white border-none font-bold',
      });
    } catch (error) {
      toast.error('Error al guardar el horario');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimeSlotChange = (index: number, field: 'start' | 'end', value: string) => {
    const newTimes = [...schedule.times]; newTimes[index][field] = value;
    const newSchedule = { ...schedule, times: newTimes };
    setSchedule(newSchedule);
    updateSchedule(newSchedule);
  };

  const handleRemoveTimeSlot = (index: number) => {
    const newTimes = schedule.times.filter((_, i) => i !== index);
    const newDays = { ...schedule.days };
    Object.keys(newDays).forEach(day => { newDays[day] = newDays[day].filter((_, i) => i !== index); });
    const newSchedule = { times: newTimes, days: newDays };
    setSchedule(newSchedule);
    updateSchedule(newSchedule);
    if (editTimeIndex >= newTimes.length) setEditTimeIndex(Math.max(0, newTimes.length - 1));
  };

  const handleAddTaskInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    addTask(newTaskText.trim(), newTaskDescription.trim(), currentTags);
    setIsTaskModalOpen(false);
    setNewTaskText('');
    setNewTaskDescription('');
    setCurrentTags([]);
    setTagInputText('');
  };

  const handleAddTag = () => {
    if (!tagInputText.trim()) return;
    const newTag: TaskTag = {
      text: tagInputText.trim(),
      color: selectedTagColor
    };
    setCurrentTags([...currentTags, newTag]);
    setTagInputText('');
  };

  const removeTag = (tagText: string) => {
    setCurrentTags(currentTags.filter(t => t.text !== tagText));
  };

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (task.completed) { deleteTask(taskId); } else { updateTask(taskId, { completed: true }); }
  };

  useEffect(() => {
    if (isTaskModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isTaskModalOpen]);

  return (
    <>
      <main className="p-2 md:p-6 lg:p-8 w-full max-w-full h-full flex flex-col overflow-y-auto bg-white dark:bg-slate-950 scrollbar-hide">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="waving_hand" className="text-2xl" />
            </div>
            <div>
              <p className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-0.5">
                {new Date().toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Bon dia, {userName.split(' ')[0]}!</h1>
            </div>
          </div>
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-lg shadow-slate-200/50 dark:shadow-none text-[13px] active:scale-95 group"
          >
            <Icon name="add" className="text-lg group-hover:rotate-90 transition-transform" />
            <span>Nova Tasca</span>
          </button>
        </header>

        {isSummerVacation(schoolConfig) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 m-4 md:m-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-amber-50 dark:ring-amber-900/10">
              <Icon name="beach_access" className="text-4xl md:text-6xl text-amber-500 animate-bounce" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white mb-4 tracking-tighter uppercase">
              Bones vacances d'estiu! ☀️
            </h1>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-xl font-medium">
              L'escola està tancada. Aprofita per descansar, desconnectar i carregar piles.
              <br /><span className="text-primary font-bold">Ens veiem al setembre! 👋</span>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              {/* Weekly Schedule Section */}
              <section>
                <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between mb-2.5 gap-2.5">
                  <h2 className="text-base md:text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white uppercase tracking-tighter">
                    <Icon name="calendar_view_week" className="text-primary text-xl" /> Horari Setmanal
                  </h2>
                  <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl w-full sm:w-auto">
                    <button onClick={() => setActiveTab('view')} className={`flex-1 sm:flex-none px-6 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'view' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Vista</button>
                    <button onClick={() => setActiveTab('edit')} className={`flex-1 sm:flex-none px-6 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'edit' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Config</button>
                  </div>
                </div>

                {activeTab === 'view' ? (
                  <div className="w-full overflow-hidden">
                    <ScheduleGrid schedule={schedule} isCompact={false} subjects={profile?.subjects || []} />
                  </div>
                ) : (
                  <div className="p-5 md:p-8 bg-white dark:bg-card rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                      <div className="space-y-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                          <Icon name="schedule" className="text-primary" /> Franges Horàries
                        </h3>
                        <div className="space-y-2.5">
                          {schedule.times.map((time, index) => (
                            <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-[1.5rem] border border-transparent hover:border-slate-200 transition-all shadow-sm">
                              <input type="time" value={time.start} onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2 px-3 text-[13px] font-bold outline-none focus:ring-2 focus:ring-primary/10 w-full" />
                              <span className="text-slate-300 font-bold px-1">-</span>
                              <input type="time" value={time.end} onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2 px-3 text-[13px] font-bold outline-none focus:ring-2 focus:ring-primary/10 w-full" />
                              <button onClick={() => handleRemoveTimeSlot(index)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><Icon name="delete" className="text-lg" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                          <Icon name="edit_calendar" className="text-primary" /> Editar Contingut
                        </h3>
                        <form onSubmit={saveEventChange} className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <select value={editDay} onChange={(e) => setEditDay(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 px-4 outline-none focus:border-primary text-[13px] font-bold appearance-none">
                              {Object.keys(schedule.days).map(day => <option key={day} value={day}>{day}</option>)}
                            </select>
                            <select value={editTimeIndex} onChange={(e) => setEditTimeIndex(parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 px-4 outline-none focus:border-primary text-[13px] font-bold appearance-none">
                              {schedule.times.map((time, idx) => <option key={idx} value={idx}>{time.start}</option>)}
                            </select>
                          </div>
                          <select value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 px-4 outline-none focus:border-primary text-[13px] font-bold appearance-none">
                            <option value="">Lliure / Pati</option>
                            <option value="Esbarjo / Pati">☕ Esbarjo / Pati</option>
                            <option value="Menjador / Migdia">🍴 Menjador / Migdia</option>
                            {profile?.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <input type="text" value={editRoom} onChange={(e) => setEditRoom(e.target.value)} placeholder="Aula..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 px-4 outline-none focus:border-primary text-[13px] font-bold" />
                          <div className="mt-2">
                            <button
                              type="submit"
                              disabled={isSaving}
                              className={`w-full bg-primary hover:bg-primary-dark text-white rounded-2xl font-black py-3 shadow-xl shadow-primary/20 transition-all uppercase text-[11px] tracking-widest leading-none flex items-center justify-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {isSaving ? (
                                <>
                                  <Icon name="progress_activity" className="animate-spin text-sm" />
                                  <span>Guardant...</span>
                                </>
                              ) : (
                                'Actualitzar'
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Avisos */}
              <section>
                <h2 className="text-base md:text-lg font-black flex items-center gap-2 mb-3 text-slate-800 dark:text-white uppercase tracking-tighter">
                  <Icon name="campaign" className="text-primary text-xl" /> Avisos del Dia
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {todayAvisos.length > 0 ? todayAvisos.map(aviso => (
                    <EventCard
                      key={aviso.id}
                      title={aviso.title}
                      time={aviso.time}
                      color={(aviso as any).color}
                      icon={(aviso as any).icon}
                      isRecurring={(aviso as any).recurring}
                      subject={(aviso as any).subject}
                      description={(aviso as any).description}
                      variant="compact"
                      priority="high"
                    />
                  )) : (
                    <div className="col-span-full py-6 bg-slate-50/50 dark:bg-card/30 rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                      <Icon name="notifications_off" className="text-2xl mb-1 opacity-10" />
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 text-center px-4">Sense avisos per avui</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Propers Esdeveniments (6 dies) */}
              <section className="mt-6">
                <h2 className="text-base md:text-lg font-black flex items-center gap-2 mb-3 text-slate-800 dark:text-white uppercase tracking-tighter">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10 text-primary">
                    <Icon name="event_note" className="text-sm" />
                  </span>
                  Propers Esdeveniments (6 dies)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {upcomingEvents.length > 0 ? upcomingEvents.map(ev => (
                    <EventCard
                      key={ev.id}
                      title={ev.title}
                      time={ev.time}
                      date={ev.date}
                      color={ev.color}
                      isRecurring={ev.recurring}
                      subject={ev.subject}
                      description={ev.description}
                      showDateBadge={true}
                      priority="normal"
                      onClick={() => onNavigate?.(Screen.Calendari)}
                    />
                  )) : (
                    <div className="col-span-full py-6 bg-slate-50/50 dark:bg-card/30 rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                      <Icon name="event_available" className="text-2xl mb-1 opacity-10" />
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 text-center px-4">Cap esdeveniment proper</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Side Column: Tasks - Rediseñadas según Foto 4 (Simple Cards) */}
            <div className="lg:col-span-4 h-full">
              <section className="bg-white dark:bg-card rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col h-full min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white uppercase tracking-tighter">
                    <Icon name="check_circle" className="text-primary text-xl" /> Tasques
                  </h2>
                  <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    {tasks.filter(t => !t.completed).length}
                  </span>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                  {tasks.map((task) => (
                    <TooltipProvider key={task.id}>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <div
                            onClick={() => handleTaskClick(task.id)}
                            className={`flex flex-col gap-1 p-4 rounded-[1.5rem] cursor-pointer transition-all border shadow-sm group/task relative ${task.completed
                              ? 'opacity-25 grayscale'
                              : 'hover:bg-white bg-white border-slate-100 hover:scale-105 hover:shadow-lg hover:border-primary/20 hover:z-[60]'
                              }`}
                          >
                            <div className="flex items-center gap-3.5 w-full">
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all shrink-0 ${task.completed ? 'bg-primary border-primary text-white' : 'border-slate-200 bg-slate-50 group-hover/task:border-primary/50'}`}>
                                {task.completed && <Icon name="check" className="text-xs font-black" />}
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className={`text-[14px] text-slate-800 font-bold truncate leading-tight ${task.completed ? 'line-through' : ''}`}>
                                  {task.text}
                                </span>
                                {task.tags && task.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {task.tags.map((tag, idx) => (
                                      <span key={idx} className="px-1.5 py-0.5 rounded-md text-[8px] font-black text-white uppercase tracking-tighter" style={{ backgroundColor: tag.color }}>
                                        {tag.text}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        {!task.completed && task.description && (
                          <TooltipContent
                            side="right"
                            className="p-4 bg-white/95 backdrop-blur-md border border-primary/20 rounded-2xl shadow-2xl max-w-[280px] animate-in zoom-in-95 duration-200 z-50"
                          >
                            <div className="space-y-2 font-sans">
                              <div className="flex items-center gap-2 border-b border-primary/10 pb-2 mb-2">
                                <Icon name="description" className="text-primary text-sm" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Descripció</span>
                              </div>
                              <p className="text-[12px] text-slate-600 font-medium leading-relaxed">
                                {task.description}
                              </p>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-card w-full max-w-[650px] rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <form onSubmit={handleAddTaskInput} className="p-8 flex flex-col h-full gap-6">
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Icon name="add_task" className="text-xl" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                    Nova Tasca
                  </h2>
                </div>
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="text-slate-300 hover:text-red-500 transition-all p-2 bg-slate-50 dark:bg-slate-800 rounded-full">
                  <Icon name="close" className="text-xl" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 font-sans">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Títol</label>
                    <input
                      type="text" required autoFocus value={newTaskText}
                      onChange={e => setNewTaskText(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border-2 border-primary/20 focus:border-primary rounded-2xl px-5 py-3 focus:ring-4 focus:ring-primary/10 outline-none text-base font-bold transition-all placeholder:text-slate-300"
                      placeholder="Què cal fer?"
                    />
                  </div>
                  <div className="space-y-1.5 font-sans">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Descripció (Opcional)</label>
                    <textarea
                      value={newTaskDescription}
                      onChange={e => setNewTaskDescription(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 focus:border-primary rounded-2xl px-5 py-3 focus:ring-4 focus:ring-primary/10 outline-none text-sm font-medium transition-all placeholder:text-slate-300 min-h-[52px] md:h-[52px] resize-none"
                      placeholder="Més detalls..."
                    />
                  </div>
                </div>

                <div className="space-y-1.5 font-sans">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Etiqueta i Color</label>
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-8 overflow-hidden">
                    <div className="flex gap-2 w-full md:w-auto flex-1">
                      <input
                        type="text"
                        value={tagInputText}
                        onChange={e => setTagInputText(e.target.value)}
                        placeholder="Nova etiqueta..."
                        className="flex-1 min-w-0 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-primary/30 transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="bg-primary text-white px-5 py-2 rounded-xl font-black text-[10px] shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all shrink-0 uppercase tracking-widest"
                      >
                        Afegir
                      </button>
                    </div>

                    <div className="flex justify-between items-center gap-3 px-2 shrink-0">
                      {['#ff7b7b', '#7ba3ff', '#7bff9d', '#b37bff', '#ffca7b', '#5f7181'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedTagColor(color)}
                          className={`w-9 h-9 rounded-full transition-all border-2 ${selectedTagColor === color ? 'border-primary ring-2 ring-primary/20 scale-110 shadow-lg' : 'border-transparent hover:scale-110'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {currentTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 px-1">
                      {currentTags.map(tag => (
                        <span
                          key={tag.text}
                          onClick={() => removeTag(tag.text)}
                          className="px-3 py-1.5 rounded-xl text-[10px] font-black text-white cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2 shadow-sm"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.text}
                          <Icon name="close" className="text-[12px]" />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-6 shrink-0 border-t border-slate-100 dark:border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-2 border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel·lar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/30 uppercase text-[10px] tracking-widest transition-all hover:translate-y-[-2px] hover:shadow-primary/40 active:scale-95"
                >
                  Confirmar Tasca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
