export enum Screen {
  Dashboard = 'Tauler',
  Alumnes = 'Alumnes',
  Avaluacio = 'Avaluació',
  Calendari = 'Calendari',
  Assistencia = 'Assistència',
  Reunions = 'Reunions',
  Missatgeria = 'Missatgeria',
  StudentProfile = 'StudentProfile',
  ClassProfile = 'ClassProfile',
  PrivacyPolicy = 'PrivacyPolicy',
  Llibreta = 'Llibreta'
}

export interface Objective {
  id: string;
  text: string;
  completed: boolean;
}

export interface ClassGroup {
  id: string;
  name: string;
  description?: string;
  room?: string;
  quarterlyObjectives?: Objective[];
  annualObjectives?: Objective[];
  subjects?: string[];
}

export interface Tutor {
  name: string;
  relation: string;
  phone: string;
  email: string;
  initials: string;
}

export interface Alert {
  type: 'medical' | 'academic' | 'other';
  icon: string;
  text: string;
  color: 'red' | 'blue' | 'amber';
}

export interface LogEntry {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  icon: string;
  color: 'red' | 'green' | 'blue';
  title: string;
  date: string;
  description: string;
  tags?: string[];
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  avatar: string;
  gender: 'nen' | 'nena' | 'altre';
  personalData: {
    birthDate: string;
    age: number;
    address: string;
    socialSecurity: string;
    email?: string;
  };
  tutors: Tutor[];
  alerts: Alert[];
  privateNotes: string;
  behaviorLog: LogEntry[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type?: 'general' | 'festiu' | 'vacances';
  time: string;
  color: string;
  description: string;
  subject?: string;
  subtype?: string;
  recurring?: {
    type?: 'weekly' | 'range';
    dayOfWeek?: number;
    endDate?: string;
  };
  linkedNoteIds?: string[]; // Multi-link support
}

export interface TaskTag {
  text: string;
  color: string;
}

export interface Task {
  id: string;
  text: string;
  description?: string;
  completed: boolean;
  tags: TaskTag[];
}

export interface UserProfile {
  name: string;
  role: string;
  avatar: string;
  subjects: string[];
  gender?: 'male' | 'female' | 'other';
  schoolStart?: string; // Format YYYY-MM-DD
  schoolEnd?: string;   // Format YYYY-MM-DD
  smtpSettings?: {
    enabled: boolean;
    host: string;
    port: number;
    user: string;
    password?: string;
    fromName: string;
    fromEmail: string;
  };
}

export type AttendanceStatus = 'Present' | 'Falta' | 'Retard' | 'Justificat';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  morningStatus: AttendanceStatus;
  afternoonStatus: AttendanceStatus;
}

export interface Activity {
  id: string;
  name: string;
  weight: number;
  date: string;
  classId: string;
  subject: string;
  term: string;
}

export interface EvaluationGrade {
  id: string;
  activityId: string;
  studentId: string;
  grade: number | null;
}

export type MeetingType = 'Tutoria Família' | 'Claustre' | 'Nivell' | 'Coordinació' | 'Altres';

export interface Meeting {
  id: string;
  title: string;
  studentId?: string;
  date: string;
  time: string;
  location: string;
  type: MeetingType;
  discussion: string;
  agreements: string;
  completed: boolean;
  recurring?: {
    dayOfWeek: number;
  };
}

// Schedule types
export interface ScheduleTimeSlot {
  start: string;
  end: string;
}

export interface ScheduleClass {
  subject: string;
  room: string;
  color: string;
}

export interface WeeklySchedule {
  times: ScheduleTimeSlot[];
  days: {
    [key: string]: ScheduleClass[];
  };
}

export interface Comunicat {
  id: string;
  title: string;
  content: string;
  classId: string;
  studentIds?: string[];
  recipients: string[];
  createdAt: string;
  senderId: string;
}

export interface Note {
  id: string;
  userId: string;
  titol: string;
  contingut: string;
  categoria?: string;
  linkedEventIds?: string[]; // Multi-link support
  createdAt: string;
  updatedAt: string;
}
