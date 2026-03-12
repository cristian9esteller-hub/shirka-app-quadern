import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import type { ClassGroup, Student, CalendarEvent, Task, Meeting, Activity, EvaluationGrade, AttendanceRecord, UserProfile, WeeklySchedule, Comunicat, Note } from '@/types';

interface DataContextType {
    profile: UserProfile;
    classes: ClassGroup[];
    students: Student[];
    events: CalendarEvent[];
    tasks: Task[];
    meetings: Meeting[];
    activities: Activity[];
    grades: EvaluationGrade[];
    attendance: AttendanceRecord[];
    comunicats: Comunicat[];
    notes: Note[];
    loading: boolean;
    addClass: (name: string) => Promise<any>;
    updateClass: (id: string, updates: Partial<ClassGroup>) => Promise<void>;
    deleteClass: (id: string) => Promise<void>;
    addStudent: (name: string, classId: string, gender?: Student['gender'], personalData?: Partial<Student['personalData']>, tutors?: Student['tutors']) => Promise<any>;
    updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
    deleteStudent: (id: string) => Promise<void>;
    addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<any>;
    updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;
    addTask: (text: string, description?: string, tags?: any[]) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    addMeeting: (meeting: Omit<Meeting, 'id'>) => Promise<void>;
    updateMeeting: (id: string, updates: Partial<Meeting>) => Promise<void>;
    deleteMeeting: (id: string) => Promise<void>;
    addActivity: (act: Omit<Activity, 'id'>) => Promise<void>;
    updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
    deleteActivity: (id: string) => Promise<void>;
    upsertGrade: (activityId: string, studentId: string, grade: number | null) => Promise<void>;
    upsertAttendance: (studentId: string, classId: string, date: string, morning: string, afternoon: string) => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    sendComunicat: (title: string, content: string, classId: string, recipients: string[], studentIds?: string[]) => Promise<any>;
    addNote: () => Promise<any>;
    updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    linkNoteToEvent: (noteId: string, eventId: string) => Promise<any>;
    unlinkNoteFromEvent: (noteId: string, eventId: string) => Promise<any>;
    schedule: WeeklySchedule | null;
    updateSchedule: (newSchedule: WeeklySchedule) => Promise<void>;
    fetchLinks: () => Promise<void>;
    refetch: () => Promise<void>;
    resetAllData: () => Promise<void>;
    exportAllData: () => Promise<any>;
    importAllData: (payload: any) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const data = useSupabaseData();

    return (
        <DataContext.Provider value={data}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
