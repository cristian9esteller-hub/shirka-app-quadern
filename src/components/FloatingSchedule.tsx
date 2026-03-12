import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import Icon from './Icon';
import ScheduleGrid from './ScheduleGrid';
import { useData } from '@/contexts/DataContext';

const FloatingSchedule: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { schedule, profile } = useData();

    // Storage Keys
    const SIZE_KEY = 'shirka-schedule-size-v9';
    const POS_KEY = 'shirka-schedule-pos-v9';

    // Initial State from LocalStorage
    const [size, setSize] = useState(() => {
        const saved = localStorage.getItem(SIZE_KEY);
        return saved ? JSON.parse(saved) : { width: 620, height: 440 };
    });

    const [position, setPosition] = useState(() => {
        const saved = localStorage.getItem(POS_KEY);
        return saved ? JSON.parse(saved) : { x: window.innerWidth - 640, y: 80 };
    });

    // Save state on change
    const saveState = (newPos?: { x: number, y: number }, newSize?: { width: number, height: number }) => {
        if (newPos) localStorage.setItem(POS_KEY, JSON.stringify(newPos));
        if (newSize) localStorage.setItem(SIZE_KEY, JSON.stringify(newSize));
    };

    // Layout constants
    const headerH = 48; // Slightly taller, more professional header

    return (
        <Draggable
            handle=".drag-handle"
            position={position}
            onStop={(_, data) => {
                const newPos = { x: data.x, y: data.y };
                setPosition(newPos);
                saveState(newPos);
            }}
            bounds="body"
        >
            <div
                className="fixed z-[999999] flex flex-col pointer-events-auto select-none overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5),0_30px_60px_-30px_rgba(0,0,0,0.6)] border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl"
                style={{ position: 'fixed', top: 0, left: 0 }}
            >
                {/* PREMIUM MINIMALIST HEADER */}
                <div className="drag-handle h-[48px] bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-center cursor-move border-b border-slate-100 dark:border-slate-800 relative shrink-0">
                    <div className="flex flex-col items-center gap-0.5">
                        <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mb-1" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400/80 dark:text-slate-500/80">Monitorització Horari</span>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-all cursor-pointer group"
                    >
                        <Icon name="close" className="text-lg opacity-40 group-hover:opacity-100" />
                    </button>
                </div>

                {/* RESPONSIVE CONTENT AREA */}
                <Resizable
                    size={{ width: size.width, height: size.height - headerH }}
                    onResizeStop={(_, __, ref, d) => {
                        const newSize = {
                            width: size.width + d.width,
                            height: size.height + d.height
                        };
                        setSize(newSize);
                        saveState(undefined, newSize);
                    }}
                    minWidth={320}
                    minHeight={280}
                    enable={{
                        bottom: true, right: true, bottomRight: true,
                        top: false, left: false, topLeft: false, topRight: false, bottomLeft: false
                    }}
                    handleStyles={{
                        bottomRight: { width: '32px', height: '32px', right: '0px', bottom: '0px', cursor: 'nwse-resize' }
                    }}
                    handleComponent={{
                        bottomRight: (
                            <div className="w-full h-full flex items-end justify-end p-2 text-slate-300 dark:text-slate-600 hover:text-primary transition-colors">
                                <Icon name="south_east" className="text-xl opacity-20 hover:opacity-100" />
                            </div>
                        )
                    }}
                    className="flex-1 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white dark:bg-slate-900">
                        {schedule ? (
                            <ScheduleGrid schedule={schedule} isCompact={true} subjects={profile?.subjects || []} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-200 dark:text-slate-800 gap-3">
                                <Icon name="event_busy" className="text-5xl opacity-10" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-20">No hi ha dades</span>
                            </div>
                        )}
                    </div>
                </Resizable>
            </div>
        </Draggable>
    );
};

export default FloatingSchedule;
