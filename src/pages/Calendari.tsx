import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import EventCard from '../components/EventCard';
import { CalendarEvent, Meeting, MeetingType, Note } from '../types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    FileText,
    Save,
    Loader2,
    Type,
    StickyNote,
    ExternalLink,
    Link as LinkIcon,
    Youtube,
    Presentation,
    TableProperties,
    Cloud
} from "lucide-react";
import { renderTextWithLinks } from '@/lib/string-utils';
import { DEFAULT_SCHOOL_CONFIG, isWithinSchoolYear, getSchoolMonths } from '@/lib/school-config';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import XLSX from 'xlsx-js-style';

type ViewMode = 'day' | 'week' | 'month';
type CalendarItem = CalendarEvent & { source: 'event' | 'meeting' };

interface CalendariProps {
    events: CalendarEvent[];
    onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
    onDeleteEvent: (id: string) => void;
    meetings: Meeting[];
    subjects: string[];
}

const EVENT_COLORS = [
    { id: 'red', bg: 'bg-red-500', light: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-500', text: 'text-red-700 dark:text-red-300' },
    { id: 'blue', bg: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300' },
    { id: 'green', bg: 'bg-green-500', light: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-500', text: 'text-green-700 dark:text-green-300' },
    { id: 'amber', bg: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-500', text: 'text-amber-700 dark:text-amber-300' },
    { id: 'purple', bg: 'bg-purple-500', light: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300' },
    { id: 'pink', bg: 'bg-pink-500', light: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-500', text: 'text-pink-700 dark:text-pink-300' },
];

const Calendari: React.FC<CalendariProps> = ({ events, onAddEvent, onDeleteEvent, meetings, subjects }) => {
    const { profile, updateProfile, notes, fetchLinks, updateNote, addEvent, updateEvent } = useData();
    const navigate = useNavigate();
    const schoolConfig = {
        startDate: profile.schoolStart || DEFAULT_SCHOOL_CONFIG.startDate,
        endDate: profile.schoolEnd || DEFAULT_SCHOOL_CONFIG.endDate
    };

    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [viewDate, setViewDate] = useState(new Date());

    // Fetch links on mount
    React.useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    // Auxiliary to find notes for an event
    const getNotesForEvent = (eventId: string) => {
        if (!notes || !eventId) return [];
        return notes.filter(n => n.linkedEventIds && n.linkedEventIds.includes(eventId));
    };

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [localNoteContent, setLocalNoteContent] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarItem | null>(null);

    // Link detection for the modal
    const modalUrlMatch = localNoteContent.match(/(https?:\/\/[^\s]+|www\.[^\s]+\.[^\s]+|www\.[^\s]+\/?[^\s]*)/gi);
    const [selectedDateStr, setSelectedDateStr] = useState('');
    const [eventForm, setEventForm] = useState({
        title: '',
        startDate: '',
        time: '09:00',
        color: 'blue',
        description: '',
        subject: '',
        endDate: '',
        subtype: 'Vacances',
        type: 'general' as 'general' | 'festiu' | 'vacances',
        isRecurring: false,
        dayOfWeek: 1,
    });

    const handleOpenNote = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const note = notes.find(n => n.id === id);
        if (note) {
            setEditingNote(note);
            setLocalNoteContent(note.contingut || '');
            setIsNoteModalOpen(true);
        }
    };

    const handleSaveNote = async () => {
        if (!editingNote) return;
        setIsSavingNote(true);
        try {
            await updateNote(editingNote.id, { contingut: localNoteContent });
            toast.success('Nota guardada');
        } catch (error) {
            toast.error('Error al guardar la nota');
        } finally {
            setIsSavingNote(false);
        }
    };

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

        // Restricció de navegació
        if (isWithinSchoolYear(newDate, schoolConfig)) {
            setViewDate(newDate);
        }
    };

    const goToToday = () => setViewDate(new Date());

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(viewDate);
        newDate.setFullYear(parseInt(e.target.value));
        setViewDate(newDate);
    };

    const handleCellClick = (dayOrDate: number | string, isCurrentMonth: boolean = true) => {
        if (!isCurrentMonth) return;
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        let dateStr = '';
        let dayOfWeek = 0;

        if (typeof dayOrDate === 'number') {
            const clickedDate = new Date(year, month, dayOrDate);
            dayOfWeek = clickedDate.getDay() === 0 ? 7 : clickedDate.getDay();
            dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayOrDate.toString().padStart(2, '0')}`;
        } else {
            dateStr = dayOrDate;
            const d = new Date(dayOrDate);
            dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
        }

        setSelectedDateStr(dateStr);
        setEditingEvent(null);
        setEventForm({
            title: '',
            startDate: dateStr,
            time: '09:00',
            color: 'blue',
            description: '',
            subject: '',
            endDate: dateStr,
            subtype: 'Vacances',
            type: 'general',
            isRecurring: false,
            dayOfWeek: dayOfWeek,
        });
        setIsModalOpen(true);
    };

    const handleEventClick = (event: CalendarItem, e: React.MouseEvent) => {
        e.stopPropagation();
        if (event.source === 'meeting') return; // En reunións no editem desde aquí de momento

        setEditingEvent(event);
        setSelectedDateStr(event.date);
        setEventForm({
            title: event.title,
            startDate: event.date,
            time: event.time || '09:00',
            color: event.color || 'blue',
            description: event.description || '',
            subject: event.subject || '',
            endDate: event.endDate || event.date,
            subtype: event.subtype || 'Vacances',
            type: event.type || 'general',
            isRecurring: !!event.recurring && event.recurring.type === 'weekly',
            dayOfWeek: (event.recurring?.type === 'weekly' ? event.recurring.dayOfWeek : 1) as any,
        });
        setIsModalOpen(true);
    };

    const saveEvent = async (e: React.FormEvent) => {
        e.preventDefault();

        let finalTitle = eventForm.title;
        if ((eventForm.type === 'festiu' || eventForm.type === 'vacances') && eventForm.subtype) {
            finalTitle = `${eventForm.title || (eventForm.type === 'festiu' ? 'FESTIU' : 'VACANCES')} (${eventForm.subtype})`;
        }

        const eventData: any = {
            date: eventForm.startDate,
            title: finalTitle,
            type: eventForm.type as any,
            time: eventForm.time,
            color: (eventForm.type === 'festiu' || eventForm.type === 'vacances') ? 'red' : eventForm.color,
            description: eventForm.description,
            subject: eventForm.subject || undefined,
        };

        if ((eventForm.type === 'festiu' || eventForm.type === 'vacances') && eventForm.endDate) {
            eventData.endDate = eventForm.endDate;
            eventData.recurring = { type: 'range', endDate: eventForm.endDate };
        } else if (eventForm.isRecurring) {
            eventData.recurring = { type: 'weekly', dayOfWeek: eventForm.dayOfWeek };
        } else {
            eventData.recurring = null;
        }

        try {
            let result;
            if (editingEvent) {
                result = await updateEvent(editingEvent.id, eventData);
                toast.success('Esdeveniment actualitzat');
            } else {
                result = await addEvent(eventData);
                toast.success('Esdeveniment creat');
            }

            if (result?.error) {
                toast.error(`Error: ${result.error.message || 'Error desconegut'}`);
            } else {
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error("Error crític guardant l'esdeveniment:", error);
            toast.error("S'ha produït un error inesperat.");
        }
    };

    const deleteEvent = (id: string) => {
        onDeleteEvent(id);
    };

    const getEventsForDate = (targetDateStr: string) => {
        const targetDate = new Date(targetDateStr);
        targetDate.setHours(0, 0, 0, 0);
        const dayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay();

        // Esdeveniments únics (que no tinguin endDate, o que la data coincideixi amb targetDate)
        const singleEvents = allCalendarItems.filter(e =>
            !e.recurring && (e.date === targetDateStr || e.date?.split('T')[0] === targetDateStr)
        );

        // Esdeveniments recurrents (setmanals o rangs de festius)
        const recurringEvents = allCalendarItems.filter(e => {
            if (!e.recurring) return false;

            // Normalitzem la data d'inici
            const startDateStr = e.date || (e as any).data_inici;
            if (!startDateStr) return false;

            const startDate = new Date(startDateStr.includes('T') ? startDateStr : startDateStr + 'T00:00:00');
            startDate.setHours(0, 0, 0, 0);

            // Rang de dates (Festius per bloc)
            if (e.recurring.type === 'range' || (e as any).endDate || (e as any).data_fi) {
                const rawEndDate = (e as any).endDate || (e as any).data_fi || (e.recurring as any).endDate;
                if (!rawEndDate) return targetDate.getTime() === startDate.getTime();

                const endDate = new Date(rawEndDate.includes('T') ? rawEndDate : rawEndDate + 'T00:00:00');
                endDate.setHours(0, 0, 0, 0);

                return targetDate >= startDate && targetDate <= endDate;
            }

            // Recurrent setmanal
            if (e.recurring.type === 'weekly') {
                return e.recurring.dayOfWeek === dayOfWeek && startDate.getTime() <= targetDate.getTime();
            }

            return false;
        });

        return [...singleEvents, ...recurringEvents].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    };

    const formatEventTitle = (event: CalendarItem) => {
        if (event.source === 'meeting') return event.title;
        if (!event.subject) return event.title;
        const prefix = event.subject.substring(0, 3).toUpperCase();
        return `[${prefix}] ${event.title} `;
    };

    const formatDateToYYYYMMDD = (date: Date) => {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        return `${y} -${m} -${d} `;
    };

    const handleExport = (type: 'day' | 'week' | 'month') => {
        let exportData: any[] = [];
        let fileName = "calendari";

        if (type === 'day') {
            const dateStr = formatDateToYYYYMMDD(viewDate);
            const dayEvents = getEventsForDate(dateStr);
            exportData = dayEvents.map(ev => ({
                Data: dateStr,
                Hora: ev.time,
                Títol: ev.title,
                Matèria: ev.subject || '-',
                Tipus: ev.source === 'meeting' ? 'Reunió' : 'Esdeveniment',
                Descripció: ev.description || '-'
            }));
            fileName = `Calendari_Dia_${dateStr} `;
        }
        else if (type === 'week') {
            const startOfWeek = new Date(viewDate);
            const day = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
            startOfWeek.setDate(diff);

            for (let i = 0; i < 7; i++) {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                const dateStr = formatDateToYYYYMMDD(d);
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
            const firstDate = formatDateToYYYYMMDD(startOfWeek);
            fileName = `Calendari_Setmana_${firstDate} `;
        }
        else if (type === 'month') {
            const year = viewDate.getFullYear();
            const month = viewDate.getMonth();
            const daysInMonth = getDaysInMonth(year, month);

            for (let i = 1; i <= daysInMonth; i++) {
                const dateStr = `${year} -${(month + 1).toString().padStart(1, '0')} -${i.toString().padStart(2, '0')} `;
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
            fileName = `Calendari_Mes_${year}_${(month + 1).toString().padStart(2, '0')} `;
        }

        if (exportData.length === 0) {
            const typeLabel = type === 'day' ? 'dia seleccionat' : type === 'week' ? 'setmana seleccionada' : 'mes seleccionat';
            alert(`No s'han trobat esdeveniments per exportar al ${typeLabel}.`);
            setIsExportMenuOpen(false);
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);

        // Auto-justify columns
        const colWidths = [
            { wch: 12 }, // Data
            { wch: 8 },  // Hora
            { wch: 30 }, // Títol
            { wch: 15 }, // Matèria
            { wch: 15 }, // Tipus
            { wch: 50 }  // Descripció
        ];
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Agenda");
        XLSX.writeFile(wb, fileName);
        setIsExportMenuOpen(false);
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
                    const isHolidayDay = dayEvents.some(ev => ev.type === 'festiu' || ev.title.toUpperCase().includes('FESTIU'));

                    return (
                        <div
                            key={idx}
                            onClick={() => handleCellClick(item.day, item.currentMonth)}
                            className={`h-24 md:h-32 p-1.5 md:p-2 flex flex-col gap-1 transition-colors select-none ${isWeekend ? 'bg-slate-100/50 dark:bg-slate-800/20' : 'bg-white dark:bg-background-dark'} ${!item.currentMonth ? 'opacity-30' : 'hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer'}`}
                        >
                            <span className={`text-[10px] md:text-sm font-black ${activeToday ? 'w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full bg-primary text-white' : isHolidayDay ? 'text-red-600 dark:text-red-400 scale-110' : 'text-slate-700 dark:text-slate-300'}`}>
                                {item.day}
                            </span>
                            <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none">
                                {dayEvents.map(ev => {
                                    const colorStyle = EVENT_COLORS.find(c => c.id === ev.color) || EVENT_COLORS[1];
                                    const isMeeting = ev.source === 'meeting';
                                    const isHoliday = ev.type === 'festiu' || ev.title.toUpperCase().includes('FESTIU');

                                    const eventDate = new Date(ev.date + 'T00:00:00');
                                    const evWeekday = eventDate.toLocaleDateString('ca-ES', { weekday: 'short' });
                                    const evDayNum = eventDate.getDate();
                                    const evMonthName = eventDate.toLocaleDateString('ca-ES', { month: 'short' });

                                    return (
                                        <Tooltip key={ev.id}>
                                            <TooltipTrigger asChild>
                                                <div
                                                    onClick={(e) => handleEventClick(ev, e)}
                                                    className={`group relative px-1.5 py-0.5 rounded ${isHoliday ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-l-2 border-slate-300' : `${colorStyle.light} border-l-2 ${colorStyle.border} ${colorStyle.text}`} text-[8px] md:text-[10px] truncate flex items-center cursor-default`}
                                                >
                                                    {ev.recurring?.type === 'weekly' && <Icon name="sync" className="text-[8px] mr-1" />}
                                                    {isMeeting && <Icon name="groups_3" className="text-[8px] mr-1" />}
                                                    {getNotesForEvent(ev.id).length > 0 && <Icon name="menu_book" className="text-[9px] mr-1 text-primary animate-pulse" />}
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
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="top"
                                                className={`p-0 overflow-hidden border-t-4 ${colorStyle.border} rounded-xl shadow-2xl max-w-xs animate-in zoom-in-95 duration-200`}
                                            >
                                                <div className="p-4 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${colorStyle.bg}`} />
                                                        <h5 className="font-bold text-xs uppercase tracking-tight">{ev.title}</h5>
                                                    </div>
                                                    {ev.description && (
                                                        <p className="text-[10px] text-muted-foreground leading-relaxed italic border-l-2 border-slate-100 dark:border-slate-800 pl-2">
                                                            {renderTextWithLinks(ev.description)}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-3 pt-1 opacity-60 text-[9px] font-bold uppercase">
                                                        <div className="flex items-center gap-1">
                                                            <Icon name="calendar_today" className="text-xs" />
                                                            {evWeekday} {evDayNum} {evMonthName}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Icon name="schedule" className="text-xs" />
                                                            {ev.time}
                                                        </div>
                                                        {getNotesForEvent(ev.id).length > 0 && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="ml-auto h-7 px-2 text-[9px] font-black uppercase text-primary border-primary/20 hover:bg-primary/5 rounded-lg"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const notes = getNotesForEvent(ev.id);
                                                                    navigate('/llibreta', { state: { selectedNoteId: notes[0].id } });
                                                                }}
                                                            >
                                                                <FileText className="w-3 h-3 mr-1" />
                                                                📖 Obrir preparació de classe
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
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
                            <div key={i} onClick={() => handleCellClick(dateStr)} className="h-full p-1 md:p-2 space-y-1 overflow-y-auto cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                {dayEvents.map(ev => {
                                    const colorStyle = EVENT_COLORS.find(c => c.id === ev.color) || EVENT_COLORS[1];
                                    const eventDate = new Date(ev.date + 'T00:00:00');
                                    const evWeekday = eventDate.toLocaleDateString('ca-ES', { weekday: 'short' });
                                    const evDayNum = eventDate.getDate();
                                    const evMonthName = eventDate.toLocaleDateString('ca-ES', { month: 'short' });

                                    return (
                                        <Tooltip key={ev.id}>
                                            <TooltipTrigger asChild>
                                                <div
                                                    onClick={(e) => handleEventClick(ev, e)}
                                                    className={`p-1.5 rounded ${colorStyle.light} border-l-2 ${colorStyle.border} ${colorStyle.text} text-[10px] cursor-default`}
                                                >
                                                    <p className="font-bold">{ev.time}</p>
                                                    <p className="truncate font-medium flex items-center gap-1">
                                                        {ev.source === 'meeting' && <Icon name="groups_3" className="text-xs" />}
                                                        {getNotesForEvent(ev.id).length > 0 && <Icon name="menu_book" className="text-xs text-primary underline" />}
                                                        {formatEventTitle(ev)}
                                                    </p>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="top"
                                                className={`p-0 overflow-hidden border-t-4 ${colorStyle.border} rounded-xl shadow-2xl max-w-xs animate-in zoom-in-95 duration-200`}
                                            >
                                                <div className="p-4 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${colorStyle.bg}`} />
                                                        <h5 className="font-bold text-xs uppercase tracking-tight">{ev.title}</h5>
                                                    </div>
                                                    {ev.description && (
                                                        <p className="text-[10px] text-muted-foreground leading-relaxed italic border-l-2 border-slate-100 dark:border-slate-800 pl-2">
                                                            {renderTextWithLinks(ev.description)}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-3 pt-1 opacity-60 text-[9px] font-bold uppercase">
                                                        <div className="flex items-center gap-1">
                                                            <Icon name="calendar_today" className="text-xs" />
                                                            {evWeekday} {evDayNum} {evMonthName}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Icon name="schedule" className="text-xs" />
                                                            {ev.time}
                                                        </div>
                                                        {getNotesForEvent(ev.id).length > 0 && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="ml-auto h-7 px-2 text-[9px] font-black uppercase text-primary border-primary/20 hover:bg-primary/5 rounded-lg"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const notes = getNotesForEvent(ev.id);
                                                                    handleOpenNote(notes[0].id, e);
                                                                }}
                                                            >
                                                                <FileText className="w-3 h-3 mr-1" />
                                                                📖 Obrir preparació de classe
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
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
                            <Tooltip key={ev.id}>
                                <TooltipTrigger asChild>
                                    <div
                                        onClick={(e) => handleEventClick(ev, e)}
                                        className={`p-4 border-l-4 ${colorStyle.border} ${colorStyle.light} rounded-r-xl cursor-default transition-all hover:translate-x-1`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-lg flex items-center gap-2">
                                                {ev.source === 'meeting' && <Icon name="groups_3" />}
                                                {ev.recurring && <Icon name="sync" className="text-sm opacity-60" />}
                                                {getNotesForEvent(ev.id).length > 0 && <Icon name="menu_book" className="text-primary" />}
                                                {formatEventTitle(ev)}
                                            </h4>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-sm font-mono font-bold opacity-70">{ev.time}</span>
                                                {getNotesForEvent(ev.id).length > 0 && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-3 text-[10px] font-black uppercase text-primary border-primary/20 hover:bg-white rounded-lg shadow-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const notes = getNotesForEvent(ev.id);
                                                            handleOpenNote(notes[0].id, e);
                                                        }}
                                                    >
                                                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                                                        📖 Obrir preparació de classe
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm opacity-80 mt-1">{ev.description ? renderTextWithLinks(ev.description) : 'Sense descripció'}</p>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    className="p-0 border-none bg-transparent shadow-none"
                                >
                                    <EventCard
                                        title={ev.title}
                                        time={ev.time}
                                        date={ev.date}
                                        color={ev.color}
                                        isRecurring={!!ev.recurring}
                                        subject={ev.subject}
                                        description={ev.description}
                                        className="w-64"
                                    />
                                </TooltipContent>
                            </Tooltip>
                        );
                    }) : (
                        <div className="py-20 text-center">
                            <Icon name="event_busy" className="text-4xl text-slate-300 mb-2" />
                            <p className="text-slate-400">No hi ha res programat per avui.</p>
                            <button
                                onClick={() => handleCellClick(viewDate.getDate(), true)}
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
            .filter(item => item.date >= todayStr && !item.recurring)
            .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
            .slice(0, 5);
    }, [allCalendarItems]);


    return (
        <main className="flex-1 flex flex-col h-full overflow-hidden">
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
                        <button onClick={() => navigateDate(-1)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                            <Icon name="chevron_left" />
                        </button>
                        <button onClick={goToToday} className="h-10 px-4 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors uppercase tracking-widest">AVUI</button>
                        <button onClick={() => navigateDate(1)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                            <Icon name="chevron_right" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 relative">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl mr-2 h-[48px]">
                        {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`flex-1 px-4 flex items-center justify-center text-[10px] md:text-xs font-bold rounded-lg transition-all ${viewMode === mode ? 'bg-white dark:bg-surface-dark text-primary shadow-sm border border-slate-200/50 dark:border-white/5' : 'text-slate-500'}`}
                            >
                                {mode === 'day' ? 'DIA' : mode === 'week' ? 'SETMANA' : 'MES'}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            className="flex items-center gap-2 px-6 h-[44px] text-xs font-black text-white bg-[#b1454b] rounded-xl hover:bg-[#9a3b41] transition-all shadow-lg shadow-[#b1454b]/20 uppercase tracking-widest"
                            title="Descarregar agenda"
                        >
                            <Icon name="description" className="text-[18px]" />
                            <span className="hidden lg:inline">Exportar</span>
                        </button>

                        {isExportMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-2 space-y-1">
                                    <button
                                        onClick={() => handleExport('day')}
                                        className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <Icon name="today" className="text-sm opacity-50" /> Exportar el dia d'avui
                                    </button>
                                    <button
                                        onClick={() => handleExport('week')}
                                        className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <Icon name="date_range" className="text-sm opacity-50" /> Exportar la setmana
                                    </button>
                                    <button
                                        onClick={() => handleExport('month')}
                                        className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <Icon name="calendar_month" className="text-sm opacity-50" /> Exportar tot el mes
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={() => handleCellClick(viewDate.getDate(), true)} className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all">
                        <Icon name="add" className="text-sm" /> Nou
                    </button>
                </div>
            </header>

            <div className="flex-1 flex flex-col overflow-hidden">
                <section className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 md:px-8 py-3 md:py-4 flex items-center justify-between shrink-0 bg-white/50 dark:bg-surface-dark/50">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
                            {monthNames[month]} <span className="font-light opacity-50">{year}</span>
                        </h2>
                        {viewMode === 'week' && <span className="text-[10px] md:text-xs font-bold text-slate-400">SETMANA DEL {viewDate.getDate()}</span>}
                    </div>

                    <div className="flex-1 p-2 md:p-8 overflow-y-auto transition-all duration-300 ease-in-out">
                        {viewMode === 'month' && renderMonthView()}
                        {viewMode === 'week' && renderWeekView()}
                        {viewMode === 'day' && renderDayView()}
                    </div>
                </section>
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
                                    <label className="text-xs font-bold text-primary uppercase flex items-center gap-2">
                                        <Icon name="calendar_today" className="text-sm" /> Data Inici (Global)
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={eventForm.startDate}
                                        onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none font-bold"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tipus d'Esdeveniment</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'general', label: 'General', icon: 'event' },
                                            { id: 'festiu', label: 'Festiu Local', icon: 'beach_access' },
                                            { id: 'vacances', label: 'Vacances', icon: 'wb_sunny' }
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setEventForm({ ...eventForm, type: t.id as any })}
                                                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${eventForm.type === t.id ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-primary/30'}`}
                                            >
                                                <Icon name={t.icon} className="text-sm" /> {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Títol</label>
                                    <input
                                        type="text"
                                        required
                                        value={eventForm.title}
                                        onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none"
                                        placeholder={(eventForm.type === 'festiu' || eventForm.type === 'vacances') ? 'Nom del motiu (ex: Festa Major / Nadal)' : 'Ex: Excursió al bosc'}
                                    />
                                    {(eventForm.type === 'festiu' || eventForm.type === 'vacances') && (
                                        <div className="flex gap-2 mt-2">
                                            {['Escolar', 'Local', 'Pont', 'Extra'].map(st => (
                                                <button
                                                    key={st}
                                                    type="button"
                                                    onClick={() => setEventForm({ ...eventForm, subtype: st })}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${eventForm.subtype === st ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-red-200'}`}
                                                >
                                                    {st}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Matèria (Opcional)</label>
                                    <select
                                        value={eventForm.subject}
                                        onChange={e => setEventForm({ ...eventForm, subject: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none"
                                    >
                                        <option value="">-- Cap --</option>
                                        {subjects.map(materia => (
                                            <option key={materia} value={materia}>{materia}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 opacity-50">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Data Ref.</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={selectedDateStr}
                                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-500 text-center"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Hora</label>
                                        <input
                                            type="time"
                                            required
                                            value={eventForm.time}
                                            onChange={e => setEventForm({ ...eventForm, time: e.target.value })}
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
                                                onClick={() => setEventForm({ ...eventForm, color: c.id })}
                                                className={`w-8 h-8 rounded-lg transition-all ${c.bg} ${eventForm.color === c.id ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-slate-900 scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {(eventForm.type === 'festiu' || eventForm.type === 'vacances') ? (
                                    <div className="space-y-1.5 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Icon name="event_busy" className="text-red-500" />
                                            <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Configuració de Bloc / Rang</span>
                                        </div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Data Final del Bloc</label>
                                        <input
                                            type="date"
                                            required
                                            value={eventForm.endDate}
                                            onChange={e => setEventForm({ ...eventForm, endDate: e.target.value })}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none"
                                        />
                                        <p className="text-[10px] text-red-400 mt-2 italic">* Es crearan festius des del {eventForm.startDate} fins al {eventForm.endDate || '...'}</p>
                                    </div>
                                ) : (
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
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Descripció</label>
                                    <textarea
                                        value={eventForm.description}
                                        onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
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
            {/* Modal d'Edició de Nota (Preparació de Classe) */}
            {isNoteModalOpen && editingNote && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-4xl h-[80vh] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mb-1">Preparació de Classe</p>
                                    <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white leading-none">
                                        {editingNote.titol || 'Sense títol'}
                                    </h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isSavingNote && (
                                    <div className="flex items-center gap-2 text-primary font-bold text-xs animate-pulse mr-4">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        GUARDANT...
                                    </div>
                                )}
                                <button
                                    onClick={() => setIsNoteModalOpen(false)}
                                    className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    <Icon name="close" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-8 overflow-hidden flex flex-col space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">
                                <Icon name="notes" className="text-xs" /> Contingut de la nota
                            </div>
                            <textarea
                                value={localNoteContent}
                                onChange={(e) => setLocalNoteContent(e.target.value)}
                                className="flex-1 w-full bg-slate-50/50 dark:bg-slate-900/30 border-none rounded-3xl p-8 focus:ring-0 outline-none resize-none font-medium text-lg text-slate-700 dark:text-slate-300 leading-relaxed custom-scrollbar placeholder:text-slate-300"
                                placeholder="Escriu aquí la preparació de la classe..."
                            />

                            {modalUrlMatch && (
                                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 shadow-sm group/link">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-transform group-hover/link:scale-110 shadow-inner">
                                        {(() => {
                                            const url = modalUrlMatch[0].toLowerCase();
                                            if (url.includes('youtube.com') || url.includes('youtu.be')) return <Youtube className="w-5 h-5" />;
                                            if (url.includes('docs.google.com/document')) return <FileText className="w-5 h-5" />;
                                            if (url.includes('docs.google.com/presentation')) return <Presentation className="w-5 h-5" />;
                                            if (url.includes('docs.google.com/spreadsheets')) return <TableProperties className="w-5 h-5" />;
                                            if (url.includes('drive.google.com')) return <Cloud className="w-5 h-5" />;
                                            return <LinkIcon className="w-5 h-5" />;
                                        })()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 leading-none mb-1">Enllaç detectat</p>
                                        <div className="text-sm font-bold text-primary truncate">
                                            {modalUrlMatch[0]}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 italic">Clica per obrir el recurs</p>
                                    </div>
                                    <a
                                        href={modalUrlMatch[0].startsWith('http') ? modalUrlMatch[0] : 'https://' + modalUrlMatch[0]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all border border-primary/10 shadow-sm active:scale-90"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground italic pl-2">
                                <Icon name="info" className="text-sm opacity-50" />
                                Els canvis es guarden automàticament a la Llibreta.
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsNoteModalOpen(false)}
                                    className="px-8 py-3.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all uppercase tracking-widest text-xs"
                                >
                                    TANCAR
                                </button>
                                <button
                                    onClick={handleSaveNote}
                                    disabled={isSavingNote}
                                    className="px-10 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black shadow-xl shadow-primary/20 transition-all flex items-center gap-2 uppercase tracking-widest text-xs active:scale-[0.98]"
                                >
                                    {isSavingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    GUARDAR ARA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Calendari;
