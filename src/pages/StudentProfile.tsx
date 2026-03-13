import React, { useState, useEffect, useRef, useMemo } from 'react';
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils';
import { StudentAvatar } from '@/components/StudentAvatar';
import { getAvatarSrc, PREDEFINED_AVATARS } from '@/lib/avatar-utils';
import type { Student, Alert, ClassGroup, Tutor, LogEntry, Activity, EvaluationGrade, Meeting, AttendanceRecord } from '@/types';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, Header } from 'docx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

interface StudentProfileProps {
  student: Student;
  students: Student[];
  classes: ClassGroup[];
  className: string;
  onBack: () => void;
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  activities: Activity[];
  grades: EvaluationGrade[];
  meetings: Meeting[];
  subjects: string[];
  attendance: AttendanceRecord[];
}

const TRIMESTRES = ['1r Trim', '2n Trim', '3r Trim'];

const ALERT_PRESETS: { type: Alert['type']; icon: string; title: string }[] = [
  { type: 'medical', icon: 'medical_services', title: 'Alerta Mèdica' },
  { type: 'other', icon: 'restaurant', title: 'Menjador' },
  { type: 'academic', icon: 'psychology', title: 'Reforç Acadèmic' },
];

const getAlertColors = (color: Alert['color']) => {
  const colorMap = {
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  };
  return colorMap[color];
};

const getTutorInitialColors = (initials: string) => {
  const colors = [
    'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    'bg-muted text-muted-foreground',
  ];
  const charCodeSum = initials.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[charCodeSum % colors.length];
};

const getLogIconBgColor = (type: 'positive' | 'negative' | 'neutral') => {
  const colorMap = {
    negative: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
    positive: 'bg-primary/20 text-green-600 dark:text-green-400',
    neutral: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  };
  return colorMap[type];
};

const getAvgColor = (avg: number | null) => {
  if (avg === null) return 'bg-muted text-muted-foreground';
  if (avg < 5) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (avg >= 9) return 'bg-primary/20 text-green-700 dark:text-green-400';
  if (avg >= 7) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
};

