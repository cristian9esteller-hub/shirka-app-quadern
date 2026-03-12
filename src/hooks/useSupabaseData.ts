import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import alumno1 from '@/assets/alumno1.png';
import alumno2 from '@/assets/alumno2.png';
import alumna1 from '@/assets/alumna1.png';
import alumna2 from '@/assets/alumna2.png';
import { useAuth } from './useAuth';
import type { ClassGroup, Student, CalendarEvent, Task, Meeting, Activity, EvaluationGrade, AttendanceRecord, UserProfile, WeeklySchedule, Comunicat, Note } from '@/types';
import { toast } from 'sonner';

export function useSupabaseData() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    role: 'Mestre/a',
    avatar: '',
    subjects: [],
    schoolStart: '2025-09-08',
    schoolEnd: '2026-06-22',
    smtpSettings: {
      enabled: false,
      host: '',
      port: 587,
      user: '',
      password: '',
      fromName: '',
      fromEmail: ''
    }
  });
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [grades, setGrades] = useState<EvaluationGrade[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [comunicats, setComunicats] = useState<Comunicat[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [linksLoaded, setLinksLoaded] = useState(false);

  const loadFromStorage = useCallback(() => {
    const collections = ['classes', 'students', 'events', 'tasks', 'meetings', 'activities', 'grades', 'attendance', 'comunicats', 'notes'];
    let loadedCount = 0;
    collections.forEach(key => {
      const saved = localStorage.getItem(`shirka-${key}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          loadedCount++;
          switch (key) {
            case 'classes': setClasses(parsed); break;
            case 'students': setStudents(parsed); break;
            case 'events': setEvents(parsed); break;
            case 'tasks': setTasks(parsed); break;
            case 'meetings': setMeetings(parsed); break;
            case 'activities': setActivities(parsed); break;
            case 'grades': setGrades(parsed); break;
            case 'attendance': setAttendance(parsed); break;
            case 'comunicats': setComunicats(parsed); break;
            case 'notes': setNotes(parsed); break;
          }
        } catch (e) { /* silent */ }
      }
    });
    if (loadedCount > 0) {
      setLoading(false);
    }
  }, []);

  const saveToStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(`shirka-${key}`, JSON.stringify(data));
    } catch (e) { /* silent */ }
  };

  const fetchLinks = useCallback(async (force = false) => {
    if (!user || (linksLoaded && !force)) return;
    try {
      const { data } = await supabase.from('notes_events_links' as any).select('*').eq('user_id', user.id);
      const links = data || [];

      if (links.length > 0) {
        // Update events with links
        setEvents(prev => prev.map(e => ({
          ...e,
          linkedNoteIds: links.filter((l: any) => l.event_id === e.id).map((l: any) => l.note_id),
        })));

        // Update notes with links
        setNotes(prev => prev.map(n => ({
          ...n,
          linkedEventIds: links.filter((l: any) => l.note_id === n.id).map((l: any) => l.event_id),
        })));

        setLinksLoaded(true);
      }
    } catch (error) {
      // silent
    }
  }, [user, linksLoaded]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    // Only set loading true if we don't have cached data to show
    if (classes.length === 0 && students.length === 0) {
      setLoading(true);
    }

    try {
      const fetchAllRes = await Promise.all([
        supabase.from('profiles' as any).select('*').eq('user_id', user.id).single(),
        supabase.from('classes' as any).select('*').eq('user_id', user.id).order('name'),
        supabase.from('students' as any).select('*').eq('user_id', user.id).order('name'),
        supabase.from('calendar_events' as any).select('*').eq('user_id', user.id),
        supabase.from('tasks' as any).select('*').eq('user_id', user.id),
        supabase.from('meetings' as any).select('*').eq('user_id', user.id),
        supabase.from('evaluation_activities' as any).select('*').eq('user_id', user.id),
        supabase.from('evaluation_grades' as any).select('*').eq('user_id', user.id),
        supabase.from('attendance' as any).select('*').eq('user_id', user.id),
        (supabase.from('horaris' as any) as any).select('*').eq('user_id', user.id).maybeSingle(),
        (supabase.from('comunicats' as any) as any).select('*').eq('sender_id', user.id).order('created_at', { ascending: false }),
        supabase.from('notes_lliures' as any).select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      const [profileRes, classesRes, studentsRes, eventsRes, tasksRes, meetingsRes, activitiesRes, gradesRes, attendanceRes, horarisRes, comunicatsRes, notesRes] = fetchAllRes;

      // Load profile from local storage first
      const publicProfile = localStorage.getItem('shirka-profile');
      if (publicProfile) {
        setProfile(JSON.parse(publicProfile));
      } else if (profileRes.data) {
        const d = profileRes.data as any;
        setProfile({
          name: d.name || '',
          role: d.role || 'Mestre/a',
          avatar: d.avatar_url || '',
          subjects: d.subjects || [],
          gender: (d.gender as UserProfile['gender']) || 'other',
          schoolStart: d.school_start || '2025-09-08',
          schoolEnd: d.school_end || '2026-06-22',
          smtpSettings: d.smtp_settings || {
            enabled: false,
            host: '',
            port: 587,
            user: '',
            password: '',
            fromName: '',
            fromEmail: ''
          },
        });
      }

      if (classesRes.data) {
        const mapped = classesRes.data.map((c: any) => ({
          id: c.id, name: c.name, description: c.description || '', room: c.room || '',
          quarterlyObjectives: c.quarterly_objectives || [], annualObjectives: c.annual_objectives || [],
          subjects: c.subjects || [],
        }));
        setClasses(mapped);
        saveToStorage('classes', mapped);
      }

      if (studentsRes.data) {
        const mapped = studentsRes.data.map((s: any) => ({
          id: s.id, name: s.name, classId: s.class_id, avatar: s.avatar_url || '',
          gender: (s.gender as Student['gender']) || 'altre',
          personalData: s.personal_data || { birthDate: '', age: 0, address: '', socialSecurity: '' },
          tutors: s.tutors || [], alerts: s.alerts || [],
          privateNotes: s.private_notes || '', behaviorLog: s.behavior_log || [],
        }));
        setStudents(mapped);
        saveToStorage('students', mapped);
      }

      if (eventsRes.data) {
        const mapped = eventsRes.data.map((e: any) => ({
          id: e.id,
          title: e.title,
          date: e.data_inici || e.date,
          time: e.time || '',
          color: e.color || '#19e65e',
          description: e.description || '',
          subject: e.subject || '',
          recurring: e.recurring,
          endDate: e.data_fi || (e.recurring as any)?.endDate || e.date,
          type: e.tipus || (e.title?.toUpperCase().includes('FESTIU') ? 'festiu' : 'general'),
          subtype: e.subtipus || '',
          linkedNoteIds: [], // Will be loaded by fetchLinks if needed
        }));
        setEvents(mapped);
        saveToStorage('events', mapped);
      }

      if (tasksRes.data) {
        const mapped = tasksRes.data.map((t: any) => ({
          id: t.id, text: t.text, description: t.description || '', completed: t.completed, tags: t.tags || [],
        }));
        setTasks(mapped);
        saveToStorage('tasks', mapped);
      }

      if (meetingsRes.data) {
        setMeetings(meetingsRes.data.map((m: any) => ({
          id: m.id, title: m.title, studentId: m.student_id || undefined, date: m.date,
          time: m.time || '', location: m.location || '', type: m.type as any,
          discussion: m.discussion || '', agreements: m.agreements || '',
          completed: m.completed, recurring: m.recurring,
        })));
      }

      if (activitiesRes.data) {
        setActivities(activitiesRes.data.map((a: any) => ({
          id: a.id, name: a.name, weight: a.weight, date: a.date,
          classId: a.class_id, subject: a.subject, term: a.term,
        })));
      }

      if (gradesRes.data) {
        setGrades(gradesRes.data.map((g: any) => ({
          id: g.id, activityId: g.activity_id, studentId: g.student_id, grade: g.grade,
        })));
      }

      if (attendanceRes.data) {
        setAttendance(attendanceRes.data.map((a: any) => ({
          id: a.id, studentId: a.student_id, classId: a.class_id, date: a.date,
          morningStatus: a.morning_status, afternoonStatus: a.afternoon_status,
        })));
      }

      if (comunicatsRes.data) {
        setComunicats(comunicatsRes.data.map((c: any) => ({
          id: c.id, title: c.title, content: c.content, classId: c.class_id,
          studentIds: c.student_ids,
          recipients: c.recipients as any, createdAt: c.created_at, senderId: c.sender_id,
        })));
      }

      if (notesRes && (notesRes as any).data) {
        const mapped = ((notesRes as any).data as any[]).map((n: any) => ({
          id: n.id,
          userId: n.user_id,
          titol: n.titol || '',
          contingut: n.contingut || '',
          categoria: n.categoria || 'General',
          linkedEventIds: [], // Will be loaded by fetchLinks if needed
          createdAt: n.created_at,
          updatedAt: n.updated_at,
        }));
        setNotes(mapped);
        saveToStorage('notes', mapped);
      }

      // Load schedule
      const localSchedule = localStorage.getItem('teacher_schedule');
      if (localSchedule) {
        try {
          setSchedule(JSON.parse(localSchedule));
        } catch (e) {
          // silent
        }
      }
      if (horarisRes && horarisRes.data) {
        const dbScheduleData = (horarisRes.data as any)?.schedule as WeeklySchedule;
        if (dbScheduleData && dbScheduleData.days && dbScheduleData.times) {
          setSchedule(dbScheduleData);
          localStorage.setItem('teacher_schedule', JSON.stringify(dbScheduleData));
        }
      }

      // Always fetch links after other data
      await fetchLinks(true);
    } catch (error) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user, fetchLinks]);

  useEffect(() => {
    if (user) {
      loadFromStorage();
      fetchAll();
    }
  }, [user, loadFromStorage, fetchAll]);

  // CRUD helpers
  const addClass = async (name: string) => {
    if (!user) return;
    const { data, error } = await supabase.from('classes' as any).insert({ user_id: user.id, name }).select().single();
    if (!error && data) {
      setClasses(prev => [...prev, { id: (data as any).id, name: (data as any).name, description: '', room: '', quarterlyObjectives: [], annualObjectives: [] }].sort((a, b) => a.name.localeCompare(b.name)));
    }
    return { data, error };
  };

  const updateClass = async (id: string, updates: Partial<ClassGroup>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.room !== undefined) dbUpdates.room = updates.room;
    if (updates.quarterlyObjectives !== undefined) dbUpdates.quarterly_objectives = updates.quarterlyObjectives;
    if (updates.annualObjectives !== undefined) dbUpdates.annual_objectives = updates.annualObjectives;
    if (updates.subjects !== undefined) dbUpdates.subjects = updates.subjects;

    if (!user) return;
    await supabase.from('classes' as any).update(dbUpdates).eq('id', id).eq('user_id', user.id);
    setClasses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteClass = async (id: string) => {
    if (!user) return;
    await supabase.from('classes' as any).delete().eq('id', id).eq('user_id', user.id);
    setClasses(prev => prev.filter(c => c.id !== id));
  };

  const getStudentDefaultAvatar = (name: string, gender?: Student['gender']) => {
    const isFemale = gender === 'nena' || (gender === 'altre' && name.toLowerCase().endsWith('a'));
    const random = Math.random() > 0.5;
    if (isFemale) return random ? alumna1 : alumna2;
    return random ? alumno1 : alumno2;
  };

  const addStudent = async (
    name: string,
    classId: string,
    gender: Student['gender'] = 'altre',
    personalData?: Partial<Student['personalData']>,
    tutors?: Student['tutors']
  ) => {
    if (!user) return { data: null, error: { message: 'No user' } };
    const avatar = getStudentDefaultAvatar(name, gender);

    const defaultPersonalData = { birthDate: '', age: 0, address: '', socialSecurity: '', email: '' };
    const mergedPersonalData = { ...defaultPersonalData, ...personalData };

    const { data, error } = await supabase.from('students' as any).insert({
      user_id: user.id,
      name,
      class_id: classId,
      avatar_url: avatar,
      gender,
      personal_data: mergedPersonalData as any,
      tutors: (tutors || []) as any,
    }).select().single();

    if (data && !error) {
      setStudents(prev => [...prev, {
        id: (data as any).id,
        name: (data as any).name,
        classId: (data as any).class_id,
        avatar,
        gender: (data as any).gender,
        personalData: (data as any).personal_data || mergedPersonalData,
        tutors: (data as any).tutors || [],
        alerts: [],
        privateNotes: '',
        behaviorLog: [],
      }].sort((a, b) => a.name.localeCompare(b.name)));
    }
    return { data, error };
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.classId !== undefined) dbUpdates.class_id = updates.classId;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
    if (updates.personalData !== undefined) dbUpdates.personal_data = updates.personalData;
    if (updates.tutors !== undefined) dbUpdates.tutors = updates.tutors;
    if (updates.alerts !== undefined) dbUpdates.alerts = updates.alerts;
    if (updates.privateNotes !== undefined) dbUpdates.private_notes = updates.privateNotes;
    if (updates.behaviorLog !== undefined) dbUpdates.behavior_log = updates.behaviorLog;

    if (!user) return;
    await supabase.from('students' as any).update(dbUpdates).eq('id', id).eq('user_id', user.id);
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStudent = async (id: string) => {
    if (!user) return;
    await supabase.from('students' as any).delete().eq('id', id).eq('user_id', user.id);
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const addEvent = async (event: Omit<CalendarEvent, 'id'>): Promise<any> => {
    if (!user) return { error: new Error('No user authenticated') };

    try {
      const { data, error } = await (supabase.from('calendar_events' as any).insert({
        user_id: user.id,
        title: event.title,
        time: event.time,
        color: event.color,
        description: event.description,
        subject: event.subject,
        recurring: event.recurring,
        data_inici: event.date,
        data_fi: event.endDate || (event.recurring as any)?.endDate,
        tipus: event.type,
        subtipus: (event as any).subtype
      } as any) as any).select().single();

      if (error) {
        return { data: null, error };
      }

      if (data) {
        setEvents(prev => [...prev, {
          id: data.id,
          title: data.title,
          date: data.date || data.data_inici,
          time: data.time || '',
          color: data.color || '#19e65e',
          description: data.description || '',
          subject: data.subject || '',
          recurring: data.recurring,
          endDate: data.data_fi,
          type: data.tipus,
        } as any]);
        return { data, error: null };
      }

      return { data: null, error: new Error("No data returned from Supabase") };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.date !== undefined) {
      dbUpdates.data_inici = updates.date;
    }
    if (updates.time !== undefined) dbUpdates.time = updates.time;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
    if (updates.recurring !== undefined) {
      dbUpdates.recurring = updates.recurring;
      dbUpdates.data_fi = (updates.recurring as any)?.endDate;
    }
    if (updates.endDate !== undefined) dbUpdates.data_fi = updates.endDate;
    if (updates.type !== undefined) dbUpdates.tipus = updates.type;
    if ((updates as any).subtype !== undefined) dbUpdates.subtipus = (updates as any).subtype;

    if (!user) return;
    await supabase.from('calendar_events' as any).update(dbUpdates).eq('id', id).eq('user_id', user.id);
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEvent = async (id: string) => {
    if (!user) return;
    await supabase.from('calendar_events' as any).delete().eq('id', id).eq('user_id', user.id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const addTask = async (text: string, description: string = '', tags: any[] = []) => {
    if (!user) return;
    const { data, error } = await supabase.from('tasks' as any).insert({ user_id: user.id, text, description, tags }).select().single();
    if (error) {
      toast.error('Error al guardar la tasca a la base de dades');
      return;
    }
    if (data) setTasks(prev => [...prev, { id: (data as any).id, text, description, completed: false, tags }]);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const dbUpdates: any = {};
    if (updates.text !== undefined) dbUpdates.text = updates.text;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

    if (!user) return;
    const { error } = await supabase.from('tasks' as any).update(dbUpdates).eq('id', id).eq('user_id', user.id);
    if (error) {
      toast.error('Error al actualitzar la tasca');
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    await supabase.from('tasks' as any).delete().eq('id', id).eq('user_id', user.id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addMeeting = async (meeting: Omit<Meeting, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('meetings' as any).insert({
      user_id: user.id, title: meeting.title, student_id: meeting.studentId || null,
      date: meeting.date, time: meeting.time, location: meeting.location,
      type: meeting.type, discussion: meeting.discussion, agreements: meeting.agreements,
      completed: meeting.completed, recurring: meeting.recurring,
    }).select().single();
    if (data && !error) setMeetings(prev => [...prev, { ...meeting, id: (data as any).id }]);
  };

  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.time !== undefined) dbUpdates.time = updates.time;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.discussion !== undefined) dbUpdates.discussion = updates.discussion;
    if (updates.agreements !== undefined) dbUpdates.agreements = updates.agreements;
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;

    if (!user) return;
    await supabase.from('meetings' as any).update(dbUpdates).eq('id', id).eq('user_id', user.id);
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMeeting = async (id: string) => {
    if (!user) return;
    await supabase.from('meetings' as any).delete().eq('id', id).eq('user_id', user.id);
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  const addActivity = async (act: Omit<Activity, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('evaluation_activities' as any).insert({
      user_id: user.id, class_id: act.classId, subject: act.subject, term: act.term,
      name: act.name, weight: act.weight, date: act.date,
    }).select().single();
    if (data && !error) setActivities(prev => [...prev, { ...act, id: (data as any).id }]);
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
    if (updates.date !== undefined) dbUpdates.date = updates.date;

    if (!user) return;
    await supabase.from('evaluation_activities' as any).update(dbUpdates).eq('id', id).eq('user_id', user.id);
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteActivity = async (id: string) => {
    if (!user) return;
    await supabase.from('evaluation_activities' as any).delete().eq('id', id).eq('user_id', user.id);
    setActivities(prev => prev.filter(a => a.id !== id));
    setGrades(prev => prev.filter(g => g.activityId !== id));
  };

  const upsertGrade = async (activityId: string, studentId: string, grade: number | null) => {
    if (!user) return;
    const existing = grades.find(g => g.activityId === activityId && g.studentId === studentId);
    if (existing) {
      await supabase.from('evaluation_grades' as any).update({ grade }).eq('id', existing.id).eq('user_id', user.id);
      setGrades(prev => prev.map(g => g.id === existing.id ? { ...g, grade } : g));
    } else {
      const { data, error } = await supabase.from('evaluation_grades' as any).insert({
        user_id: user.id, activity_id: activityId, student_id: studentId, grade,
      }).select().single();
      if (data && !error) setGrades(prev => [...prev, { id: (data as any).id, activityId, studentId, grade }]);
    }
  };

  const upsertAttendance = async (studentId: string, classId: string, date: string, morningStatus: string, afternoonStatus: string) => {
    if (!user) return;
    const existing = attendance.find(a => a.studentId === studentId && a.date === date);
    if (existing) {
      await supabase.from('attendance' as any).update({ morning_status: morningStatus, afternoon_status: afternoonStatus }).eq('id', existing.id).eq('user_id', user.id);
      setAttendance(prev => prev.map(a => a.id === existing.id ? { ...a, morningStatus: morningStatus as any, afternoonStatus: afternoonStatus as any } : a));
    } else {
      const { data, error } = await supabase.from('attendance' as any).insert({
        user_id: user.id, student_id: studentId, class_id: classId, date,
        morning_status: morningStatus, afternoon_status: afternoonStatus,
      }).select().single();
      if (data && !error) setAttendance(prev => [...prev, { id: (data as any).id, studentId, classId, date, morningStatus: morningStatus as any, afternoonStatus: afternoonStatus as any }]);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
    if (updates.subjects !== undefined) dbUpdates.subjects = updates.subjects;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.schoolStart !== undefined) dbUpdates.school_start = updates.schoolStart;
    if (updates.schoolEnd !== undefined) dbUpdates.school_end = updates.schoolEnd;
    if (updates.smtpSettings !== undefined) dbUpdates.smtp_settings = updates.smtpSettings;

    // Update local state immediately
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    localStorage.setItem('shirka-profile', JSON.stringify(newProfile));

    // Persist to Supabase if possible
    if (user) {
      await supabase.from('profiles' as any).update(dbUpdates).eq('user_id', user.id);
    }
  };

  const updateSchedule = async (newSchedule: WeeklySchedule) => {
    setSchedule(newSchedule);
    localStorage.setItem('teacher_schedule', JSON.stringify(newSchedule));

    if (user) {
      // Try to upsert to 'horaris' table. We assume it has 'user_id' and 'schedule' (JSONB)
      const { error } = await (supabase.from('horaris' as any) as any).upsert({
        user_id: user.id,
        schedule: newSchedule,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (error) {
        // silent
      }
    }
  };

  const sendComunicat = async (title: string, content: string, classId: string, recipients: string[], studentIds?: string[]) => {
    if (!user) return { error: "No user" };
    const { data, error } = await (supabase.from('comunicats' as any) as any).insert({
      title,
      content,
      class_id: classId,
      student_ids: studentIds && studentIds.length > 0 ? studentIds : null,
      recipients,
      sender_id: user.id,
    }).select().single();

    if (!error && data) {
      // Si el SMTP està activat, enviem els emails via Edge Function
      if (profile.smtpSettings?.enabled) {
        try {
          // Busquem els emails dels destinataris
          // Aquesta és una simplificació: en un cas real hauríem de mapejar studentIds a correus dels pares/alumnes
          // Per ara farem la crida a la funció per a la prova conceptual
          const { data: sessionData } = await supabase.auth.getSession();

          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionData.session?.access_token}`,
            },
            body: JSON.stringify({
              smtpSettings: profile.smtpSettings,
              to: profile.smtpSettings.fromEmail, // Per ara enviem al propi mestre com a prova
              subject: title,
              text: content,
              html: `<p>${content.replace(/\n/g, '<br>')}</p>`
            })
          });
        } catch (smtpError) {
          // silent
        }
      }

      const newComunicat: Comunicat = {
        id: data.id,
        title: data.title,
        content: data.content,
        classId: data.class_id,
        studentIds: data.student_ids,
        recipients: data.recipients as any,
        createdAt: data.created_at,
        senderId: data.sender_id,
      };
      setComunicats(prev => [newComunicat, ...prev]);
    }
    return { data, error };
  };

  const mapNote = (n: any, links: any[] = []): Note => ({
    id: n.id,
    userId: n.user_id,
    titol: n.titol,
    contingut: n.contingut,
    categoria: n.categoria,
    linkedEventIds: links.filter((l: any) => l.note_id === n.id).map((l: any) => l.event_id),
    createdAt: n.created_at,
    updatedAt: n.updated_at,
  });

  const addNote = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('notes_lliures' as any).insert({
      user_id: user.id,
      titol: '',
      contingut: '',
      categoria: 'General'
    }).select().single();

    if (error) {
      toast.error('Error al crear la nota');
      return { error };
    }

    await fetchAll();
    return { data: mapNote(data) };
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (!user) return;

    const { error } = await supabase.from('notes_lliures' as any).update({
      titol: updates.titol,
      contingut: updates.contingut,
      categoria: updates.categoria,
      updated_at: new Date().toISOString()
    }).eq('id', id).eq('user_id', user.id);

    if (!error) {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));
    }
  };

  const linkNoteToEvent = async (noteId: string, eventId: string) => {
    if (!user) return;
    const { data, error } = await (supabase.from('notes_events_links' as any) as any).insert({
      user_id: user.id,
      note_id: noteId,
      event_id: eventId,
    }).select();

    if (!error) {
      setNotes(prev => prev.map(n => n.id === noteId
        ? { ...n, linkedEventIds: [...(n.linkedEventIds || []), eventId] } as Note
        : n));
      setEvents(prev => prev.map(e => e.id === eventId
        ? { ...e, linkedNoteIds: [...(e.linkedNoteIds || []), noteId] } as CalendarEvent
        : e));
      toast.success('Nota vinculada correctament');
    } else {
      toast.error('Error al vincular la nota');
    }
    return { data: data ? data[0] : null, error };
  };

  const unlinkNoteFromEvent = async (noteId: string, eventId: string) => {
    if (!user) return;
    const { error } = await (supabase.from('notes_events_links' as any) as any)
      .delete()
      .eq('note_id', noteId)
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (!error) {
      setNotes(prev => prev.map(n => n.id === noteId
        ? { ...n, linkedEventIds: (n.linkedEventIds || []).filter(id => id !== eventId) } as Note
        : n));
      setEvents(prev => prev.map(e => e.id === eventId
        ? { ...e, linkedNoteIds: (e.linkedNoteIds || []).filter(id => id !== noteId) } as CalendarEvent
        : e));
      toast.success('Vinculació eliminada');
    } else {
      toast.error('Error al desvincular');
    }
    return { error };
  };

  const deleteNote = async (id: string) => {
    if (!user) return;
    await supabase.from('notes_lliures' as any).delete().eq('id', id).eq('user_id', user.id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const resetAllData = async () => {
    if (!user) return;
    const tables = [
      'notes_events_links',
      'notes_lliures',
      'comunicats',
      'horaris',
      'attendance',
      'evaluation_grades',
      'evaluation_activities',
      'meetings',
      'tasks',
      'calendar_events',
      'students',
      'classes'
    ];

    try {
      for (const table of tables) {
        // Use sender_id for comunicats, user_id for others
        const idField = table === 'comunicats' ? 'sender_id' : 'user_id';
        await supabase.from(table as any).delete().eq(idField, user.id);
      }
      toast.success('Totes les dades han estat esborrades correctament.');
      await fetchAll();
    } catch (error) {
      toast.error('Error en reiniciar les dades.');
    }
  };

  const exportAllData = async () => {
    if (!user) return null;
    const data: any = {
      profile,
      classes,
      students,
      events,
      tasks,
      meetings,
      activities,
      grades,
      attendance,
      comunicats,
      notes,
      schedule
    };
    return data;
  };

  const importAllData = async (payload: any) => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Reset current data
      const tables = [
        'notes_events_links',
        'notes_lliures',
        'comunicats',
        'horaris',
        'attendance',
        'evaluation_grades',
        'evaluation_activities',
        'meetings',
        'tasks',
        'calendar_events',
        'students',
        'classes'
      ];
      for (const table of tables) {
        const idField = table === 'comunicats' ? 'sender_id' : 'user_id';
        await supabase.from(table as any).delete().eq(idField, user.id);
      }

      // 2. Import new data in order
      if (payload.classes?.length) {
        const mapped = payload.classes.map((c: any) => ({
          id: c.id,
          user_id: user.id,
          name: c.name,
          description: c.description,
          room: c.room,
          quarterly_objectives: c.quarterlyObjectives,
          annual_objectives: c.annualObjectives,
          subjects: c.subjects
        }));
        await supabase.from('classes' as any).insert(mapped);
      }

      if (payload.students?.length) {
        const mapped = payload.students.map((s: any) => ({
          id: s.id,
          user_id: user.id,
          name: s.name,
          class_id: s.classId,
          avatar_url: s.avatar,
          gender: s.gender,
          personal_data: s.personalData,
          tutors: s.tutors,
          alerts: s.alerts,
          private_notes: s.privateNotes,
          behavior_log: s.behaviorLog
        }));
        await supabase.from('students' as any).insert(mapped);
      }

      if (payload.events?.length) {
        const mapped = payload.events.map((e: any) => ({
          id: e.id,
          user_id: user.id,
          title: e.title,
          data_inici: e.date,
          time: e.time,
          color: e.color,
          description: e.description,
          subject: e.subject,
          recurring: e.recurring,
          data_fi: e.endDate,
          tipus: e.type,
          subtipus: e.subtype
        }));
        await supabase.from('calendar_events' as any).insert(mapped);
      }

      if (payload.tasks?.length) {
        const mapped = payload.tasks.map((t: any) => ({
          id: t.id,
          user_id: user.id,
          text: t.text,
          description: t.description,
          completed: t.completed,
          tags: t.tags
        }));
        await supabase.from('tasks' as any).insert(mapped);
      }

      if (payload.meetings?.length) {
        const mapped = payload.meetings.map((m: any) => ({
          id: m.id,
          user_id: user.id,
          title: m.title,
          student_id: m.studentId,
          date: m.date,
          time: m.time,
          location: m.location,
          type: m.type,
          discussion: m.discussion,
          agreements: m.agreements,
          completed: m.completed,
          recurring: m.recurring
        }));
        await supabase.from('meetings' as any).insert(mapped);
      }

      if (payload.activities?.length) {
        const mapped = payload.activities.map((a: any) => ({
          id: a.id,
          user_id: user.id,
          class_id: a.classId,
          subject: a.subject,
          term: a.term,
          name: a.name,
          weight: a.weight,
          date: a.date
        }));
        await supabase.from('evaluation_activities' as any).insert(mapped);
      }

      if (payload.grades?.length) {
        const mapped = payload.grades.map((g: any) => ({
          id: g.id,
          user_id: user.id,
          activity_id: g.activityId,
          student_id: g.studentId,
          grade: g.grade
        }));
        await supabase.from('evaluation_grades' as any).insert(mapped);
      }

      if (payload.attendance?.length) {
        const mapped = payload.attendance.map((a: any) => ({
          id: a.id,
          user_id: user.id,
          student_id: a.studentId,
          class_id: a.classId,
          date: a.date,
          morning_status: a.morningStatus,
          afternoon_status: a.afternoonStatus
        }));
        await supabase.from('attendance' as any).insert(mapped);
      }

      if (payload.notes?.length) {
        const mapped = payload.notes.map((n: any) => ({
          id: n.id,
          user_id: user.id,
          titol: n.titol,
          contingut: n.contingut,
          categoria: n.categoria,
          created_at: n.createdAt,
          updated_at: n.updatedAt
        }));
        await supabase.from('notes_lliures' as any).insert(mapped);
      }

      if (payload.schedule) {
        await supabase.from('horaris' as any).upsert({
          user_id: user.id,
          schedule: payload.schedule,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }

      if (payload.profile) {
        const { smtpSettings, ...otherProfile } = payload.profile;
        const dbProfile: any = {
          name: otherProfile.name,
          role: otherProfile.role,
          avatar_url: otherProfile.avatar,
          subjects: otherProfile.subjects,
          gender: otherProfile.gender,
          school_start: otherProfile.schoolStart,
          school_end: otherProfile.schoolEnd,
          smtp_settings: smtpSettings
        };
        await supabase.from('profiles' as any).update(dbProfile).eq('user_id', user.id);
      }

      toast.success('Dades importades amb èxit!');
      await fetchAll();
    } catch (error) {
      toast.error('Error en importar les dades.');
    } finally {
      setLoading(false);
    }
  };

  return {
    profile, classes, students, events, tasks, meetings, activities, grades, attendance, comunicats, notes, loading,
    addClass, updateClass, deleteClass,
    addStudent, updateStudent, deleteStudent,
    addEvent, updateEvent, deleteEvent,
    addTask, updateTask, deleteTask,
    addMeeting, updateMeeting, deleteMeeting,
    addActivity, updateActivity, deleteActivity,
    upsertGrade, upsertAttendance, updateProfile,
    schedule, updateSchedule,
    sendComunicat,
    addNote, updateNote, deleteNote,
    linkNoteToEvent, unlinkNoteFromEvent,
    fetchLinks,
    refetch: fetchAll,
    resetAllData,
    exportAllData,
    importAllData,
  };
}
