import React from 'react';
import Icon from './Icon';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { renderTextWithLinks } from '@/lib/string-utils';

export const EVENT_COLORS: Record<string, { bg: string, light: string, border: string, text: string }> = {
    red: { bg: 'bg-red-500', light: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-500', text: 'text-red-700 dark:text-red-300' },
    blue: { bg: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300' },
    green: { bg: 'bg-green-500', light: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-500', text: 'text-green-700 dark:text-green-300' },
    amber: { bg: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-500', text: 'text-amber-700 dark:text-amber-300' },
    purple: { bg: 'bg-purple-500', light: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300' },
    pink: { bg: 'bg-pink-500', light: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-500', text: 'text-pink-700 dark:text-pink-300' },
};

interface EventCardProps {
    title: string;
    time: string;
    date?: string;
    color?: string;
    icon?: string;
    description?: string;
    isRecurring?: boolean;
    subject?: string;
    className?: string;
    onClick?: () => void;
    variant?: 'compact' | 'full';
    showDateBadge?: boolean;
    priority?: 'high' | 'normal';
}

const getContextualIcon = (title: string, defaultIcon?: string) => {
    const t = title.toLowerCase();
    if (t.includes('examen') || t.includes('prova') || t.includes('control')) return 'edit_note';
    if (t.includes('reunió') || t.includes('tutor') || t.includes('trobada')) return 'groups';
    if (t.includes('sortida') || t.includes('excursió') || t.includes('viatge')) return 'directions_bus';
    return defaultIcon || 'event';
};

const getRelativeDateLabel = (dateStr?: string) => {
    if (!dateStr) return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const target = new Date(dateStr + 'T00:00:00');
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Avui';
    if (diffDays === 1) return 'Demà';
    if (diffDays > 1) return `Falten ${diffDays} dies`;
    return null;
};

const EventCard: React.FC<EventCardProps> = ({
    title,
    time,
    date,
    color = 'blue',
    icon,
    description,
    isRecurring,
    subject,
    className = '',
    onClick,
    variant = 'full',
    showDateBadge = false,
    priority = 'normal',
}) => {
    const colorStyle = EVENT_COLORS[color] || EVENT_COLORS.blue;
    const contextualIcon = getContextualIcon(title, icon);

    const eventDate = date ? new Date(date + 'T00:00:00') : new Date();
    const weekday = eventDate.toLocaleDateString('ca-ES', { weekday: 'short' });
    const dayNum = eventDate.getDate();
    const monthName = eventDate.toLocaleDateString('ca-ES', { month: 'short' });

    const cardContent = (
        <div
            onClick={onClick}
            className={`
        ${colorStyle.light} 
        border-l-4 ${colorStyle.border} 
        p-3.5 rounded-r-[1.5rem] rounded-l-md 
        flex items-center gap-3 
        transition-all hover:scale-[1.02] shadow-sm 
        ${onClick ? 'cursor-pointer' : 'cursor-default'} 
        group/card ${className}
      `}
        >
            {showDateBadge && (
                <div className="shrink-0 w-10 h-10 bg-white/60 dark:bg-slate-900/60 rounded-[1rem] flex flex-col items-center justify-center border border-white/20 dark:border-slate-800 transition-colors group-hover/card:bg-white dark:group-hover/card:bg-slate-900">
                    <span className="text-[8px] font-black uppercase text-slate-400 leading-none">{weekday}</span>
                    <span className={`text-sm font-black ${colorStyle.text}`}>{dayNum}</span>
                </div>
            )}

            {!showDateBadge && (
                <div className="shrink-0 w-9 h-9 bg-white dark:bg-slate-900 rounded-[1rem] flex items-center justify-center shadow-sm">
                    <Icon name={contextualIcon} className={`text-lg ${colorStyle.text}`} />
                </div>
            )}

            <div className="min-w-0 flex-1">
                <h4 className={`font-black truncate leading-tight uppercase tracking-tight ${colorStyle.text} ${priority === 'high' ? 'text-[12px] md:text-[13px]' : 'text-[11px] md:text-[12px]'}`}>
                    {isRecurring && <Icon name="sync" className="text-[10px] mr-1 inline-block align-middle opacity-60" />}
                    {subject ? `[${subject.substring(0, 3).toUpperCase()}] ` : ''}{title}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-black opacity-60 uppercase tracking-widest">{time}</span>
                    {variant === 'full' && date && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-current opacity-20" />
                            <span className="text-[9px] font-black opacity-60 uppercase tracking-widest">{monthName}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {cardContent}
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className={`p-0 overflow-hidden border-t-4 ${colorStyle.border} rounded-xl shadow-2xl max-w-xs animate-in zoom-in-95 duration-200`}
            >
                <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${colorStyle.bg}`} />
                        <h5 className="font-bold text-xs uppercase tracking-tight">{title}</h5>
                    </div>
                    {description && (
                        <p className="text-[10px] text-muted-foreground leading-relaxed italic border-l-2 border-slate-100 dark:border-slate-800 pl-2">
                            {renderTextWithLinks(description)}
                        </p>
                    )}
                    <div className="flex items-center gap-3 pt-1 opacity-60 text-[9px] font-bold uppercase">
                        <div className="flex items-center gap-1">
                            <Icon name="calendar_today" className="text-xs" />
                            {weekday} {dayNum} {monthName}
                        </div>
                        <div className="flex items-center gap-1">
                            <Icon name="schedule" className="text-xs" />
                            {time}
                        </div>
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    );
};

export default EventCard;
