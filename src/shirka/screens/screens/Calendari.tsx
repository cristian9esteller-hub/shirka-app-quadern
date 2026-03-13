
import React, { useState, useMemo } from 'react';
import Icon from '../components/Icon';
import { CalendarEvent, Meeting, MeetingType } from '../types';

declare var XLSX: any;

type ViewMode = 'day' | 'week' | 'month';
type CalendarItem = CalendarEvent & { source: 'event' | 'meeting' };


interface CalendariProps {
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;
  meetings: Meeting[];
  subjects: string[];
}

const EVENT_COLORS = [
    { id: 'red', bg: 'bg-red-500', light: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-500', text: 'text-red-700 dark:text-red-300' },
    { id: 'blue', bg: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300' },
    { id: 'green', bg: 'bg-green-500', light: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-500', text: 'text-green-700 dark:text-green-300' },
    { id: 'amber', bg: 'bg-amber-500', light: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-500', text: 'text-amber-700 dark:text-amber-300' },
    { id: 'purple', bg: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300' },
    { id: 'pink', bg: 'bg-pink-500', light: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-500', text: 'text-pink-700 dark:text-pink-300' },
];

const Calendari: React.FC<CalendariProps> = ({ events, setEvents, meetings, subjects }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [viewDate, setViewDate] = useState(new Date());

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDateStr, setSelectedDateStr] = useState('');
    const [eventForm, setEventForm] = useState({
        title: '',
        time: '09:00',
        color: 'blue',
        description: '',
        subject: '',
        isRecurring: false,
        dayOfWeek: 1,
    });
    
    const allCalendarItems = useMemo(() => {
        const meetingColorMap: Record<MeetingType, string> = {
            'Tutoria Família': 'blue',
            'Claustre': 'green',
            'Nivell': 'purple',
            'Coordinació': 'red',
            'Altres': 'amber',
        };

        const mappedMeetings: CalendarItem[] = meetings.map(m => ({
            id: `meeting-${m.id}`,
            title: m.title,
            date: m.date,
            time: m.time,
            color: meetingColorMap[m.type],
            description: `Tipus: ${m.type}\nTemes: ${m.discussion}\nAcords: ${m.agreements}`,
            subject: m.type,
            recurring: m.recurring,
            source: 'meeting',
        }));

        const mappedEvents: CalendarItem[] = events.map(e => ({ ...e, source: 'event' }));

        return [...mappedEvents, ...mappedMeetings];
    }, [events, meetings]);


    const daysOfWeek = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
    const monthNames = [
        'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
        'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'
    ];

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const navigateDate = (amount: number) => {
        const newDate = new Date(viewDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + amount);
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (amount * 7));
        } else {
            newDate.setDate(newDate.getDate() + amount);
        }
        setViewDate(newDate);
    };

    const goToToday = () => setViewDate(new Date());

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(viewDate);
        newDate.setFullYear(parseInt(e.target.value));
        setViewDate(newDate);
    };

    const handleDayDoubleClick = (day: number, isCurrentMonth: boolean) => {
        if (!isCurrentMonth) return;
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        
        const clickedDate = new Date(year, month, day);
        const dayOfWeek = clickedDate.getDay() === 0 ? 7 : clickedDate.getDay();

        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        setSelectedDateStr(dateStr);
        setEventForm({
            title: '',
            time: '09:00',
            color: 'blue',
            description: '',
            subject: '',
            isRecurring: false,
            dayOfWeek: dayOfWeek,
        });
        setIsModalOpen(true);
    };

    const saveEvent = (e: React.FormEvent) => {
        e.preventDefault();
        const newEvent: CalendarEvent = {
            id: Date.now().toString(),
            date: selectedDateStr,
            title: eventForm.title,
            time: eventForm.time,
            color: eventForm.color,
            description: eventForm.description,
            subject: eventForm.subject || undefined,
        };

        if (eventForm.isRecurring) {
            newEvent.recurring = { dayOfWeek: eventForm.dayOfWeek };
        }
        
        setEvents([...events, newEvent]);
        setIsModalOpen(false);
    };

    const deleteEvent = (id: string) => {
        setEvents(events.filter(e => e.id !== id));
    };
    
    const getEventsForDate = (targetDateStr: string) => {
        const targetDate = new Date(targetDateStr);
        targetDate.setHours(0, 0, 0, 0); 
        const dayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay();

        const singleEvents = allCalendarItems.filter(e => !e.recurring && e.date === targetDateStr);
        
        const recurringEvents = allCalendarItems.filter(e => {
            if (!e.recurring) return false;
            
            const startDate = new Date(e.date);
            startDate.setHours(0, 0, 0, 0);
            
            return e.recurring.dayOfWeek === dayOfWeek && startDate.getTime() <= targetDate.getTime();
        });

        return [...singleEvents, ...recurringEvents].sort((a, b) => a.time.localeCompare(b.time));
    };

    const formatEventTitle = (event: CalendarItem) => {
        if (event.source === 'meeting') return event.title;
        if (!event.subject) return event.title;
        const prefix = event.subject.substring(0, 3).toUpperCase();
        return `[${prefix}] ${event.title}`;
    };

    const handleExport = () => {
        let exportData: any[] = [];
        let fileName = "calendari";

        if (viewMode === 'day') {
            const dateStr = viewDate.toISOString().split('T')[0];
            const dayEvents = getEventsForDate(dateStr);
            exportData = dayEvents.map(ev => ({
                Data: dateStr,
                Hora: ev.time,
                Títol: ev.title,
                Matèria: ev.subject || '-',
                Tipus: ev.source === 'meeting' ? 'Reunió' : 'Esdeveniment',
                Descripció: ev.description || '-'
            }));
            fileName = `Calendari_Dia_${dateStr}`;
        } 
        else if (viewMode === 'week') {
            const startOfWeek = new Date(viewDate);
            const day = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
            startOfWeek.setDate(diff);

            for (let i = 0; i < 7; i++) {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];
                const dayEvents = getEventsForDate(dateStr);
                dayEvents.forEach(ev => {
                    exportData.push({
                        Data: dateStr,
                        Hora: ev.time,
                        Títol: ev.title,
                        Matèria: ev.subject || '-',
                        Tipus: ev.source === 'meeting' ? 'Reunió' : 'Esdeveniment',
                        Descripció: ev.description || '-'
                    });
                });
            }
            const firstDate = startOfWeek.toISOString().split('T')[0];
            fileName = `Calendari_Setmana_${firstDate}`;
        }
        else if (viewMode === 'month') {
            const year = viewDate.getFullYear();
            const month = viewDate.getMonth();
            const daysInMonth = getDaysInMonth(year, month);
            
            for (let i = 1; i <= daysInMonth; i++) {
                const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
                const dayEvents = getEventsForDate(dateStr);
                dayEvents.forEach(ev => {
                    exportData.push({
                        Data: dateStr,
                        Hora: ev.time,
                        Títol: ev.title,
                        Matèria: ev.subject || '-',
                        Tipus: ev.source === 'meeting' ? 'Reunió' : 'Esdeveniment',
                        Descripció: ev.description || '-'
                    });
                });
            }
            fileName = `Calendari_Mes_${year}_${month + 1}`;
        }

        if (exportData.length === 0) {
            alert("No hi ha esdeveniments per exportar en aquest període.");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Agenda");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    };

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const today = new Date();
    const isToday = (d: number, m: number, y: number) => 
        today.getDate() === d && today.getMonth() === m && today.getFullYear() === y;

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
    }, []);

    const renderMonthView = () => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const prevMonthDays = getDaysInMonth(year, month - 1);
        
        const grid = [];
        for (let i = firstDay - 1; i >= 0; i--) {
            grid.push({ day: prevMonthDays - i, currentMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            grid.push({ day: i, currentMonth: true });
        }
        const remaining = 42 - grid.length;
        for (let i = 1; i <= remaining; i++) {
            grid.push({ day: i, currentMonth: false });
        }

        return (
            <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                {daysOfWeek.map(d => (
                    <div key={d} className="bg-slate-50 dark:bg-surface-dark p-2 text-center text-[10px] md:text-xs font-bold uppercase text-slate-500">
                        {d}
                    </div>
                ))}
                {grid.map((item, idx) => {
                    const activeToday = item.currentMonth && isToday(item.day, month, year);
                    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${item.day.toString().padStart(2, '0')}`;
                    const dayEvents = item.currentMonth ? getEventsForDate(dateStr) : [];
                    const isWeekend = idx % 7 === 5 || idx % 7 === 6;
                    
                    return (
                        <div 
                            key={idx} 
                            onDoubleClick={() => handleDayDoubleClick(item.day, item.currentMonth)}
                            className={`h-24 md:h-32 p-1.5 md:p-2 flex flex-col gap-1 transition-colors select-none ${isWeekend ? 'bg-slate-100/50 dark:bg-slate-800/20' : 'bg-white dark:bg-background-dark'} ${!item.currentMonth ? 'opacity-30' : 'hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer'}`}
                        >
                            <span className={`text-[10px] md:text-sm font-bold ${activeToday ? 'w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full bg-primary text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                {item.day}
                            </span>
                            <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none">
                                {dayEvents.map(ev => {
                                    const colorStyle = EVENT_COLORS.find(c => c.id === ev.color) || EVENT_COLORS[1];
                                    const isMeeting = ev.source === 'meeting';
                                    return (
                                        <div 
                                            key={ev.id} 
                                            className={`group relative px-1.5 py-0.5 rounded ${colorStyle.light} border-l-2 ${colorStyle.border} ${colorStyle.text} text-[8px] md:text-[10px] truncate flex items-center`}
                                            title={`${ev.time} - ${formatEventTitle(ev)}`}
                                        >
                                            {ev.recurring && <Icon name="sync" className="text-[8px] mr-1" />}
                                            {isMeeting && <Icon name="groups_3" className="text-[8px] mr-1" />}
                                            <span className="font-bold mr-1">{ev.time}</span> 
                                            <span className="truncate">{formatEventTitle(ev)}</span>
                                            {!isMeeting && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }}
                                                    className="absolute right-0 top-0 h-full px-1 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Icon name="close" className="text-[10px]" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderWeekView = () => {
        const startOfWeek = new Date(viewDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);

        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d;
        });

        return (
            <div className="flex flex-col h-full bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    {weekDays.map((d, i) => {
                        const activeToday = isToday(d.getDate(), d.getMonth(), d.getFullYear());
                        return (
                            <div key={i} className="p-2 md:p-4 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                                <p className="text-[10px] font-bold text-slate-500 uppercase">{daysOfWeek[i]}</p>
                                <p className={`text-sm md:text-xl font-bold mt-1 ${activeToday ? 'text-primary' : ''}`}>{d.getDate()}</p>
                            </div>
                        );
                    })}
                </div>
                <div className="flex-1 grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-800">
                    {weekDays.map((d, i) => {
                        const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                        const dayEvents = getEventsForDate(dateStr);
                        return (
                            <div key={i} className="h-full p-1 md:p-2 space-y-1 overflow-y-auto">
                                {dayEvents.map(ev => {
                                    const colorStyle = EVENT_COLORS.find(c => c.id === ev.color) || EVENT_COLORS[1];
                                    return (
                                        <div key={ev.id} className={`p-1.5 rounded ${colorStyle.light} border-l-2 ${colorStyle.border} ${colorStyle.text} text-[10px]`}>
                                            <p className="font-bold">{ev.time}</p>
                                            <p className="truncate font-medium flex items-center gap-1">
                                                {ev.source === 'meeting' && <Icon name="groups_3" className="text-xs" />}
                                                {formatEventTitle(ev)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const activeToday = isToday(viewDate.getDate(), viewDate.getMonth(), viewDate.getFullYear());
        const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${viewDate.getDate().toString().padStart(2, '0')}`;
        const dayEvents = getEventsForDate(dateStr);

        return (
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 md:p-10 h-full overflow-y-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl flex flex-col items-center justify-center shrink-0 ${activeToday ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                        <span className="text-[10px] md:text-xs font-bold uppercase">{daysOfWeek[viewDate.getDay() === 0 ? 6 : viewDate.getDay() - 1]}</span>
                        <span className="text-xl md:text-3xl font-bold">{viewDate.getDate()}</span>
                    </div>
                    <div>
                        <h3 className="text-lg md:text-2xl font-bold">{monthNames[month]} {year}</h3>
                        <p className="text-sm text-slate-500">{dayEvents.length} esdeveniments programats.</p>
                    </div>
                </div>
                <div className="space-y-4">
                    {dayEvents.length > 0 ? dayEvents.map(ev => {
                        const colorStyle = EVENT_COLORS.find(c => c.id === ev.color) || EVENT_COLORS[1];
                        return (
                            <div key={ev.id} className={`p-4 border-l-4 ${colorStyle.border} ${colorStyle.light} rounded-r-xl`}>
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-lg flex items-center gap-2">
                                       {ev.source === 'meeting' && <Icon name="groups_3" />}
                                       {ev.recurring && <Icon name="sync" className="text-sm opacity-60" />} {formatEventTitle(ev)}
                                    </h4>
                                    <span className="text-sm font-mono font-bold opacity-70">{ev.time}</span>
                                </div>
                                <p className="text-sm opacity-80 mt-1">{ev.description || 'Sense descripció'}</p>
                            </div>
                        );
                    }) : (
                        <div className="py-20 text-center">
                            <Icon name="event_busy" className="text-4xl text-slate-300 mb-2" />
                            <p className="text-slate-400">No hi ha res programat per avui.</p>
                            <button 
                                onClick={() => handleDayDoubleClick(viewDate.getDate(), true)}
                                className="mt-4 text-primary font-bold hover:underline"
                            >
                                Afegir esdeveniment
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const upcomingItems = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return allCalendarItems
            .filter(item => item.date >= todayStr && !item.recurring) // Show only single upcoming events for simplicity
            .sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
            .slice(0, 5);
    }, [allCalendarItems]);


    return (
        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <header className="h-16 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
                <div className="flex items-center gap-2 md:gap-4">
                    <h1 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white hidden sm:block">Agenda</h1>
                    <div className="flex items-center gap-1 md:gap-2">
                         <select 
                            value={year} 
                            onChange={handleYearChange}
                            className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button onClick={() => navigateDate(-1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
                            <Icon name="chevron_left" />
                        </button>
                        <button onClick={goToToday} className="px-3 py-1 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors">AVUI</button>
                        <button onClick={() => navigateDate(1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
                            <Icon name="chevron_right" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mr-2">
                        {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
                            <button 
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-3 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-lg transition-all ${viewMode === mode ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500'}`}
                            >
                                {mode === 'day' ? 'DIA' : mode === 'week' ? 'SETMANA' : 'MES'}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                        title="Descarregar agenda actual"
                    >
                        <Icon name="download" type="outlined" className="text-[18px]" />
                        <span className="hidden lg:inline">Exportar</span>
                    </button>
                    <button onClick={() => handleDayDoubleClick(viewDate.getDate(), true)} className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all">
                        <Icon name="add" className="text-sm" /> Nou
                    </button>
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                <section className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 dark:border-slate-800">
                    <div className="px-4 md:px-8 py-3 md:py-4 flex items-center justify-between shrink-0 bg-white/50 dark:bg-surface-dark/50">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
                            {monthNames[month]} <span className="font-light opacity-50">{year}</span>
                        </h2>
                        {viewMode === 'week' && <span className="text-[10px] md:text-xs font-bold text-slate-400">SETMANA DEL {viewDate.getDate()}</span>}
                    </div>
                    
                    <div className="flex-1 p-2 md:p-8 overflow-y-auto">
                        {viewMode === 'month' && renderMonthView()}
                        {viewMode === 'week' && renderWeekView()}
                        {viewMode === 'day' && renderDayView()}
                    </div>
                </section>

                <aside className="w-full lg:w-[350px] bg-white dark:bg-surface-dark border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
                     <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Icon name="event_note" className="text-primary"/> Propers Esdeveniments
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Tens <strong className="text-primary">{allCalendarItems.length} activitats</strong> en total.</p>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-background-dark/30">
                        {upcomingItems.map(ev => {
                            const colorStyle = EVENT_COLORS.find(c => c.id === ev.color) || EVENT_COLORS[1];
                            const evDate = new Date(ev.date);
                            const isEvToday = isToday(evDate.getDate(), evDate.getMonth(), evDate.getFullYear());
                            
                            return (
                                <div key={ev.id} className={`bg-white dark:bg-slate-800 rounded-xl border-l-4 ${colorStyle.border} p-4 shadow-sm group hover:shadow-md transition-all cursor-pointer`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-sm truncate pr-2 flex items-center gap-1.5">
                                            {ev.source === 'meeting' && <Icon name="groups_3" className="text-xs" />}
                                            {formatEventTitle(ev)}
                                        </h4>
                                        {isEvToday && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">AVUI</span>}
                                    </div>
                                    <p className="text-[10px] text-slate-500 flex items-center gap-1 uppercase font-bold tracking-wider">
                                        <Icon name="event" className="text-xs"/> {new Date(ev.date + 'T00:00:00').toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })} • {ev.time}
                                    </p>
                                </div>
                            );
                        })}
                        {upcomingItems.length === 0 && (
                            <div className="py-10 text-center opacity-40">
                                <Icon name="event_available" className="text-4xl mb-2" />
                                <p className="text-xs">Agenda buida</p>
                            </div>
                        )}
                     </div>
                     <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-[10px] text-center text-slate-400 mb-2">Consell: Fes doble clic en un dia per crear esdeveniments</p>
                        <button className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors uppercase tracking-widest">
                            GESTIONAR CALENDARI
                        </button>
                     </div>
                </aside>
            </div>

            {/* Modal de Creació d'Esdeveniment */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <form onSubmit={saveEvent} className="flex flex-col flex-1 min-h-0">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Icon name="add_circle" className="text-primary" /> Nou Esdeveniment
                                </h2>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <Icon name="close" />
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-4 overflow-y-auto">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Títol</label>
                                    <input 
                                        type="text" 
                                        required
                                        autoFocus
                                        value={eventForm.title}
                                        onChange={e => setEventForm({...eventForm, title: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="Ex: Excursió al bosc"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Matèria (Opcional)</label>
                                    <select
                                        value={eventForm.subject}
                                        onChange={e => setEventForm({...eventForm, subject: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none"
                                    >
                                        <option value="">-- Cap --</option>
                                        {subjects.map(materia => (
                                            <option key={materia} value={materia}>{materia}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
                                        <input 
                                            type="text" 
                                            readOnly
                                            value={selectedDateStr}
                                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-500"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Hora</label>
                                        <input 
                                            type="time" 
                                            required
                                            value={eventForm.time}
                                            onChange={e => setEventForm({...eventForm, time: e.target.value})}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Color de l'etiqueta</label>
                                    <div className="flex justify-between gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        {EVENT_COLORS.map(c => (
                                            <button 
                                                key={c.id}
                                                type="button"
                                                onClick={() => setEventForm({...eventForm, color: c.id})}
                                                className={`w-8 h-8 rounded-lg transition-all ${c.bg} ${eventForm.color === c.id ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-slate-900 scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="isRecurring"
                                        checked={eventForm.isRecurring}
                                        onChange={e => setEventForm({ ...eventForm, isRecurring: e.target.checked })}
                                        className="w-5 h-5 rounded text-primary focus:ring-primary/50 border-slate-300"
                                    />
                                    <label htmlFor="isRecurring" className="flex-1 text-sm font-medium">Repetir cada setmana</label>
                                    {eventForm.isRecurring && (
                                        <select
                                            value={eventForm.dayOfWeek}
                                            onChange={e => setEventForm({ ...eventForm, dayOfWeek: parseInt(e.target.value) })}
                                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="1">Dilluns</option>
                                            <option value="2">Dimarts</option>
                                            <option value="3">Dimecres</option>
                                            <option value="4">Dijous</option>
                                            <option value="5">Divendres</option>
                                            <option value="6">Dissabte</option>
                                            <option value="7">Diumenge</option>
                                        </select>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Descripció</label>
                                    <textarea 
                                        value={eventForm.description}
                                        onChange={e => setEventForm({...eventForm, description: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none min-h-[80px]"
                                        placeholder="Afegir més detalls..."
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-3 shrink-0">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    CANCEL·LAR
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                                >
                                    GUARDAR
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Calendari;