const StudentProfile: React.FC<StudentProfileProps> = ({
  student, students, classes, className: classNameProp, onBack, onUpdateStudent, onDeleteStudent,
  activities, grades, meetings, subjects, attendance,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({ personal: true, academic: true, behavior: true, meetings: true });

  const [editForm, setEditForm] = useState<Student | null>(null);
  const [privateNotes, setPrivateNotes] = useState(student.privateNotes || '');
  const [isNotesSaved, setIsNotesSaved] = useState(true);
  const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null);
  const [selectedChartSubject, setSelectedChartSubject] = useState(subjects[0] || '');
  const [selectedChart, setSelectedChart] = useState<'evolution' | 'position'>('evolution');

  // Behavior log state
  const [showLogForm, setShowLogForm] = useState(false);
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogType, setNewLogType] = useState<'positive' | 'negative' | 'neutral'>('neutral');
  const [newLogDate, setNewLogDate] = useState(new Date().toISOString().slice(0, 16));
  const [newLogDescription, setNewLogDescription] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPrivateNotes(student.privateNotes || '');
    setIsNotesSaved(true);
    if (!isEditing) {
      setEditForm(JSON.parse(JSON.stringify(student)));
    }
  }, [student, isEditing]);

  // Academic performance
  const academicPerformance = useMemo(() => {
    const studentActivities = activities.filter(a => a.classId === student.classId);
    return subjects.map(subject => {
      let totalWeightedGrade = 0;
      let termsWithGrades = 0;

      TRIMESTRES.forEach(term => {
        const termActs = studentActivities.filter(a => a.subject === subject && a.term === term);
        if (termActs.length > 0) {
          let termWeightedSum = 0;
          let termTotalWeight = 0;
          termActs.forEach(act => {
            const g = grades.find(g => g.activityId === act.id && g.studentId === student.id);
            if (g && g.grade !== null) {
              termWeightedSum += g.grade * act.weight;
              termTotalWeight += act.weight;
            }
          });
          if (termTotalWeight > 0) {
            totalWeightedGrade += termWeightedSum / termTotalWeight;
            termsWithGrades++;
          }
        }
      });

      const overallAverage = termsWithGrades > 0 ? totalWeightedGrade / termsWithGrades : null;
      return { subject, average: overallAverage };
    }).filter(s => s.average !== null);
  }, [student, activities, grades, subjects]);

  const studentMeetings = useMemo(() => {
    return meetings
      .filter(m => m.studentId === student.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [meetings, student]);

  const attendanceStats = useMemo(() => {
    const studentAttendance = attendance.filter(a => a.studentId === student.id);
    if (studentAttendance.length === 0) return { percentage: 100, label: '100%', faltas: 0, justificadas: 0, retards: 0, colorClass: 'text-green-600 dark:text-green-400 border-green-200 bg-green-50 dark:bg-green-900/20' };

    let totalSessions = 0;
    let attendedSessions = 0;
    let faltas = 0;
    let justificadas = 0;
    let retards = 0;

    studentAttendance.forEach(record => {
      // Morning
      const m = record.morningStatus;
      totalSessions++;
      if (m === 'Falta') faltas++;
      else if (m === 'Justificat') justificadas++;
      else if (m === 'Retard') retards++;

      if (m !== 'Falta') attendedSessions++;

      // Afternoon
      const a = record.afternoonStatus;
      totalSessions++;
      if (a === 'Falta') faltas++;
      else if (a === 'Justificat') justificadas++;
      else if (a === 'Retard') retards++;

      if (a !== 'Falta') attendedSessions++;
    });

    const percentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 100;
    return {
      percentage,
      label: `${Math.round(percentage)}%`,
      faltas,
      justificadas,
      retards,
      colorClass: percentage >= 90 ? 'text-green-600 dark:text-green-400 border-green-200 bg-green-50 dark:bg-green-900/20' :
        percentage >= 80 ? 'text-amber-600 dark:text-amber-400 border-amber-200 bg-amber-50 dark:bg-amber-900/20' :
          'text-red-600 dark:text-red-400 border-red-200 bg-red-50 dark:bg-red-900/20'
    };
  }, [student, attendance]);


  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrivateNotes(e.target.value);
    setIsNotesSaved(false);
  };

  const handleSaveNotes = () => {
    if (!isNotesSaved) {
      onUpdateStudent(student.id, { privateNotes });
      setIsNotesSaved(true);
    }
  };


  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editForm) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditForm({ ...editForm, avatar: event.target.result as string });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleStartEdit = () => {
    setEditForm(JSON.parse(JSON.stringify(student)));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(JSON.parse(JSON.stringify(student)));
  };

  const handleSaveEdit = () => {
    if (editForm) {
      onUpdateStudent(student.id, {
        name: editForm.name,
        avatar: editForm.avatar,
        gender: editForm.gender,
        personalData: editForm.personalData,
        tutors: editForm.tutors,
        alerts: editForm.alerts,
      });
      setIsEditing(false);
    }
  };

  const updateEditField = (path: string, value: any) => {
    if (!editForm) return;
    const newForm = JSON.parse(JSON.stringify(editForm));
    const keys = path.split('.');
    let current: any = newForm;
    for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
    current[keys[keys.length - 1]] = value;
    setEditForm(newForm);
  };

  const addTutor = () => {
    if (!editForm) return;
    const newTutor: Tutor = { name: '', relation: '', phone: '', email: '', initials: '??' };
    setEditForm({ ...editForm, tutors: [...editForm.tutors, newTutor] });
  };

  const removeTutor = (index: number) => {
    if (!editForm) return;
    const newTutors = [...editForm.tutors];
    newTutors.splice(index, 1);
    setEditForm({ ...editForm, tutors: newTutors });
  };

  const addAlert = () => {
    if (!editForm) return;
    const newAlert: Alert = { type: 'medical', icon: 'medical_services', text: 'Nova Alerta', color: 'blue' };
    setEditForm({ ...editForm, alerts: [...editForm.alerts, newAlert] });
  };

  const removeAlert = (index: number) => {
    if (!editForm) return;
    const newAlerts = [...editForm.alerts];
    newAlerts.splice(index, 1);
    setEditForm({ ...editForm, alerts: newAlerts });
  };

  const updateAlertColor = (index: number, color: Alert['color']) => {
    if (!editForm) return;
    const newAlerts = [...editForm.alerts];
    newAlerts[index].color = color;
    setEditForm({ ...editForm, alerts: newAlerts });
  };

  const updateAlertIconAndType = (index: number, icon: string, type: Alert['type']) => {
    if (!editForm) return;
    const newAlerts = [...editForm.alerts];
    newAlerts[index].icon = icon;
    newAlerts[index].type = type;
    setEditForm({ ...editForm, alerts: newAlerts });
  };

  const handleSaveLog = () => {
    if (!newLogTitle || !newLogDescription) return;
    const iconMap = { positive: 'star', negative: 'warning', neutral: 'chat' };
    const colorMap = { positive: 'green' as const, negative: 'red' as const, neutral: 'blue' as const };

    const newEntry: LogEntry = {
      id: Date.now().toString(),
      type: newLogType,
      title: newLogTitle,
      description: newLogDescription,
      date: new Date(newLogDate).toLocaleString('ca-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      icon: iconMap[newLogType],
      color: colorMap[newLogType],
    };

    onUpdateStudent(student.id, { behaviorLog: [newEntry, ...student.behaviorLog] });
    setNewLogTitle('');
    setNewLogDescription('');
    setShowLogForm(false);
  };

  const handleExportData = async () => {
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              width: "210mm",
              height: "297mm",
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "INFORME DE L'ALUMNE",
                    bold: true,
                    size: 28,
                    color: "3b82f6",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${student.name} - ${classNameProp}`,
                    size: 20,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Dades Personals Section
          ...(exportOptions.personal ? [
            new Paragraph({
              text: "DADES PERSONALS",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nom Complet:", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(student.name)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Classe:", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(classNameProp)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Data Naixement:", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(student.personalData.birthDate || "-")] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Adreça:", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(student.personalData.address || "-")] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Seguretat Social:", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(student.personalData.socialSecurity || "-")] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Email Alumne:", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(student.personalData.email || "-")] }),
                  ],
                }),
              ],
            }),
            new Paragraph({
              text: "TUTORS",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            ...student.tutors.flatMap(t => [
              new Paragraph({
                children: [
                  new TextRun({ text: `${t.name} (${t.relation})`, bold: true }),
                ],
                spacing: { before: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Telèfon: ${t.phone || "-"}` }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Email: ${t.email || "-"}` }),
                ],
              }),
            ]),
          ] : []),

          // Academic Performance Section
          ...(exportOptions.academic ? [
            new Paragraph({
              text: "RENDIMENT ACADÈMIC",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Assignatura", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Mitjana", bold: true })] })] }),
                  ],
                }),
                ...academicPerformance.map(p => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(p.subject)] }),
                    new TableCell({ children: [new Paragraph(p.average?.toFixed(2) || "-")] }),
                  ],
                })),
              ],
            }),
          ] : []),

          // Behavior Section
          ...(exportOptions.behavior ? [
            new Paragraph({
              text: "COMPORTAMENT",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            ...student.behaviorLog.map(l => new Paragraph({
              children: [
                new TextRun({ text: `${l.date} - ${l.title}`, bold: true }),
                new TextRun({ text: `\n${l.description}`, break: 1 }),
              ],
              bullet: { level: 0 },
              spacing: { after: 150 },
            })),
            ...(student.behaviorLog.length === 0 ? [new Paragraph("No hi ha observacions registrades.")] : []),
          ] : []),

          // Meetings Section
          ...(exportOptions.meetings ? [
            new Paragraph({
              text: "REUNIONS",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            ...studentMeetings.map(m => new Paragraph({
              children: [
                new TextRun({ text: `${m.date} (${m.type}) - ${m.title}`, bold: true }),
                new TextRun({ text: `\nLloc: ${m.location || "-"}`, break: 1 }),
                new TextRun({ text: `\nTemes: ${m.discussion || "-"}`, break: 1 }),
                new TextRun({ text: `\nAcords: ${m.agreements || "-"}`, break: 1 }),
              ],
              bullet: { level: 0 },
              spacing: { after: 150 },
            })),
            ...(studentMeetings.length === 0 ? [new Paragraph("No hi ha reunions registrades.")] : []),
          ] : []),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `Informe_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExportModalOpen(false);
  };

  return (
    <main className="p-4 md:p-8 lg:p-10 w-full overflow-y-auto">
      {/* Breadcrumb + Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={onBack} className="hover:text-primary transition-colors">Alumnes</button>
          <Icon name="chevron_right" className="text-xs" />
          <span className="text-foreground font-semibold">{student.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsExportModalOpen(true)} className="p-2 text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium" title="Generar Informe (.doc)">
            <Icon name="description" className="text-lg" /> <span className="hidden md:inline">Generar Informe (.doc)</span>
          </button>
          <button onClick={() => { if (confirm("Eliminar l'alumne?")) { onDeleteStudent(student.id); onBack(); } }} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Eliminar">
            <Icon name="delete" className="text-lg" />
          </button>
          {!isEditing ? (
            <button onClick={handleStartEdit} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1">
              <Icon name="edit" className="text-sm" /> Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancelEdit} className="border border-border text-muted-foreground px-4 py-2 rounded-xl text-sm font-semibold">Cancel·lar</button>
              <button onClick={handleSaveEdit} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold">Guardar</button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Header Card */}
        <section className="bg-card rounded-xl shadow-sm border border-border p-5">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex flex-col items-center gap-3">
              <div className="relative group shrink-0 w-24 h-24 md:w-28 md:h-28">
                <StudentAvatar
                  student={isEditing ? { ...student, avatar: editForm?.avatar || student.avatar, gender: editForm?.gender || student.gender } : student}
                  size="lg"
                />
                {isEditing && (
                  <>
                    <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/40 text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                      <Icon name="photo_camera" className="text-2xl" />
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </>
                )}
              </div>
              {isEditing && (
                <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-secondary rounded-xl border border-border">
                  {PREDEFINED_AVATARS.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => updateEditField('avatar', src)}
                      className={cn(
                        "w-10 h-10 aspect-square rounded-full border-2 transition-all p-0.5",
                        editForm?.avatar === src ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-border opacity-60 hover:opacity-100'
                      )}
                    >
                      <img src={src} className="w-full h-full rounded-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-3 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex-1">
                  {isEditing ? (
                    <input type="text" value={editForm?.name || ''} onChange={e => updateEditField('name', e.target.value)}
                      className="text-2xl md:text-3xl font-bold bg-secondary border border-border rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary w-full max-w-md text-foreground" />
                  ) : (
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">{student.name}</h1>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <p className="text-muted-foreground text-sm">{classNameProp}</p>
                    <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold border flex flex-wrap items-center gap-x-3 gap-y-1", attendanceStats.colorClass)}>
                      <div className="flex items-center gap-1">
                        <Icon name="event_available" className="text-[12px]" />
                        Assistència: {attendanceStats.label}
                      </div>
                      <div className="w-px h-3 bg-current opacity-20 hidden sm:block" />
                      <div className="flex gap-3">
                        <span className="opacity-80">Faltes: <span className="text-foreground">{attendanceStats.faltas}</span></span>
                        <span className="opacity-80">Justif: <span className="text-foreground">{attendanceStats.justificadas}</span></span>
                        <span className="opacity-80">Retards: <span className="text-foreground">{attendanceStats.retards}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
                {isEditing && (
                  <div className="flex flex-col gap-1 w-full md:w-auto">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Gènere</label>
                    <select value={editForm?.gender || 'altre'} onChange={e => updateEditField('gender', e.target.value)}
                      className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground">
                      <option value="nen">Nen</option>
                      <option value="nena">Nena</option>
                      <option value="altre">Altre</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Alerts */}
              <div className="flex flex-wrap gap-2">
                {(isEditing ? editForm?.alerts : student.alerts)?.map((alert, idx) => (
                  <div key={idx} className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${getAlertColors(alert.color)}`}>
                    <div className="flex items-center gap-1.5">
                      <Icon name={alert.icon} className="text-sm" />
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <input type="text" value={alert.text} onChange={e => {
                            const newAlerts = [...(editForm?.alerts || [])];
                            newAlerts[idx].text = e.target.value;
                            updateEditField('alerts', newAlerts);
                          }} className="bg-transparent border-none outline-none focus:ring-0 p-0 text-xs font-bold w-full placeholder:text-muted-foreground" placeholder="Text d'alerta" />
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {ALERT_PRESETS.map(preset => (
                                <button key={preset.icon} type="button" onClick={() => updateAlertIconAndType(idx, preset.icon, preset.type)}
                                  className={`p-1 rounded-md transition-colors ${alert.icon === preset.icon ? 'bg-primary/20' : 'bg-secondary hover:bg-muted'}`} title={preset.title}>
                                  <Icon name={preset.icon} className="text-xs" />
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-1">
                              {(['red', 'blue', 'amber'] as const).map(c => (
                                <button key={c} type="button" onClick={() => updateAlertColor(idx, c)}
                                  className={`w-3 h-3 rounded-full border border-black/10 transition-transform ${alert.color === c ? 'scale-125 ring-1 ring-offset-1 ring-muted-foreground' : 'hover:scale-110'}`}
                                  style={{ backgroundColor: c === 'amber' ? '#fbbf24' : c === 'blue' ? '#3b82f6' : '#ef4444' }} />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : <span>{alert.text}</span>}
                    </div>
                    {isEditing && (
                      <button type="button" onClick={() => removeAlert(idx)} className="bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-sm hover:opacity-80 transition-colors">
                        <Icon name="close" className="text-[10px]" />
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button type="button" onClick={addAlert} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Icon name="add" className="text-sm" /> Afegir Alerta
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dades Personals */}
          <section className="bg-card rounded-xl shadow-sm border border-border p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icon name="person" className="text-primary" /> Dades Personals</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Data Naixement</p>
                  {isEditing ? (
                    <input type="text" value={editForm?.personalData.birthDate || ''} onChange={e => updateEditField('personalData.birthDate', e.target.value)}
                      className="font-medium mt-0.5 w-full bg-secondary border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary text-foreground text-sm" />
                  ) : (
                    <p className="font-medium text-foreground text-sm mt-0.5">{student.personalData.birthDate || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Edat</p>
                  {isEditing ? (
                    <input type="number" value={editForm?.personalData.age || 0} onChange={e => updateEditField('personalData.age', parseInt(e.target.value) || 0)}
                      className="font-medium mt-0.5 w-full bg-secondary border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary text-foreground text-sm" />
                  ) : (
                    <p className="font-medium text-foreground text-sm mt-0.5">{student.personalData.age ? `${student.personalData.age} anys` : '-'}</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Adreça</p>
                {isEditing ? (
                  <input type="text" value={editForm?.personalData.address || ''} onChange={e => updateEditField('personalData.address', e.target.value)}
                    className="font-medium mt-0.5 w-full bg-secondary border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary text-foreground text-sm" />
                ) : (
                  <p className="font-medium text-foreground text-sm mt-0.5">{student.personalData.address || '-'}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Núm. Seguretat Social</p>
                {isEditing ? (
                  <input type="text" value={editForm?.personalData.socialSecurity || ''} onChange={e => updateEditField('personalData.socialSecurity', e.target.value)}
                    className="font-medium mt-0.5 w-full bg-secondary border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary text-foreground font-mono text-sm" />
                ) : (
                  <p className="font-medium text-muted-foreground font-mono text-sm mt-0.5">{student.personalData.socialSecurity || '-'}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Email Alumne</p>
                {isEditing ? (
                  <input type="email" value={editForm?.personalData.email || ''} onChange={e => updateEditField('personalData.email', e.target.value)}
                    className="font-medium mt-0.5 w-full bg-secondary border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary text-foreground text-sm" />
                ) : (
                  <p className="font-medium text-foreground text-sm mt-0.5">{student.personalData.email || '-'}</p>
                )}
              </div>
            </div>
          </section>

          {/* Contacte Tutors */}
          <section className="bg-card rounded-xl shadow-sm border border-border p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Icon name="family_restroom" className="text-primary" /> Contacte Tutors</h3>
              {isEditing && (
                <button type="button" onClick={addTutor} className="text-xs bg-secondary hover:bg-muted px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 text-foreground transition-colors">
                  <Icon name="add" className="text-sm" /> AFEGIR
                </button>
              )}
            </div>
            <div className="space-y-3">
              {(isEditing ? editForm?.tutors : student.tutors)?.map((tutor, index) => (
                <div key={index} className="relative group flex items-start gap-3 p-3 bg-secondary rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getTutorInitialColors(tutor.initials || '??')}`}>
                    {tutor.initials || '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-1">
                        <input type="text" value={tutor.name} onChange={e => {
                          const newTutors = [...(editForm?.tutors || [])];
                          newTutors[index].name = e.target.value;
                          newTutors[index].initials = e.target.value.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                          updateEditField('tutors', newTutors);
                        }} placeholder="Nom del tutor" className="text-sm font-bold w-full bg-card border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary text-foreground" />
                        <input type="text" value={tutor.relation} onChange={e => {
                          const newTutors = [...(editForm?.tutors || [])];
                          newTutors[index].relation = e.target.value;
                          updateEditField('tutors', newTutors);
                        }} placeholder="Relació" className="text-xs w-full bg-card border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary text-muted-foreground" />
                        <input type="text" value={tutor.phone} onChange={e => {
                          const newTutors = [...(editForm?.tutors || [])];
                          newTutors[index].phone = e.target.value;
                          updateEditField('tutors', newTutors);
                        }} placeholder="Telèfon" className="text-sm w-full bg-card border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary text-foreground" />
                        <input type="text" value={tutor.email} onChange={e => {
                          const newTutors = [...(editForm?.tutors || [])];
                          newTutors[index].email = e.target.value;
                          updateEditField('tutors', newTutors);
                        }} placeholder="Email" className="text-sm w-full bg-card border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary text-foreground" />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-foreground">{tutor.name}</p>
                        <p className="text-xs text-muted-foreground">{tutor.relation}</p>
                        {tutor.phone && <a href={`tel:${tutor.phone}`} className="text-sm text-muted-foreground hover:text-primary block">{tutor.phone}</a>}
                        {tutor.email && <a href={`mailto:${tutor.email}`} className="text-sm text-muted-foreground hover:text-primary block">{tutor.email}</a>}
                      </>
                    )}
                  </div>
                  {isEditing && (
                    <button type="button" onClick={() => removeTutor(index)} className="absolute top-1 right-1 text-destructive p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icon name="delete" className="text-sm" />
                    </button>
                  )}
                </div>
              ))}
              {(!isEditing && student.tutors.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No hi ha tutors registrats.</p>}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notes Privades */}
          <section className="bg-card rounded-xl shadow-sm border border-border p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Icon name="lock" className="text-primary" /> Notes Privades</h3>
              <span className={`text-xs flex items-center gap-1 ${isNotesSaved ? 'text-primary' : 'text-amber-500'}`}>
                <Icon name={isNotesSaved ? 'check_circle' : 'pending'} className="text-sm" />
                {isNotesSaved ? 'Canvis desats' : 'Canvis pendents...'}
              </span>
            </div>
            <textarea
              value={privateNotes}
              onChange={handleNotesChange}
              onBlur={handleSaveNotes}
              rows={6}
              className="w-full bg-secondary border border-border rounded-xl py-3 px-4 outline-none resize-none text-foreground text-sm focus:ring-2 focus:ring-primary"
              placeholder="Escriu les teves notes privades sobre aquest alumne..."
            />
          </section>

          {/* Registre de Comportament */}
          <section className="bg-card rounded-xl shadow-sm border border-border p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Icon name="history_edu" className="text-primary" /> Registre de Comportament</h3>
              <button onClick={() => setShowLogForm(!showLogForm)}
                className={`text-sm ${showLogForm ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-foreground'} hover:opacity-80 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors`}>
                <Icon name={showLogForm ? 'close' : 'add'} className="text-sm" />
                {showLogForm ? 'Cancel·lar' : 'Nova Observació'}
              </button>
            </div>

            {showLogForm && (
              <div className="mb-6 bg-secondary border border-border rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Títol de l'observació</label>
                    <input type="text" value={newLogTitle} onChange={e => setNewLogTitle(e.target.value)} placeholder="Ex: Millora en lectura"
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Valoració</label>
                    <div className="flex gap-2">
                      {(['positive', 'neutral', 'negative'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setNewLogType(t)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${newLogType === t
                            ? t === 'positive' ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : t === 'neutral' ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-card border-border text-muted-foreground'
                            }`}>
                          {t === 'positive' ? 'Positiva' : t === 'neutral' ? 'Neutra' : 'Negativa'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Data i Hora</label>
                  <input type="datetime-local" value={newLogDate} onChange={e => setNewLogDate(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Descripció detallada</label>
                  <textarea value={newLogDescription} onChange={e => setNewLogDescription(e.target.value)} placeholder="Explica què ha passat..."
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary min-h-[80px] text-foreground" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowLogForm(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">Cancel·lar</button>
                  <button type="button" onClick={handleSaveLog} disabled={!newLogTitle || !newLogDescription}
                    className="bg-primary hover:opacity-90 text-primary-foreground px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-all disabled:opacity-50">Guardar Observació</button>
                </div>
              </div>
            )}

            {student.behaviorLog.length > 0 ? (
              <div className="relative pl-4 border-l-2 border-border space-y-6 max-h-[400px] overflow-y-auto">
                {student.behaviorLog.map(log => (
                  <div key={log.id} className="relative">
                    <div className={`absolute -left-[21px] top-1 border-2 border-card p-1 rounded-full ${getLogIconBgColor(log.type)}`}>
                      <Icon name={log.icon} className="text-xs block" />
                    </div>
                    <div className="ml-4">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-foreground">{log.title}</h4>
                        <span className="text-xs text-muted-foreground">{log.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{log.description}</p>
                      {log.tags && log.tags.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {log.tags.map(tag => <span key={tag} className="px-2 py-0.5 bg-secondary text-xs text-muted-foreground rounded">{tag}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No hi ha observacions registrades.</p>}
          </section>
        </div>

        {/* Rendiment Acadèmic */}
        <section className="bg-card rounded-xl shadow-sm border border-border p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Icon name="leaderboard" className="text-primary" /> Rendiment Acadèmic</h3>
          </div>
          {academicPerformance.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {academicPerformance.map(({ subject, average }) => (
                  <div key={subject} className={`p-3 rounded-lg text-center ${getAvgColor(average)}`}>
                    <p className="text-[11px] font-bold uppercase truncate">{subject}</p>
                    <p className="text-2xl font-bold">{average?.toFixed(1) ?? '-'}</p>
                  </div>
                ))}
              </div>

              {/* Chart controls */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <select
                  value={selectedChartSubject}
                  onChange={e => setSelectedChartSubject(e.target.value)}
                  className="appearance-none bg-secondary border border-border text-foreground py-2 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="flex bg-secondary p-1 rounded-lg border border-border">
                  <button
                    onClick={() => setSelectedChart('evolution')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${selectedChart === 'evolution' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Icon name="bar_chart" className="text-sm" /> Evolució
                  </button>
                  <button
                    onClick={() => setSelectedChart('position')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${selectedChart === 'position' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Icon name="groups" className="text-sm" /> vs Classe
                  </button>
                </div>
              </div>

              {/* Selected chart */}
              <div className="bg-secondary rounded-xl p-4">
                {selectedChart === 'evolution' ? (
                  <>
                    <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <Icon name="bar_chart" className="text-primary text-base" /> Evolució — {selectedChartSubject}
                    </h4>
                    {(() => {
                      const chartData: { name: string; nota: number }[] = [];
                      const studentActs = activities.filter(a => a.classId === student.classId && a.subject === selectedChartSubject);
                      TRIMESTRES.forEach(term => {
                        const termActs = studentActs.filter(a => a.term === term);
                        let ws = 0, tw = 0;
                        termActs.forEach(act => {
                          const g = grades.find(g => g.activityId === act.id && g.studentId === student.id);
                          if (g && g.grade !== null) { ws += g.grade * act.weight; tw += act.weight; }
                        });
                        if (tw > 0) chartData.push({ name: term, nota: parseFloat((ws / tw).toFixed(1)) });
                      });
                      if (chartData.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">Sense dades per aquesta matèria</p>;
                      return (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                            <Bar dataKey="nota" name="Nota" radius={[4, 4, 0, 0]} maxBarSize={48}>
                              {chartData.map((entry, index) => (
                                <Cell key={index} fill={entry.nota >= 5 ? 'hsl(142, 71%, 45%)' : 'hsl(var(--destructive))'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <Icon name="groups" className="text-primary text-base" /> Alumne vs Classe — {selectedChartSubject}
                    </h4>
                    {(() => {
                      const compData: { name: string; alumne: number; classe: number }[] = [];
                      const classStudentsList = students.filter(s => s.classId === student.classId);
                      TRIMESTRES.forEach(term => {
                        const termActs = activities.filter(a => a.classId === student.classId && a.subject === selectedChartSubject && a.term === term);
                        // Student avg
                        let sws = 0, stw = 0;
                        termActs.forEach(act => {
                          const g = grades.find(g => g.activityId === act.id && g.studentId === student.id);
                          if (g && g.grade !== null) { sws += g.grade * act.weight; stw += act.weight; }
                        });
                        // Class avg
                        const classAvgs = classStudentsList.map(cs => {
                          let ws = 0, tw = 0;
                          termActs.forEach(act => {
                            const g = grades.find(g => g.activityId === act.id && g.studentId === cs.id);
                            if (g && g.grade !== null) { ws += g.grade * act.weight; tw += act.weight; }
                          });
                          return tw > 0 ? ws / tw : null;
                        }).filter((a): a is number => a !== null);
                        const classAvg = classAvgs.length > 0 ? classAvgs.reduce((a, b) => a + b, 0) / classAvgs.length : 0;
                        if (stw > 0) compData.push({ name: term, alumne: parseFloat((sws / stw).toFixed(1)), classe: parseFloat(classAvg.toFixed(1)) });
                      });
                      if (compData.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">Sense dades per aquesta matèria</p>;
                      return (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={compData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Bar dataKey="alumne" name="Alumne" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                            <Bar dataKey="classe" name="Mitjana Classe" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} maxBarSize={32} />
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No hi ha dades d'avaluació disponibles.</p>
          )}
        </section>

        {/* Reunions */}
        {studentMeetings.length > 0 && (
          <section className="bg-card rounded-xl shadow-sm border border-border p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icon name="groups" className="text-primary" /> Reunions</h3>
            <div className="space-y-2">
              {studentMeetings.map(m => (
                <div key={m.id} className="border border-border rounded-lg overflow-hidden">
                  <button onClick={() => setExpandedMeetingId(expandedMeetingId === m.id ? null : m.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-secondary transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <Icon name={m.completed ? 'check_circle' : 'event'} className={`text-lg ${m.completed ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-semibold text-sm text-foreground">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.date} · {m.time} · {m.type}</p>
                      </div>
                    </div>
                    <Icon name={expandedMeetingId === m.id ? 'expand_less' : 'expand_more'} className="text-muted-foreground" />
                  </button>
                  {expandedMeetingId === m.id && (
                    <div className="px-4 pb-4 space-y-2 text-sm border-t border-border pt-3">
                      {m.location && <p><span className="font-semibold text-foreground">Lloc:</span> <span className="text-muted-foreground">{m.location}</span></p>}
                      {m.discussion && <p><span className="font-semibold text-foreground">Temes a tractar:</span> <span className="text-muted-foreground">{m.discussion}</span></p>}
                      {m.agreements && <p><span className="font-semibold text-foreground">Acords:</span> <span className="text-muted-foreground">{m.agreements}</span></p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-2xl shadow-xl border border-border p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Exportar Informe</h2>
            <p className="text-sm text-muted-foreground mb-4">Selecciona les seccions que vols exportar:</p>
            <div className="space-y-3 mb-6">
              {[
                { key: 'personal', label: 'Dades Personals i Tutors' },
                { key: 'academic', label: 'Rendiment Acadèmic' },
                { key: 'behavior', label: 'Registre de Comportament' },
                { key: 'meetings', label: 'Reunions' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={exportOptions[opt.key as keyof typeof exportOptions]}
                    onChange={e => setExportOptions({ ...exportOptions, [opt.key]: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  <span className="text-sm text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Cancel·lar</button>
              <button onClick={handleExportData} className="bg-primary text-primary-foreground px-5 py-2 rounded-xl font-semibold text-sm">Generar Informe (.doc)</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default StudentProfile;
