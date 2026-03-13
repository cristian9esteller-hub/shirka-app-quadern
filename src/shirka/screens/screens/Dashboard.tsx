
import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../components/Icon';
import { CalendarEvent, Task, TaskTag, Meeting } from '../types';

// Types for schedule
interface ScheduleTimeSlot {
  start: string;
  end:string;
}

interface ScheduleClass {
  subject: string;
  room: string;
  color: string;
}

interface WeeklySchedule {
  times: ScheduleTimeSlot[];
  days: {
    [key: string]: ScheduleClass[];
  };
}

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
        Dilluns: [
            { subject: 'Matemàtiques', room: 'Aula 12', color: 'red' },
            { subject: 'Llengua Cat.', room: 'Aula 12', color: 'blue' },
            { subject: 'Esbarjo / Pati', room: '', color: 'slate' },
            { subject: 'Medi Natural', room: 'Aula 12', color: 'green' },
            { subject: 'Menjador / Migdia', room: '', color: 'slate' },
            { subject: 'Música', room: 'Aula Música', color: 'yellow' },
        ],
        Dimarts: [
            { subject: 'Llengua Cat.', room: 'Aula 12', color: 'blue' },
            { subject: 'Medi Social', room: 'Aula 12', color: 'green' },
            { subject: 'Esbarjo / Pati', room: '', color: 'slate' },
            { subject: 'Matemàtiques', room: 'Aula 12', color: 'red' },
            { subject: 'Menjador / Migdia', room: '', color: 'slate' },
            { subject: 'Valors / Rel.', room: 'Aula 12', color: 'indigo' },
        ],
        Dimecres: [
            { subject: 'Matemàtiques', room: 'Aula 12', color: 'red' },
            { subject: 'Anglès', room: 'Aula Idiomes', color: 'purple' },
            { subject: 'Esbarjo / Pati', room: '', color: 'slate' },
            { subject: 'Ed. Física', room: 'Gimnàs', color: 'orange' },
            { subject: 'Menjador / Migdia', room: '', color: 'slate' },
            { subject: 'Llengua Cat.', room: 'Aula 12', color: 'blue' },
        ],
        Dijous: [
            { subject: 'Llengua Cast.', room: 'Aula 12', color: 'blue' },
            { subject: 'Matemàtiques', room: 'Aula 12', color: 'red' },
            { subject: 'Esbarjo / Pati', room: '', color: 'slate' },
            { subject: 'Medi Social', room: 'Aula 12', color: 'green' },
            { subject: 'Menjador / Migdia', room: '', color: 'slate' },
            { subject: 'Projectes', room: 'Aula 12', color: 'teal' },
        ],
        Divendres: [
            { subject: 'Medi Natural', room: 'Lab 2', color: 'green' },
            { subject: 'Ed. Artística', room: 'Aula Art', color: 'yellow' },
            { subject: 'Esbarjo / Pati', room: '', color: 'slate' },
            { subject: 'Anglès', room: 'Aula 12', color: 'purple' },
            { subject: 'Menjador / Migdia', room: '', color: 'slate' },
            { subject: 'Tutoria', room: 'Aula 12', color: 'pink' },
        ],
    }
};

const COLORS = [
  { id: 'red', label: 'Roig' },
  { id: 'blue', label: 'Blau' },
  { id: 'green', label: 'Verd' },
  { id: 'yellow', label: 'Groc' },
  { id: 'purple', label: 'Lila' },
  { id: 'orange', label: 'Taronja' },
  { id: 'indigo', label: 'Indi' },
  { id: 'teal', label: 'Teal' },
  { id: 'pink', label: 'Rosa' },
  { id: 'slate', label: 'Gris' },
];

const TAG_COLORS = [
    { id: 'red', hex: '#ef4444' },
    { id: 'blue', hex: '#3b82f6' },
    { id: 'green', hex: '#22c55e' },
    { id: 'purple', hex: '#8b5cf6' },
    { id: 'amber', hex: '#f59e0b' },
    { id: 'slate', hex: '#64748b' },
];

