
import React, { useState, useMemo } from 'react';
import Icon from '../components/Icon';
import { Student, ClassGroup, Objective, AttendanceData, EvaluationData } from '../types';

interface ClassProfileProps {
  classId: string | null;
  classes: ClassGroup[];
  students: Student[];
  viewStudent: (studentId: string) => void;
  navigateToAlumnes: () => void;
  setClasses: (updateFn: (prevClasses: ClassGroup[]) => ClassGroup[]) => void;
  attendanceData: AttendanceData;
  evaluationData: EvaluationData;
  subjects: string[];
}

const TRIMESTRES = ['1r Trim', '2n Trim', '3r Trim'];

const ObjectiveItem: React.FC<{
    objective: Objective;
    onToggle: () => void;
    onDelete: () => void;
    colorClass: string;
}> = ({ objective, onToggle, onDelete, colorClass }) => (
    <li className="group flex items-center gap-3 py-2">
        <button onClick={onToggle}>
            <Icon name={objective.completed ? "check_circle" : "radio_button_unchecked"} className={`text-xl transition-colors ${objective.completed ? colorClass : 'text-slate-300 dark:text-slate-600 hover:text-slate-400'}`} />
        </button>
        <span className={`flex-1 text-sm ${objective.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
            {objective.text}
        </span>
        <button onClick={onDelete} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <Icon name="delete" className="text-lg" />
        </button>
    </li>
);


const ClassProfile: React.FC<ClassProfileProps> = ({ classId, classes, students, viewStudent, navigateToAlumnes, setClasses, attendanceData, evaluationData, subjects }) => {
  const currentClass = classes.find(c => c.id === classId);
  const classStudents = students.filter(s => s.classId === classId);

  const [newQuarterlyObjectiveText, setNewQuarterlyObjectiveText] = useState('');
  const [newAnnualObjectiveText, setNewAnnualObjectiveText] = useState('');

  const averageAttendance = useMemo(() => {
    let totalPossible = 0;
    let totalAttended = 0;

    const studentIdsInClass = new Set(classStudents.map(s => s.id));

    for (const date in attendanceData) {
        const dayData = attendanceData[date];
        for (const studentId in dayData) {
            if (studentIdsInClass.has(studentId)) {
                const sessions = dayData[studentId];
                if (sessions.mati) {
                    totalPossible++;
                    if (sessions.mati !== 'Falta') {
                        totalAttended++;
                    }
                }
                if (sessions.tarda) {
                    totalPossible++;
                    if (sessions.tarda !== 'Falta') {
                        totalAttended++;
                    }
                }
            }
        }
    }

    if (totalPossible === 0) return 100;
    return Math.round((totalAttended / totalPossible) * 100);
  }, [classStudents, attendanceData]);

  // Càlcul real del rendiment del grup basat en evaluationData
  const classPerformance = useMemo(() => {
    if (!classId || !evaluationData) return [];

    return subjects.map(subject => {
        let classSum = 0;
        let studentsWithGrades = 0;

        classStudents.forEach(student => {
            let totalWeightedGrade = 0;
            let termsWithGrades = 0;

            TRIMESTRES.forEach(term => {
                const termEval = evaluationData[classId]?.[subject]?.[term];
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
                        termWeightedSum /= termTotalWeight;
                        totalWeightedGrade += termWeightedSum;
                        termsWithGrades++;
                    }
                }
            });

            if (termsWithGrades > 0) {
                classSum += (totalWeightedGrade / termsWithGrades);
                studentsWithGrades++;
            }
        });

        const avg = studentsWithGrades > 0 ? classSum / studentsWithGrades : null;
        return { subject, avg };
    }).filter(s => s.avg !== null)
      .sort((a, b) => (b.avg || 0) - (a.avg || 0))
      .slice(0, 4); // Mostrem les 4 principals
  }, [classId, classStudents, evaluationData, subjects]);

  const handleAddObjective = (type: 'quarterly' | 'annual') => {
    const text = (type === 'quarterly' ? newQuarterlyObjectiveText : newAnnualObjectiveText).trim();
    if (!text || !currentClass) return;

    const newObjective: Objective = {
        id: Date.now().toString(),
        text: text,
        completed: false,
    };

    setClasses(prevClasses => prevClasses.map(c => {
        if (c.id === currentClass.id) {
            const updatedClass = { ...c };
            if (type === 'quarterly') {
                updatedClass.quarterlyObjectives = [...(c.quarterlyObjectives || []), newObjective];
            } else {
                updatedClass.annualObjectives = [...(c.annualObjectives || []), newObjective];
            }
            return updatedClass;
        }
        return c;
    }));
    
    if (type === 'quarterly') {
        setNewQuarterlyObjectiveText('');
    } else {
        setNewAnnualObjectiveText('');
    }
  };

  const handleToggleObjective = (objectiveId: string, type: 'quarterly' | 'annual') => {
    setClasses(prevClasses => prevClasses.map(c => {
        if (c.id === classId) {
            const updatedClass = { ...c };
            const toggle = (obj: Objective) => obj.id === objectiveId ? { ...obj, completed: !obj.completed } : obj;
            if (type === 'quarterly') {
                updatedClass.quarterlyObjectives = (c.quarterlyObjectives || []).map(toggle);
            } else {
                updatedClass.annualObjectives = (c.annualObjectives || []).map(toggle);
            }
            return updatedClass;
        }
        return c;
    }));
  };

  const handleDeleteObjective = (objectiveId: string, type: 'quarterly' | 'annual') => {
    setClasses(prevClasses => prevClasses.map(c => {
        if (c.id === classId) {
            const updatedClass = { ...c };
            const filterOut = (obj: Objective) => obj.id !== objectiveId;
            if (type === 'quarterly') {
                updatedClass.quarterlyObjectives = (c.quarterlyObjectives || []).filter(filterOut);
            } else {
                updatedClass.annualObjectives = (c.annualObjectives || []).filter(filterOut);
            }
            return updatedClass;
        }
        return c;
    }));
  };


  if (!currentClass) {
    return (
      <main className="flex-1 p-6 flex flex-col items-center justify-center text-center">
        <Icon name="error" className="text-6xl text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold">Classe no trobada</h2>
        <button onClick={navigateToAlumnes} className="mt-6 bg-primary text-white px-5 py-2.5 rounded-lg flex items-center gap-2">
            <Icon name="arrow_back" /> Tornar
        </button>
      </main>
    );
  }

  const quarterlyObjectives = currentClass.quarterlyObjectives ?? [];
  const annualObjectives = currentClass.annualObjectives ?? [];

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                <a href="#" onClick={(e) => { e.preventDefault(); navigateToAlumnes(); }} className="hover:text-primary">Gestió</a>
                <Icon name="chevron_right" type="outlined" className="text-base mx-2" />
                <span className="text-slate-800 dark:text-white font-medium">{currentClass.name}</span>
            </div>
            <div className="flex items-center gap-3">
                <button className="p-2 text-slate-400 hover:text-primary"><Icon name="settings" type="outlined" /></button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background-light dark:bg-background-dark">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Dashboard Header */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white"><Icon name="groups" className="text-3xl" /></div>
                        <div>
                            <h1 className="text-2xl font-bold">{currentClass.name}</h1>
                            <p className="text-slate-500">Curs 2024-2025</p>
                        </div>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <p className="text-sm text-slate-500 font-medium">Alumnes</p>
                        <p className="text-3xl font-bold">{classStudents.length}</p>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <p className="text-sm text-slate-500 font-medium">Assistència Mitjana</p>
                        <p className="text-3xl font-bold text-primary">{averageAttendance}%</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Student List Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2"><Icon name="list" className="text-primary" /> Alumnes Matriculats</h3>
                                <button className="text-xs text-primary font-bold">VEURE TOTS</button>
                            </div>
                            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                {classStudents.map(student => (
                                    <li key={student.id}>
                                        <button onClick={() => viewStudent(student.id)} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <img src={student.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{student.name}</span>
                                            <Icon name="chevron_right" className="ml-auto text-slate-300" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>

                    {/* Class Stats/Notes */}
                    <div className="space-y-6">
                        <section className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2"><Icon name="auto_graph" className="text-primary" /> Rendiment del Grup</h3>
                            <div className="space-y-5">
                                {classPerformance.length > 0 ? classPerformance.map(({ subject, avg }) => (
                                    <div key={subject}>
                                        <div className="flex justify-between text-xs mb-1.5 uppercase font-bold text-slate-500 tracking-wider">
                                            <span>{subject}</span>
                                            <span className={`font-bold ${avg && avg < 5 ? 'text-red-500' : 'text-primary'}`}>{avg?.toFixed(1)}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-500 ${avg && avg < 5 ? 'bg-red-400' : 'bg-primary'}`}
                                                style={{ width: `${(avg || 0) * 10}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center text-sm text-slate-400 py-6 italic">No hi ha notes registrades per aquest grup.</p>
                                )}
                            </div>
                            <p className="mt-6 text-[10px] text-slate-400 text-center">* Basat en les notes de l'apartat d'Avaluació.</p>
                        </section>

                        <section className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
                            <h3 className="font-bold mb-4 flex items-center gap-2"><Icon name="flag" className="text-primary" /> Objectius del Curs</h3>
                            
                            {/* Quarterly Objectives */}
                            <div className="flex-1">
                                <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Trimestrals</h4>
                                {quarterlyObjectives.length > 0 ? (
                                    <ul className="space-y-1 divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {quarterlyObjectives.map(obj => (
                                            <ObjectiveItem 
                                                key={obj.id}
                                                objective={obj}
                                                onToggle={() => handleToggleObjective(obj.id, 'quarterly')}
                                                onDelete={() => handleDeleteObjective(obj.id, 'quarterly')}
                                                colorClass="text-primary"
                                            />
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-xs text-slate-400 py-4">No hi ha objectius trimestrals definits.</p>
                                )}
                                <form onSubmit={(e) => { e.preventDefault(); handleAddObjective('quarterly'); }} className="flex gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                    <input 
                                        type="text" 
                                        value={newQuarterlyObjectiveText}
                                        onChange={(e) => setNewQuarterlyObjectiveText(e.target.value)}
                                        placeholder="Nou objectiu trimestral..."
                                        className="flex-1 bg-slate-100 dark:bg-slate-700 border-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                    />
                                    <button type="submit" className="font-bold px-4 rounded-lg flex items-center justify-center shrink-0 bg-primary text-white">
                                        <Icon name="add" />
                                    </button>
                                </form>
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-700 my-6"></div>

                            {/* Annual Objectives */}
                            <div className="flex-1">
                                <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Anuals</h4>
                                {annualObjectives.length > 0 ? (
                                    <ul className="space-y-1 divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {annualObjectives.map(obj => (
                                            <ObjectiveItem 
                                                key={obj.id}
                                                objective={obj}
                                                onToggle={() => handleToggleObjective(obj.id, 'annual')}
                                                onDelete={() => handleDeleteObjective(obj.id, 'annual')}
                                                colorClass="text-blue-500"
                                            />
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-xs text-slate-400 py-4">No hi ha objectius anuals definits.</p>
                                )}
                                <form onSubmit={(e) => { e.preventDefault(); handleAddObjective('annual'); }} className="flex gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                    <input 
                                        type="text" 
                                        value={newAnnualObjectiveText}
                                        onChange={(e) => setNewAnnualObjectiveText(e.target.value)}
                                        placeholder="Nou objectiu anual..."
                                        className="flex-1 bg-slate-100 dark:bg-slate-700 border-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <button type="submit" className="font-bold px-4 rounded-lg flex items-center justify-center shrink-0 bg-blue-500 text-white">
                                        <Icon name="add" />
                                    </button>
                                </form>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    </main>
  );
};

export default ClassProfile;
