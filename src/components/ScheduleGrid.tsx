import React from 'react';
import Icon from './Icon';
import { getSubjectColor, getShortName } from '@/lib/subject-utils';
import { type WeeklySchedule } from '@/types';

interface ScheduleGridProps {
    schedule: WeeklySchedule;
    isCompact: boolean;
    subjects: string[];
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ schedule, isCompact, subjects }) => {
    // Dynamic styles based on container width/height will be handled by CSS
    // We remove the rigid grid-rows calculations that interfere with flex-1

    return (
        <div className={`
            grid grid-cols-[3.5rem_repeat(5,1fr)] w-full h-full 
            bg-slate-50/20 dark:bg-slate-900/10 
            border border-slate-100 dark:border-slate-800 
            gap-1.5 p-1.5
            ${isCompact ? 'overflow-hidden' : ''}
        `}>
            {/* Header Days */}
            <div className="contents">
                <div className="flex items-center justify-center text-[10px] font-black uppercase text-slate-300 tracking-wider">Hora</div>
                {Object.keys(schedule.days).map((day) => (
                    <div key={day} className="flex items-center justify-center py-1 text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                        <span className="md:hidden">{day.substring(0, 3)}</span>
                        <span className="hidden md:inline">{day}</span>
                    </div>
                ))}
            </div>

            {/* Rows */}
            {schedule.times.map((time, timeIndex) => (
                <div key={timeIndex} className="contents">
                    {/* Time cell */}
                    <div className="flex items-center justify-center text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg">
                        {time.start}
                    </div>

                    {/* Day cells */}
                    {Object.keys(schedule.days).map((dayKey, dayIndex) => {
                        const event = schedule.days[dayKey][timeIndex];
                        const subOriginal = event?.subject || '';
                        const subShort = getShortName(subOriginal, isCompact);
                        const subIndex = subjects.indexOf(subOriginal);
                        const subColor = getSubjectColor(subOriginal, subIndex >= 0 ? subIndex : undefined);
                        const isItemBreak = subOriginal.includes('Esbarjo') || subOriginal.includes('Menjador');

                        return (
                            <div
                                key={dayIndex}
                                className={`
                                    rounded-xl border p-2 flex flex-col justify-center transition-all shadow-sm group overflow-hidden h-full min-h-0
                                    ${subColor.bg} ${subColor.text} ${subColor.border}
                                    ${isItemBreak ? 'opacity-60 bg-white dark:bg-slate-800' : ''}
                                `}
                            >
                                {isItemBreak ? (
                                    <Icon
                                        name={subOriginal.includes('Esbarjo') ? 'coffee' : 'restaurant'}
                                        className="text-lg text-slate-400 dark:text-slate-500 mx-auto"
                                    />
                                ) : (
                                    <>
                                        <span className="block font-black leading-tight text-center uppercase text-[clamp(9px,2cqi,14px)] truncate">
                                            {subShort || 'Lliure'}
                                        </span>
                                        {!isCompact && event?.room && (
                                            <span className="text-[10px] text-center font-bold opacity-70 mt-0.5 truncate uppercase tracking-tighter">
                                                {event.room}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default ScheduleGrid;