const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
        red: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-200',
        blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-200',
        green: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-800 dark:text-green-200',
        yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-900/30 text-yellow-800 dark:text-yellow-200',
        purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30 text-purple-800 dark:text-purple-200',
        orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30 text-orange-800 dark:text-orange-200',
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 text-indigo-800 dark:text-indigo-200',
        teal: 'bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-900/30 text-teal-800 dark:text-teal-200',
        pink: 'bg-pink-50 dark:bg-pink-900/20 border-pink-100 dark:border-pink-900/30 text-pink-800 dark:text-pink-200',
        slate: 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50',
        amber: 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-200',
    };
    return colorMap[color] || 'bg-gray-50 dark:bg-gray-900/20 border-gray-100 dark:border-gray-900/30';
};

const getTextColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      red: 'text-red-600 dark:text-red-300',
      blue: 'text-blue-600 dark:text-blue-300',
      green: 'text-green-600 dark:text-green-300',
      yellow: 'text-yellow-600 dark:text-yellow-300',
      purple: 'text-purple-600 dark:text-purple-300',
      orange: 'text-orange-600 dark:text-orange-300',
      indigo: 'text-indigo-600 dark:text-indigo-300',
      teal: 'text-teal-600 dark:text-teal-300',
      pink: 'text-pink-600 dark:text-pink-300',
      amber: 'text-amber-600 dark:text-amber-300',
    };
    return colorMap[color] || 'text-gray-600 dark:text-gray-300';
}

const getTagColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
        red: 'text-red-600 bg-red-100 dark:bg-red-900/30',
        blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
        green: 'text-green-600 bg-green-100 dark:bg-green-900/30',
        purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
        amber: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
        slate: 'text-slate-600 bg-slate-200 dark:bg-slate-700',
    };
    return colorMap[color] || 'text-slate-500 bg-slate-100 dark:bg-slate-700';
}

