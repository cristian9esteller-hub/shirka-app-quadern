
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Icon from '../components/Icon';
import { Student, Alert, ClassGroup, Tutor, LogEntry, AttendanceData, AttendanceStatus, EvaluationData, Meeting } from '../types';
import StudentPerformanceCharts from '../components/StudentPerformanceCharts';

declare var XLSX: any;

interface StudentProfileProps {
  studentId: string | null;
  students: Student[];
  classes: ClassGroup[];
  onUpdateStudent: (student: Student) => void;
  navigateToAlumnes: () => void;
  attendanceData: AttendanceData;
  evaluationData: EvaluationData;
  meetings: Meeting[];
  subjects: string[];
}

const TRIMESTRES = ['1r Trim', '2n Trim', '3r Trim'];

const getAlertColors = (color: Alert['color']) => {
    const colorMap = {
        red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800',
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
        amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
    }
    return colorMap[color];
}

const getTutorInitialColors = (initials: string) => {
    const colors = [
        'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    ];
    const charCodeSum = initials.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
}

const getLogIconBgColor = (type: 'positive' | 'negative' | 'neutral') => {
    const colorMap = {
        negative: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
        positive: 'bg-primary/20 text-green-600 dark:text-green-400',
        neutral: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    }
    return colorMap[type];
}

const ALERT_PRESETS: { type: Alert['type']; icon: string; title: string }[] = [
    { type: 'medical', icon: 'medical_services', title: 'Alerta Mèdica' },
    { type: 'other', icon: 'restaurant', title: 'Menjador' },
    { type: 'academic', icon: 'psychology', title: 'Reforç Acadèmic' },
];

const StudentProfile: React.FC<StudentProfileProps> = ({ studentId, students, classes, onUpdateStudent, navigateToAlumnes, attendanceData, evaluationData, meetings, subjects }) => {
  const student = students.find(s => s.id === studentId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
      personal: true,
      academic: true,
      behavior: true,
      meetings: true
  });

  const [editForm, setEditForm] = useState<Student | null>(null);
  const [privateNotes, setPrivateNotes] = useState(student?.privateNotes || '');
  const [isNotesSaved, setIsNotesSaved] = useState(true);
  const [selectedChartSubject, setSelectedChartSubject] = useState(subjects[0] || '');
  const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null);

  // Ensure selectedChartSubject is valid
  useEffect(() => {
    if (subjects.length > 0 && !subjects.includes(selectedChartSubject)) {
        setSelectedChartSubject(subjects[0]);
    }
  }, [subjects, selectedChartSubject]);

  // Behavior log state
  const [showLogForm, setShowLogForm] = useState(false);
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogType, setNewLogType] = useState<'positive' | 'negative' | 'neutral'>('neutral');
  const [newLogDate, setNewLogDate] = useState(new Date().toISOString().slice(0, 16));
  const [newLogDescription, setNewLogDescription] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (student) {
        setPrivateNotes(student.privateNotes);
        setIsNotesSaved(true);
        if (!isEditing) {
          setEditForm(JSON.parse(JSON.stringify(student)));
        }
    }
  }, [student, isEditing]);

  const academicPerformance = useMemo(() => {
    if (!student || !evaluationData) return [];
    
    return subjects.map(subject => {
        let totalWeightedGrade = 0;
        let termsWithGrades = 0;

        TRIMESTRES.forEach(term => {
            const termEval = evaluationData[student.classId]?.[subject]?.[term];
            if (termEval && termEval.activities.length > 0) {
                const studentGrades = termEval.grades[student.id] || {};
                let termWeightedSum = 0;
                let termTotalWeight = 0;

                termEval.activities.forEach(act => {
                    const grade = studentGrades[act.id];
                    if (grade !== null && grade !== undefined) {
                        termWeightedSum += grade * act.weight;
                        termTotalWeight += act.weight;
                    }
                });

                if (termTotalWeight > 0) {
                    const termAverage = termWeightedSum / termTotalWeight;
                    totalWeightedGrade += termAverage;
                    termsWithGrades++;
                }
            }
        });

        const overallAverage = termsWithGrades > 0 ? (totalWeightedGrade / termsWithGrades) : null;
        return { subject, average: overallAverage };
    }).filter(s => s.average !== null);
  }, [student, evaluationData, subjects]);

  const studentMeetings = useMemo(() => {
      if (!student) return [];
      return meetings
          .filter(m => m.studentId === student.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [meetings, student]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrivateNotes(e.target.value);
    setIsNotesSaved(false);
  };

  const handleSaveNotes = () => {
    if (student && !isNotesSaved) {
      onUpdateStudent({ ...student, privateNotes });
      setIsNotesSaved(true);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editForm) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const avatarDataUrl = event.target.result as string;
          setEditForm({ ...editForm, avatar: avatarDataUrl });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleStartEdit = () => {
    if (student) {
      setEditForm(JSON.parse(JSON.stringify(student)));
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(JSON.parse(JSON.stringify(student)));
  };

  const handleSaveEdit = () => {
    if (editForm) {
      onUpdateStudent(editForm);
      setIsEditing(false);
    }
  };

  const updateEditField = (path: string, value: any) => {
    if (!editForm) return;
    const newForm = { ...editForm };
    const keys = path.split('.');
    let current: any = newForm;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
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
    updateEditField('alerts', newAlerts);
  };
  
  const updateAlertIconAndType = (index: number, icon: string, type: Alert['type']) => {
    if (!editForm) return;
    const newAlerts = [...editForm.alerts];
    newAlerts[index].icon = icon;
    newAlerts[index].type = type;
    updateEditField('alerts', newAlerts);
  };

  const handleSaveLog = () => {
    if (!student || !newLogTitle || !newLogDescription) return;

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

    onUpdateStudent({
      ...student,
      behaviorLog: [newEntry, ...student.behaviorLog]
    });

    setNewLogTitle('');
    setNewLogDescription('');
    setShowLogForm(false);
  };

  const handleExportData = () => {
      if (!student) return;
      const wb = XLSX.utils.book_new();
      const fileName = `Informe_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

      if (exportOptions.personal) {
          const personalData = [
              { Camp: 'Nom Complet', Valor: student.name },
              { Camp: 'Classe', Valor: className },
              { Camp: 'Data Naixement', Valor: student.personalData.birthDate },
              { Camp: 'Adreça', Valor: student.personalData.address },
              { Camp: 'Seguretat Social', Valor: student.personalData.socialSecurity },
              { Camp: '', Valor: '' },
              { Camp: 'TUTORS', Valor: '' },
              ...student.tutors.flatMap(t => [
                  { Camp: 'Nom', Valor: t.name },
                  { Camp: 'Relació', Valor: t.relation },
                  { Camp: 'Telèfon', Valor: t.phone },
                  { Camp: 'Email', Valor: t.email },
                  { Camp: '---', Valor: '---' }
              ])
          ];
          const ws = XLSX.utils.json_to_sheet(personalData);
          XLSX.utils.book_append_sheet(wb, ws, "Dades Personals");
      }

      if (exportOptions.academic) {
          const academicData = academicPerformance.map(p => ({
              Assignatura: p.subject,
              Mitjana: p.average?.toFixed(2) || '-'
          }));
          const ws = XLSX.utils.json_to_sheet(academicData);
          XLSX.utils.book_append_sheet(wb, ws, "Rendiment Acadèmic");
      }

      if (exportOptions.behavior) {
          const behaviorData = student.behaviorLog.map(l => ({
              Data: l.date,
              Tipus: l.type,
              Títol: l.title,
              Descripció: l.description,
              Etiquetes: l.tags?.join(', ') || '-'
          }));
          const ws = XLSX.utils.json_to_sheet(behaviorData);
          XLSX.utils.book_append_sheet(wb, ws, "Comportament");
      }

      if (exportOptions.meetings) {
          const meetingData = studentMeetings.map(m => ({
              Data: m.date,
              Hora: m.time,
              Tipus: m.type,
              Títol: m.title,
              Lloc: m.location,
              Discussió: m.discussion,
              Acords: m.agreements
          }));
          const ws = XLSX.utils.json_to_sheet(meetingData);
          XLSX.utils.book_append_sheet(wb, ws, "Reunions");
      }

      XLSX.writeFile(wb, `${fileName}.xlsx`);
      setIsExportModalOpen(false);
  };

  const getAvgColor = (avg: number | null) => {
    if (avg === null) return 'bg-slate-100 text-slate-500';
    if (avg < 5) return 'bg-red-100 text-red-700';
    if (avg >= 9) return 'bg-primary/20 text-green-700';
    if (avg >= 7) return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
  };

  if (!student) {
    return (
      <main className="flex-1 p-6 flex flex-col items-center justify-center text-center">
        <Icon name="person_search" className="text-6xl text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold">Selecciona un alumne</h2>
        <p className="text-slate-500 mt-2">No s'ha trobat cap alumne amb l'ID proporcionat.</p>
        <button onClick={navigateToAlumnes} className="mt-6 bg-primary text-white font-medium px-5 py-2.5 rounded-lg flex items-center gap-2">
            <Icon name="arrow_back" /> Tornar a la llista
        </button>
      </main>
    );
  }
  
  const className = classes.find(c => c.id === student.classId)?.name || 'Classe no assignada';
  
  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                <a href="#" onClick={(e) => { e.preventDefault(); navigateToAlumnes(); }} className="hover:text-primary transition-colors">Alumnes</a>
                <Icon name="chevron_right" type="outlined" className="text-base mx-2" />
                <span className="text-slate-800 dark:text-white font-medium">{student.name}</span>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsExportModalOpen(true)}
                    className="p-2 text-slate-400 hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium" 
                    title="Exportar Fitxa"
                >
                    <Icon name="download" type="outlined" className="text-lg" />
                    <span className="hidden sm:inline">Exportar</span>
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                {!isEditing ? (
                  <button 
                    onClick={handleStartEdit}
                    className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    <Icon name="edit" type="outlined" className="text-sm" /> 
                    <span>Editar</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleCancelEdit}
                      className="text-sm font-medium text-slate-500 hover:text-slate-700 px-3 py-1.5"
                    >
                      Cancel·lar
                    </button>
                    <button 
                      onClick={handleSaveEdit}
                      className="bg-primary text-white font-bold px-4 py-1.5 rounded-lg shadow-sm shadow-primary/20"
                    >
                      Guardar
                    </button>
                  </div>
                )}
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background-light dark:bg-background-dark">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="relative group">
                          <img alt={`Retrat de ${student.name}`} className="w-24 h-24 md:w-32 md:h-32 rounded-xl object-cover border-4 border-white dark:border-slate-700 shadow-md" src={isEditing ? editForm?.avatar : student.avatar} />
                          {isEditing && (
                            <>
                              <button 
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl cursor-pointer"
                              >
                                <Icon name="photo_camera" />
                              </button>
                              <input 
                                type="file" 
                                ref={avatarInputRef} 
                                onChange={handleAvatarChange} 
                                accept="image/*" 
                                className="hidden" 
                              />
                            </>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    value={editForm?.name || ''} 
                                    onChange={(e) => updateEditField('name', e.target.value)}
                                    className="text-2xl md:text-3xl font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary w-full max-w-md"
                                  />
                                ) : (
                                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{student.name}</h1>
                                )}
                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-sm font-medium">{className}</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pt-1">
                                {(isEditing ? editForm?.alerts : student.alerts)?.map((alert, idx) => (
                                    <div key={idx} className="relative group flex items-center gap-2">
                                      <div className={`p-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${getAlertColors(alert.color)}`}>
                                          <Icon name={alert.icon} type="outlined" className="text-sm shrink-0" /> 
                                          {isEditing ? (
                                            <div className="flex flex-col gap-2">
                                                <input 
                                                  type="text" 
                                                  value={alert.text} 
                                                  onChange={(e) => {
                                                    const newAlerts = [...(editForm?.alerts || [])];
                                                    newAlerts[idx].text = e.target.value;
                                                    updateEditField('alerts', newAlerts);
                                                  }}
                                                  className="bg-transparent border-none outline-none focus:ring-0 p-0 text-xs font-bold w-full placeholder:text-slate-400"
                                                  placeholder="Text d'alerta"
                                                />
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex gap-2">
                                                        {ALERT_PRESETS.map(preset => (
                                                            <button 
                                                                key={preset.icon}
                                                                type="button"
                                                                onClick={() => updateAlertIconAndType(idx, preset.icon, preset.type)}
                                                                className={`p-1 rounded-md transition-colors ${alert.icon === preset.icon ? 'bg-primary/20' : 'bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                                                title={preset.title}
                                                            >
                                                                <Icon name={preset.icon} type="outlined" className="text-xs" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-1.5">
                                                      {(['red', 'blue', 'amber'] as const).map(c => (
                                                        <button 
                                                          key={c}
                                                          type="button"
                                                          onClick={() => updateAlertColor(idx, c)}
                                                          className={`w-3 h-3 rounded-full border border-black/10 transition-transform ${alert.color === c ? 'scale-125 ring-1 ring-offset-1 ring-slate-400 dark:ring-offset-slate-800' : 'hover:scale-110'}`}
                                                          style={{ backgroundColor: c === 'amber' ? '#fbbf24' : c === 'blue' ? '#3b82f6' : '#ef4444' }}
                                                        />
                                                      ))}
                                                    </div>
                                                </div>
                                            </div>
                                          ) : <span>{alert.text}</span>}
                                      </div>
                                      {isEditing && (
                                        <button 
                                          onClick={() => removeAlert(idx)}
                                          className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-sm hover:bg-red-600 transition-colors"
                                        >
                                          <Icon name="close" />
                                        </button>
                                      )}
                                    </div>
                                ))}
                                {isEditing && (
                                  <button 
                                    onClick={addAlert}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-500 border border-dashed border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                  >
                                    <Icon name="add" className="text-sm" /> Afegir Alerta
                                  </button>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto">
                            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white dark:text-slate-900 px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-primary/30"><Icon name="call" type="outlined" /> Trucar Tutors</button>
                            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-lg font-medium transition-colors"><Icon name="mail" type="outlined" /> Enviar Email</button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-6">
                        {/* Dades Personals */}
                        <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icon name="person" type="outlined" className="text-primary" /> Dades Personals</h3>
                            <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Data Naixement</p>
                                      {isEditing ? (
                                        <input 
                                          type="text" 
                                          value={editForm?.personalData.birthDate || ''} 
                                          onChange={(e) => updateEditField('personalData.birthDate', e.target.value)}
                                          className="font-medium mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                                        />
                                      ) : (
                                        <p className="font-medium mt-0.5">{student.personalData.birthDate || '-'}</p>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Edat</p>
                                      {isEditing ? (
                                        <input 
                                          type="number" 
                                          value={editForm?.personalData.age || 0} 
                                          onChange={(e) => updateEditField('personalData.age', parseInt(e.target.value))}
                                          className="font-medium mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                                        />
                                      ) : (
                                        <p className="font-medium mt-0.5">{student.personalData.age ? `${student.personalData.age} anys` : '-'}</p>
                                      )}
                                    </div>
                                </div>
                                <div>
                                  <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Adreça</p>
                                  {isEditing ? (
                                    <input 
                                      type="text" 
                                      value={editForm?.personalData.address || ''} 
                                      onChange={(e) => updateEditField('personalData.address', e.target.value)}
                                      className="font-medium mt-0.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                                    />
                                  ) : (
                                    <p className="font-medium mt-0.5">{student.personalData.address || '-'}</p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Núm. Seguretat Social</p>
                                  {isEditing ? (
                                    <input 
                                      type="text" 
                                      value={editForm?.personalData.socialSecurity || ''} 
                                      onChange={(e) => updateEditField('personalData.socialSecurity', e.target.value)}
                                      className="font-medium mt-0.5 text-slate-600 dark:text-slate-300 font-mono w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                                    />
                                  ) : (
                                    <p className="font-medium mt-0.5 text-slate-600 dark:text-slate-300 font-mono">{student.personalData.socialSecurity || '-'}</p>
                                  )}
                                </div>
                            </div>
                        </section>
                        
                        {/* Contacte Tutors */}
                        <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2"><Icon name="family_restroom" type="outlined" className="text-primary" /> Contacte Tutors</h3>
                                {isEditing && (
                                  <button onClick={addTutor} className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                                    <Icon name="add" className="text-sm" /> AFEGIR
                                  </button>
                                )}
                             </div>
                             <div className="space-y-4">
                                {(isEditing ? editForm?.tutors : student.tutors)?.map((tutor, index) => (
                                    <React.Fragment key={index}>
                                        {index > 0 && <div className="border-t border-slate-100 dark:border-slate-700"></div>}
                                        <div className="flex items-start gap-3 pt-1 relative group">
                                            <div className={`w-10 h-10 rounded-full ${getTutorInitialColors(tutor.initials)} flex items-center justify-center shrink-0`}><span className="text-sm font-bold">{tutor.initials}</span></div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                {isEditing ? (
                                                  <>
                                                    <input 
                                                      type="text" 
                                                      value={tutor.name} 
                                                      onChange={(e) => {
                                                        const newTutors = [...(editForm?.tutors || [])];
                                                        newTutors[index].name = e.target.value;
                                                        newTutors[index].initials = e.target.value.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                                        updateEditField('tutors', newTutors);
                                                      }}
                                                      placeholder="Nom del tutor"
                                                      className="text-sm font-bold w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                                                    />
                                                    <input 
                                                      type="text" 
                                                      value={tutor.relation} 
                                                      onChange={(e) => {
                                                        const newTutors = [...(editForm?.tutors || [])];
                                                        newTutors[index].relation = e.target.value;
                                                        updateEditField('tutors', newTutors);
                                                      }}
                                                      placeholder="Relació"
                                                      className="text-xs text-slate-500 dark:text-slate-400 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                                                    />
                                                    <input 
                                                      type="text" 
                                                      value={tutor.phone} 
                                                      onChange={(e) => {
                                                        const newTutors = [...(editForm?.tutors || [])];
                                                        newTutors[index].phone = e.target.value;
                                                        updateEditField('tutors', newTutors);
                                                      }}
                                                      placeholder="Telèfon"
                                                      className="text-sm text-slate-600 dark:text-slate-300 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                                                    />
                                                    <input 
                                                      type="email" 
                                                      value={tutor.email} 
                                                      onChange={(e) => {
                                                        const newTutors = [...(editForm?.tutors || [])];
                                                        newTutors[index].email = e.target.value;
                                                        updateEditField('tutors', newTutors);
                                                      }}
                                                      placeholder="Email"
                                                      className="text-sm text-slate-600 dark:text-slate-300 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                                                    />
                                                  </>
                                                ) : (
                                                  <>
                                                    <p className="text-sm font-bold">{tutor.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{tutor.relation}</p>
                                                    <a href={`tel:${tutor.phone}`} className="text-sm text-slate-600 dark:text-slate-300 hover:text-primary flex items-center gap-2"><Icon name="phone" type="outlined" className="text-xs" /> {tutor.phone}</a>
                                                    <a href={`mailto:${tutor.email}`} className="text-sm text-slate-600 dark:text-slate-300 hover:text-primary flex items-center gap-2 truncate"><Icon name="email" type="outlined" className="text-xs" /> {tutor.email}</a>
                                                  </>
                                                )}
                                            </div>
                                            {isEditing && (
                                              <button 
                                                onClick={() => removeTutor(index)}
                                                className="absolute top-0 right-0 text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <Icon name="delete" className="text-sm" />
                                              </button>
                                            )}
                                        </div>
                                    </React.Fragment>
                                ))}
                                {(!isEditing && student.tutors.length === 0) && <p className="text-sm text-slate-500 text-center py-4">No hi ha tutors registrats.</p>}
                             </div>
                        </section>
                    </div>
                    
                    <div className="lg:col-span-2 space-y-6">
                        {/* Notes Privades */}
                        <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col h-fit">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2"><Icon name="sticky_note_2" type="outlined" className="text-primary" /> Notes Privades</h3>
                                <span className={`text-xs flex items-center gap-1 transition-colors ${isNotesSaved ? 'text-slate-400' : 'text-amber-500 font-medium'}`}>
                                    <Icon name={isNotesSaved ? "cloud_done" : "edit"} type="outlined" className="text-[14px]" /> 
                                    {isNotesSaved ? 'Canvis desats' : 'Canvis pendents...'}
                                </span>
                            </div>
                            <textarea 
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-slate-700 dark:text-slate-200 text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-h-[140px] resize-y" 
                                placeholder="Escriu aquí observacions personals..."
                                value={privateNotes}
                                onChange={handleNotesChange}
                                onBlur={handleSaveNotes}
                            />
                        </section>
                        
                         {/* Registre de Comportament */}
                        <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex-1">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold flex items-center gap-2"><Icon name="history_edu" type="outlined" className="text-primary" /> Registre de Comportament</h3>
                                <button 
                                  onClick={() => setShowLogForm(!showLogForm)}
                                  className={`text-sm ${showLogForm ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'} hover:bg-slate-200 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors`}
                                >
                                  <Icon name={showLogForm ? "close" : "add"} type="outlined" className="text-sm" /> 
                                  {showLogForm ? 'Cancel·lar' : 'Nova Observació'}
                                </button>
                            </div>

                            {showLogForm && (
                              <div className="mb-8 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Títol de l'observació</label>
                                    <input 
                                      type="text" 
                                      value={newLogTitle} 
                                      onChange={(e) => setNewLogTitle(e.target.value)}
                                      placeholder="Ex: Millora en lectura"
                                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Valoració</label>
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => setNewLogType('positive')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${newLogType === 'positive' ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-slate-200 text-slate-400'}`}
                                      >Positiva</button>
                                      <button 
                                        onClick={() => setNewLogType('neutral')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${newLogType === 'neutral' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-400'}`}
                                      >Neutra</button>
                                      <button 
                                        onClick={() => setNewLogType('negative')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${newLogType === 'negative' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-slate-200 text-slate-400'}`}
                                      >Negativa</button>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Data i Hora</label>
                                  <input 
                                    type="datetime-local" 
                                    value={newLogDate}
                                    onChange={(e) => setNewLogDate(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Descripció detallada</label>
                                  <textarea 
                                    value={newLogDescription}
                                    onChange={(e) => setNewLogDescription(e.target.value)}
                                    placeholder="Explica què ha passat..."
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                                  />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                  <button 
                                    onClick={() => setShowLogForm(false)}
                                    className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700"
                                  >Cancel·lar</button>
                                  <button 
                                    onClick={handleSaveLog}
                                    disabled={!newLogTitle || !newLogDescription}
                                    className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md shadow-primary/20 transition-all disabled:opacity-50"
                                  >Guardar Observació</button>
                                </div>
                              </div>
                            )}

                            {student.behaviorLog.length > 0 ? (
                                <div className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-700 space-y-8">
                                    {student.behaviorLog.map(log => (
                                        <div key={log.id} className="relative">
                                            <div className={`absolute -left-[21px] top-1 border-2 border-white dark:border-slate-800 p-1 rounded-full ${getLogIconBgColor(log.type)}`}>
                                                <Icon name={log.icon} type="outlined" className="text-xs block" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-sm font-bold">{log.title}</h4>
                                                    <span className="text-xs text-slate-400">{log.date}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{log.description}</p>
                                                {log.tags && log.tags.length > 0 && (
                                                    <div className="flex gap-2 mt-2">
                                                        {log.tags.map(tag => <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-xs text-slate-500 rounded">{tag}</span>)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-slate-500 text-center py-8">No hi ha observacions registrades.</p>}
                        </section>

                        {/* Rendiment Acadèmic */}
                        <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icon name="leaderboard" type="outlined" className="text-primary" /> Rendiment Acadèmic</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                                {academicPerformance.map(({ subject, average }) => (
                                    <div key={subject} className={`p-3 rounded-lg text-center ${getAvgColor(average)}`}>
                                        <p className="text-[11px] font-bold uppercase truncate">{subject}</p>
                                        <p className="text-2xl font-bold">{average?.toFixed(1) ?? '-'}</p>
                                    </div>
                                ))}
                                {academicPerformance.length === 0 && (
                                  <p className="col-span-full text-center text-sm text-slate-400 py-4">No hi ha notes registrades.</p>
                                )}
                            </div>
                            
                            {academicPerformance.length > 0 && (
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                                        <h4 className="font-bold text-sm">Gràfics d'evolució</h4>
                                        <select 
                                          value={selectedChartSubject} 
                                          onChange={e => setSelectedChartSubject(e.target.value)}
                                          className="w-full sm:w-auto bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/30"
                                        >
                                            {subjects.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <StudentPerformanceCharts 
                                        student={student}
                                        studentsInClass={students.filter(s => s.classId === student.classId)}
                                        evaluationData={evaluationData}
                                        subject={selectedChartSubject}
                                    />
                                </div>
                            )}
                        </section>
                        
                        {/* Historial de Reunions */}
                        <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icon name="groups_3" type="outlined" className="text-primary" /> Historial de Reunions</h3>
                            <div className="space-y-3">
                                {studentMeetings.length > 0 ? studentMeetings.map(meeting => (
                                    <div key={meeting.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <button 
                                            onClick={() => setExpandedMeetingId(expandedMeetingId === meeting.id ? null : meeting.id)}
                                            className="w-full text-left p-4 flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="font-bold text-sm">{meeting.title}</p>
                                                <p className="text-xs text-slate-500">{new Date(meeting.date).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                            <Icon name={expandedMeetingId === meeting.id ? "expand_less" : "expand_more"} className="text-slate-400" />
                                        </button>
                                        {expandedMeetingId === meeting.id && (
                                            <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-200">
                                                <div className="mt-4 space-y-4 text-sm">
                                                    <div>
                                                        <h4 className="font-bold text-xs uppercase text-slate-500 mb-1">Temes Tractats</h4>
                                                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{meeting.discussion || "Cap anotació."}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-xs uppercase text-slate-500 mb-1">Acords</h4>
                                                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{meeting.agreements || "Cap acord registrat."}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <p className="text-center text-sm text-slate-400 py-4">No hi ha reunions registrades per a aquest alumne.</p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>

        {/* Modal d'Exportació */}
        {isExportModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                    <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Icon name="download" className="text-primary" /> Exportar Informe
                        </h2>
                        <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <Icon name="close" />
                        </button>
                    </header>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-slate-500 mb-2">Selecciona quina informació vols incloure al fitxer Excel:</p>
                        
                        <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group">
                            <input 
                                type="checkbox" 
                                checked={exportOptions.personal}
                                onChange={e => setExportOptions({...exportOptions, personal: e.target.checked})}
                                className="w-5 h-5 rounded text-primary focus:ring-primary/20"
                            />
                            <div>
                                <p className="text-sm font-bold">Dades Personals</p>
                                <p className="text-[11px] text-slate-400">Informació básica i contactes familiar</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                            <input 
                                type="checkbox" 
                                checked={exportOptions.academic}
                                onChange={e => setExportOptions({...exportOptions, academic: e.target.checked})}
                                className="w-5 h-5 rounded text-primary focus:ring-primary/20"
                            />
                            <div>
                                <p className="text-sm font-bold">Rendiment Acadèmic</p>
                                <p className="text-[11px] text-slate-400">Mitjanes d'assignatures i trimestres</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                            <input 
                                type="checkbox" 
                                checked={exportOptions.behavior}
                                onChange={e => setExportOptions({...exportOptions, behavior: e.target.checked})}
                                className="w-5 h-5 rounded text-primary focus:ring-primary/20"
                            />
                            <div>
                                <p className="text-sm font-bold">Registre de Comportament</p>
                                <p className="text-[11px] text-slate-400">Totes les observacions registrades</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                            <input 
                                type="checkbox" 
                                checked={exportOptions.meetings}
                                onChange={e => setExportOptions({...exportOptions, meetings: e.target.checked})}
                                className="w-5 h-5 rounded text-primary focus:ring-primary/20"
                            />
                            <div>
                                <p className="text-sm font-bold">Historial de Reunions</p>
                                <p className="text-[11px] text-slate-400">Resum d'entrevistes i acords</p>
                            </div>
                        </label>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                        <button 
                            onClick={() => setIsExportModalOpen(false)}
                            className="flex-1 py-3 text-sm font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            CANCEL·LAR
                        </button>
                        <button 
                            onClick={handleExportData}
                            disabled={!Object.values(exportOptions).some(v => v)}
                            className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            DESCARREGAR
                        </button>
                    </div>
                </div>
            </div>
        )}
    </main>
  );
};

export default StudentProfile;