interface DashboardProps {
  events: CalendarEvent[];
  meetings: Meeting[];
  tasks: Task[];
  setTasks: (tasks: Task[] | ((prevTasks: Task[]) => Task[])) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ events, meetings, tasks, setTasks }) => {
  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');
  
  // Modal & form state for new tasks
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskTagsList, setNewTaskTagsList] = useState<TaskTag[]>([]);
  const [currentTagText, setCurrentTagText] = useState('');
  const [currentTagColor, setCurrentTagColor] = useState('slate');
  
  // Today's events synchronized with calendar and meetings
  const todayAvisos = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

    const meetingColorMap: Record<string, string> = {
        'Tutoria Família': 'blue',
        'Claustre': 'green',
        'Nivell': 'purple',
        'Coordinació': 'red',
        'Altres': 'amber',
    };

    const meetingIconMap: Record<string, string> = {
        'Tutoria Família': 'family_restroom',
        'Claustre': 'groups',
        'Nivell': 'layers',
        'Coordinació': 'handshake',
        'Altres': 'event',
    };

    // Combine all potential today notices
    const combinedItems = [
        ...events.map(e => ({ ...e, source: 'event' as const, icon: 'event' })),
        ...meetings.map(m => ({
            id: `meeting-${m.id}`,
            title: m.title || m.type,
            date: m.date,
            time: m.time,
            color: meetingColorMap[m.type] || 'blue',
            description: m.discussion || `Reunió tipus: ${m.type}`,
            recurring: m.recurring,
            source: 'meeting' as const,
            icon: meetingIconMap[m.type] || 'groups'
        }))
    ];

    return combinedItems.filter(item => {
        // Single occurrence today
        if (!item.recurring) {
            return item.date === todayStr;
        }
        // Recurring occurrence matching today's day of week
        // Only if started on or before today
        const startDate = new Date(item.date);
        startDate.setHours(0,0,0,0);
        const todayAtZero = new Date(now);
        todayAtZero.setHours(0,0,0,0);
        
        return item.recurring.dayOfWeek === dayOfWeek && startDate.getTime() <= todayAtZero.getTime();
    }).sort((a,b) => a.time.localeCompare(b.time));
  }, [events, meetings]);

  // Edit states for schedule
  const [editDay, setEditDay] = useState('Dilluns');
  const [editTimeIndex, setEditTimeIndex] = useState(0);
  const [editSubject, setEditSubject] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editColor, setEditColor] = useState('blue');

  // Load schedule from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('teacher_schedule');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.times && parsed.days) {
                setSchedule(parsed);
            }
        } catch(e) { console.error("Error loading schedule", e); }
    }
  }, []);

  // Persist schedule changes to localStorage
  useEffect(() => {
      localStorage.setItem('teacher_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    if (schedule.days[editDay] && schedule.days[editDay][editTimeIndex]) {
        const current = schedule.days[editDay][editTimeIndex];
        setEditSubject(current.subject);
        setEditRoom(current.room);
        setEditColor(current.color);
    }
  }, [editDay, editTimeIndex, schedule]);

  const saveEventChange = (e: React.FormEvent) => {
    e.preventDefault();
    const newSchedule = { ...schedule };
    newSchedule.days[editDay][editTimeIndex] = {
      subject: editSubject,
      room: editRoom,
      color: editColor
    };
    setSchedule(newSchedule);
  };
  
  const handleTimeSlotChange = (index: number, field: 'start' | 'end', value: string) => {
    const newTimes = [...schedule.times];
    newTimes[index][field] = value;
    setSchedule({ ...schedule, times: newTimes });
  };

  const handleAddTimeSlot = () => {
    const newTime = { start: '16:00', end: '17:00' };
    const newDays = { ...schedule.days };
    const defaultEvent = { subject: 'Nou Bloc', room: '', color: 'slate' };
    Object.keys(newDays).forEach(day => newDays[day].push(defaultEvent));
    setSchedule({ times: [...schedule.times, newTime], days: newDays });
  };

  const handleRemoveTimeSlot = (index: number) => {
    const newTimes = schedule.times.filter((_, i) => i !== index);
    const newDays = { ...schedule.days };
    Object.keys(newDays).forEach(day => {
        newDays[day] = newDays[day].filter((_, i) => i !== index);
    });
    setSchedule({ times: newTimes, days: newDays });
    if (editTimeIndex >= newTimes.length) {
      setEditTimeIndex(Math.max(0, newTimes.length - 1));
    }
  };


  const handleTaskClick = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.completed) {
        setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    } else {
        setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, completed: true } : t));
    }
  };

  const handleAddTagToList = () => {
    const text = currentTagText.trim();
    if (text) {
        setNewTaskTagsList([...newTaskTagsList, { text, color: currentTagColor }]);
        setCurrentTagText('');
    }
  };

  const handleRemoveTagFromList = (index: number) => {
    setNewTaskTagsList(newTaskTagsList.filter((_, i) => i !== index));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: Task = {
        id: Date.now().toString(),
        text: newTaskText.trim(),
        completed: false,
        tags: newTaskTagsList
    };
    setTasks(prev => [newTask, ...prev]);
    setIsTaskModalOpen(false);
    setNewTaskText('');
    setNewTaskTagsList([]);
    setCurrentTagText('');
    setCurrentTagColor('slate');
  };

  return (
    <>
      <main className="p-4 md:p-8 lg:p-10 w-full max-w-full">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 text-sm md:text-base">
                    {new Date().toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white leading-tight">Bon dia, Professor/a! 👋</h1>
              </div>
              <div className="flex gap-3">
                  <button 
                    onClick={() => setIsTaskModalOpen(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm text-sm"
                  >
                      <Icon name="add" className="text-lg" />
                      <span>Nova Tasca</span>
                  </button>
              </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2 space-y-6 md:space-y-8">
                  {/* Weekly Schedule Section */}
                  <section>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                              <Icon name="calendar_view_week" className="text-primary"/> Horari Setmanal
                          </h2>
                          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
                              <button 
                                  onClick={() => setActiveTab('view')}
                                  className={`flex-1 sm:flex-none px-4 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${activeTab === 'view' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500'}`}
                              >
                                  Vista
                              </button>
                              <button 
                                  onClick={() => setActiveTab('edit')}
                                  className={`flex-1 sm:flex-none px-4 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${activeTab === 'edit' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500'}`}
                              >
                                  Configuració
                              </button>
                          </div>
                      </div>

                      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 dark:border-slate-800/50 min-h-[300px]">
                          {activeTab === 'view' ? (
                              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                                  <div className="min-w-[600px]">
                                      <div className="grid grid-cols-6 gap-2 mb-2 text-center">
                                          <div className="text-slate-400 font-medium text-xs pt-2">Hora</div>
                                          {Object.keys(schedule.days).map(day => <div key={day} className="font-bold text-slate-700 dark:text-slate-200 text-xs md:text-sm">{day}</div>)}
                                      </div>
                                      {schedule.times.map((time, timeIndex) => (
                                          <div key={time.start + time.end} className={`grid grid-cols-6 gap-2 group ${timeIndex < schedule.times.length -1 ? 'mb-2' : ''}`}>
                                              <div className="flex items-center justify-center text-slate-500 font-medium text-[10px] border-r border-slate-100 dark:border-slate-800 pr-2">
                                                  {time.start}
                                              </div>
                                              {Object.values(schedule.days).map((daySchedule, dayIndex) => {
                                                  const event = daySchedule[timeIndex];
                                                  const isBreak = event?.subject.includes('Esbarjo') || event?.subject.includes('Menjador');

                                                  if (isBreak) {
                                                      return (
                                                          <div key={`${time.start}-${dayIndex}`} className={`${getColorClasses(event?.color || 'slate')} p-1 md:p-2 rounded-lg border flex flex-col justify-center items-center h-16 md:h-20`}>
                                                              <Icon name={event.subject.includes('Esbarjo') ? 'coffee' : 'restaurant'} className="text-slate-500 dark:text-slate-400 mb-1 text-sm" />
                                                              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center leading-tight">{event?.subject}</span>
                                                          </div>
                                                      )
                                                  }
                                                  
                                                  return (
                                                      <div key={`${time.start}-${dayIndex}`} className={`${getColorClasses(event?.color || 'slate')} p-1.5 md:p-2 rounded-lg hover:shadow-md transition cursor-pointer border h-16 md:h-20 flex flex-col justify-center`}>
                                                          <span className={`block font-bold text-[10px] md:text-xs truncate`}>{event?.subject || ''}</span>
                                                          <span className={`text-[8px] md:text-[10px] ${getTextColor(event?.color || 'slate')} truncate`}>{event?.room || ''}</span>
                                                      </div>
                                                  )
                                              })}
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          ) : (
                             <div className="max-w-3xl mx-auto py-2 md:py-4 space-y-8 md:space-y-10">
                                  <div>
                                      <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                          <Icon name="schedule" className="text-primary text-xl" /> Franges Horàries
                                      </h3>
                                      <div className="space-y-2 md:space-y-3">
                                          {schedule.times.map((time, index) => (
                                              <div key={index} className="flex items-center gap-2 md:gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 md:p-3 rounded-lg">
                                                  <input type="time" value={time.start} onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md py-1 px-2 w-24 md:w-28 text-xs md:text-sm focus:ring-primary"/>
                                                  <span className="text-slate-400">-</span>
                                                  <input type="time" value={time.end} onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md py-1 px-2 w-24 md:w-28 text-xs md:text-sm focus:ring-primary"/>
                                                  <button onClick={() => handleRemoveTimeSlot(index)} className="ml-auto text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 p-2 rounded-full"><Icon name="delete" className="text-lg"/></button>
                                              </div>
                                          ))}
                                      </div>
                                      <button onClick={handleAddTimeSlot} className="mt-4 w-full py-2.5 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-center gap-2 text-xs md:text-sm">
                                          <Icon name="add" /> Afegir Franja Horària
                                      </button>
                                  </div>
                                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6 md:pt-8">
                                      <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 md:mb-6 flex items-center gap-2">
                                          <Icon name="edit_calendar" className="text-primary text-xl" /> Modificar Assignatura
                                      </h3>
                                      <form onSubmit={saveEventChange} className="space-y-4 md:space-y-6">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div className="space-y-1 md:space-y-2">
                                                  <label className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400">Dia de la setmana</label>
                                                  <select value={editDay} onChange={(e) => setEditDay(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary outline-none text-sm">
                                                      {Object.keys(schedule.days).map(day => <option key={day} value={day}>{day}</option>)}
                                                  </select>
                                              </div>
                                              <div className="space-y-1 md:space-y-2">
                                                  <label className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400">Franja horària</label>
                                                  <select value={editTimeIndex} onChange={(e) => setEditTimeIndex(parseInt(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary outline-none text-sm">
                                                      {schedule.times.map((time, idx) => <option key={idx} value={idx}>{time.start} - {time.end}</option>)}
                                                  </select>
                                              </div>
                                          </div>
                                          <div className="space-y-1 md:space-y-2">
                                              <label className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400">Asignatura</label>
                                              <input type="text" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} placeholder="Nom de la matèria..." className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary outline-none text-sm"/>
                                          </div>
                                          <div className="space-y-1 md:space-y-2">
                                              <label className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400">Aula (Opcional)</label>
                                              <input type="text" value={editRoom} onChange={(e) => setEditRoom(e.target.value)} placeholder="Aula 12, Gimnàs..." className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary outline-none text-sm"/>
                                          </div>
                                          <div className="space-y-3">
                                              <label className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400">Color de l'etiqueta</label>
                                              <div className="flex flex-wrap gap-2.5 md:gap-3">
                                                  {COLORS.map(color => (
                                                      <button key={color.id} type="button" onClick={() => setEditColor(color.id)} className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition-all transform active:scale-90 ${editColor === color.id ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-transparent'}`} style={{ backgroundColor: color.id }} title={color.label} />
                                                  ))}
                                              </div>
                                          </div>
                                          <div className="pt-2 md:pt-4">
                                              <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] text-sm md:text-base">
                                                  Guardar Canvis
                                              </button>
                                          </div>
                                      </form>
                                  </div>
                             </div>
                          )}
                      </div>
                  </section>
                  
                  {/* Dynamic School Announcements from Calendar and Meetings */}
                  <section>
                      <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 mb-4">
                          <Icon name="campaign" className="text-primary" /> Avisos del Dia
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {todayAvisos.length > 0 ? todayAvisos.map(aviso => (
                            <div key={aviso.id} className={`${getColorClasses(aviso.color)} p-4 md:p-5 rounded-xl border flex items-start gap-3 transition-shadow hover:shadow-md relative overflow-hidden group`}>
                                {aviso.recurring && (
                                    <div className="absolute top-0 right-0 p-1 bg-white/10 rounded-bl-lg">
                                        <Icon name="sync" className="text-[10px] text-white opacity-40" />
                                    </div>
                                )}
                                <div className="flex flex-col items-center shrink-0">
                                  <Icon name={(aviso as any).icon || 'event'} className={`${getTextColor(aviso.color)} text-xl md:text-2xl`} />
                                  <span className="text-[10px] font-bold mt-1 opacity-70">{aviso.time}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold mb-0.5 text-sm md:text-base truncate">{aviso.title}</h4>
                                    <p className="text-xs md:text-sm opacity-70 leading-relaxed line-clamp-2">
                                      {aviso.description || "Sense descripció addicional."}
                                    </p>
                                </div>
                            </div>
                          )) : (
                            <div className="col-span-full py-8 bg-slate-100 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-500">
                                <Icon name="notifications_off" className="text-3xl mb-2 opacity-30" />
                                <p className="text-sm">No hi ha avisos programats per avui.</p>
                            </div>
                          )}
                      </div>
                  </section>
              </div>

              {/* Right Column: Tasks */}
              <div className="space-y-6 md:space-y-8">
                  <section className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100 dark:border-slate-800/50 lg:h-full flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                              <Icon name="check_circle" className="text-primary"/> Tasques
                          </h2>
                          <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] md:text-xs font-bold px-2 py-1 rounded">
                            {tasks.filter(t => !t.completed).length} pendents
                          </span>
                      </div>
                      <div className="space-y-2 md:space-y-3 flex-1 overflow-y-auto max-h-[400px] lg:max-h-none pr-2 -mr-2">
                          {tasks.map((task) => (
                              <div key={task.id} onClick={() => handleTaskClick(task.id)} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition ${task.completed ? 'opacity-50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 group bg-slate-50/50 dark:bg-slate-800/30'}`}>
                                  <input type="checkbox" checked={task.completed} readOnly className="mt-1 w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/50 pointer-events-none" />
                                  <div className="flex-1">
                                      <span className={`block text-xs md:text-sm text-slate-800 dark:text-slate-200 font-medium ${task.completed ? 'line-through' : 'group-hover:text-primary transition-colors'}`}>{task.text}</span>
                                      {task.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                            {task.tags.map((tag, i) => (
                                                <span key={i} className={`text-[8px] md:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${getTagColor(tag.color)}`}>{tag.text}</span>
                                            ))}
                                        </div>
                                      )}
                                  </div>
                              </div>
                          ))}
                          {tasks.length === 0 && <p className="text-center text-slate-500 text-sm py-10">No hi ha tasques.</p>}
                      </div>
                  </section>
              </div>
          </div>
      </main>

      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleAddTask}>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Icon name="add_task" className="text-primary" /> Nova Tasca
                </h2>
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <Icon name="close" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Descripció de la tasca</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newTaskText}
                    onChange={e => setNewTaskText(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ex: Preparar material per l'excursió"
                  />
                </div>
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase">Etiquetes (opcional)</label>
                    <div className="flex flex-wrap gap-2">
                        {newTaskTagsList.map((tag, index) => (
                            <div key={index} className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${getTagColor(tag.color)}`}>
                                <span>{tag.text}</span>
                                <button type="button" onClick={() => handleRemoveTagFromList(index)} className="font-mono text-xs hover:text-red-500">&times;</button>
                            </div>
                        ))}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={currentTagText}
                                onChange={e => setCurrentTagText(e.target.value)}
                                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Nom etiqueta"
                            />
                            <button 
                                type="button" 
                                onClick={handleAddTagToList}
                                className="bg-primary text-white font-semibold px-4 rounded-lg text-sm"
                            >Afegir</button>
                        </div>
                        <div className="flex justify-around">
                            {TAG_COLORS.map(color => (
                                <button
                                    key={color.id}
                                    type="button"
                                    onClick={() => setCurrentTagColor(color.id)}
                                    className={`w-6 h-6 rounded-full transition-all ${currentTagColor === color.id ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100'}`}
                                    style={{ backgroundColor: color.hex }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                 <button 
                    type="button" 
                    onClick={() => setIsTaskModalOpen(false)}
                    className="flex-1 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                >
                    CANCEL·LAR
                </button>
                <button 
                    type="submit"
                    className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                >
                    AFEGIR TASCA
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
