
import React, { useState, useMemo, useEffect } from 'react';
import Icon from '../components/Icon';
import { Student, ClassGroup } from '../types';

declare var XLSX: any;

interface AlumnesProps {
    students: Student[];
    setStudents: (updateFn: (prevStudents: Student[]) => Student[]) => void;
    viewStudent: (studentId: string) => void;
    classes: ClassGroup[];
    setClasses: (updateFn: (prevClasses: ClassGroup[]) => ClassGroup[]) => void;
    viewClass: (classId: string) => void;
}

export const Alumnes: React.FC<AlumnesProps> = ({ students, setStudents, viewStudent, classes, setClasses, viewClass }) => {
  const [mainView, setMainView] = useState<'alumnes' | 'classes'>('alumnes');
  
  // Student view state
  const [studentTab, setStudentTab] = useState<'list' | 'import' | 'add'>('list');
  const [filterClassId, setFilterClassId] = useState('all');

  // Class view state
  const [classTab, setClassTab] = useState<'list' | 'add'>('list');

  // Import state
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importTargetClassId, setImportTargetClassId] = useState(classes[0]?.id || '');
  
  useEffect(() => {
    if (!importTargetClassId && classes.length > 0) {
        setImportTargetClassId(classes[0].id);
    }
  }, [classes, importTargetClassId]);


  // Add student state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClassId, setNewStudentClassId] = useState(classes[0]?.id || '');
  const [addStudentError, setAddStudentError] = useState('');
  const [addStudentSuccess, setAddStudentSuccess] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Add class state
  const [newClassName, setNewClassName] = useState('');
  const [addClassError, setAddClassError] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);

  const filteredStudents = useMemo(() => {
    if (filterClassId === 'all') return students;
    return students.filter(s => s.classId === filterClassId);
  }, [students, filterClassId]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportError('');
      setImportSuccess('');
    }
  };

  const handleImport = () => {
    if (!file) {
      setImportError("Selecciona un fitxer per començar.");
      return;
    }
     if (!importTargetClassId) {
      setImportError("Has de seleccionar una classe de destí.");
      return;
    }
    setIsImporting(true);
    setImportError('');
    setImportSuccess('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, string>[];

        if (jsonData.length === 0) throw new Error("El fitxer està buit o no té dades d'alumnes.");

        const firstRow = jsonData[0];
        const nameHeaderOriginal = Object.keys(firstRow).find(h => h.trim().toLowerCase() === 'nom');

        if (!nameHeaderOriginal) throw new Error("No s'ha trobat la columna 'Nom' al fitxer.");

        const newStudents: Student[] = jsonData.map((row, index) => {
          const name = row[nameHeaderOriginal]?.trim();
          if (!name) return null;

          return {
            id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now() + index}`,
            name,
            classId: importTargetClassId,
            avatar: `https://picsum.photos/seed/${encodeURIComponent(name)}/100/100`,
            personalData: { birthDate: '', age: 0, address: '', socialSecurity: '' },
            tutors: [], alerts: [], privateNotes: `Notes inicials per a ${name}.`, behaviorLog: [],
          };
        }).filter((student): student is Student => student !== null);

        if (newStudents.length === 0) throw new Error("No s'han trobat noms vàlids per importar.");

        setStudents(prev => {
            const existingNames = new Set(prev.map(s => s.name.toLowerCase()));
            const uniqueNew = newStudents.filter(ns => !existingNames.has(ns.name.toLowerCase()));
             if (uniqueNew.length === 0) {
                throw new Error("Tots els alumnes del fitxer ja existeixen a la llista.");
            }
            setImportSuccess(`${uniqueNew.length} alumnes importats correctament!`);
            return [...prev, ...uniqueNew].sort((a,b) => a.name.localeCompare(b.name));
        });

        setFile(null);
        setTimeout(() => setStudentTab('list'), 2000);

      } catch (error: any) {
        setImportError(error.message || "Hi ha hagut un error en processar el fitxer.");
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => { 
        setIsImporting(false); 
        setImportError("No s'ha pogut llegir el fitxer."); 
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newStudentName.trim();
    if (!trimmedName) {
        setAddStudentError("El nom de l'alumne no pot estar buit.");
        return;
    }
    if (!newStudentClassId) {
        setAddStudentError("Has de seleccionar una classe per a l'alumne.");
        return;
    }
    
    setIsAdding(true); setAddStudentError(''); setAddStudentSuccess('');

    setTimeout(() => {
        let studentExists = false;
        setStudents(prev => {
            if (prev.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
                setAddStudentError("Ja existeix un alumne amb aquest nom.");
                studentExists = true;
                return prev;
            }
            const newStudent: Student = {
                id: `${trimmedName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
                name: trimmedName,
                classId: newStudentClassId,
                avatar: `https://picsum.photos/seed/${encodeURIComponent(trimmedName)}/100/100`,
                personalData: { birthDate: '', age: 0, address: '', socialSecurity: '' },
                tutors: [], alerts: [], privateNotes: `Notes inicials per a ${trimmedName}.`, behaviorLog: [],
            };
            return [...prev, newStudent].sort((a, b) => a.name.localeCompare(b.name));
        });

        if (!studentExists) {
            setAddStudentSuccess(`'${trimmedName}' s'ha afegit correctament!`);
            setNewStudentName('');
            setTimeout(() => { setStudentTab('list'); setAddStudentSuccess(''); }, 1500);
        }
        setIsAdding(false);
    }, 500);
  };
  
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newClassName.trim();
    if (!trimmedName) {
        setAddClassError("El nom de la classe no pot estar buit.");
        return;
    }
    setIsAddingClass(true); setAddClassError('');

    setTimeout(() => {
        let classExists = false;
        setClasses(prev => {
            if (prev.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
                setAddClassError('Ja existeix una classe amb aquest nom.');
                classExists = true;
                return prev;
            }
            const newClass: ClassGroup = {
                id: `${trimmedName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
                name: trimmedName,
            };
            return [...prev, newClass].sort((a,b) => a.name.localeCompare(b.name));
        });

        if (!classExists) {
            setNewClassName('');
            setClassTab('list');
        }
        setIsAddingClass(false);
    }, 500);
  };

  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name || 'Classe desconeguda';

  return (
    <main className="p-4 md:p-8 lg:p-10 w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Gestió de l'Aula</h1>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button onClick={() => setMainView('alumnes')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${mainView === 'alumnes' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500'}`}>Alumnes</button>
          <button onClick={() => setMainView('classes')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${mainView === 'classes' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500'}`}>Classes</button>
        </div>
      </header>
      
      { mainView === 'alumnes' && (
        <>
            <div className="flex items-center justify-between mb-4">
                 <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button onClick={() => setStudentTab('list')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${studentTab === 'list' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500'}`}>Llistat</button>
                    <button onClick={() => setStudentTab('import')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${studentTab === 'import' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500'}`}>Importar</button>
                    <button onClick={() => setStudentTab('add')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${studentTab === 'add' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500'}`}>Afegir</button>
                </div>
                { studentTab === 'list' && (
                <div className="relative">
                     <Icon name="filter_list" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <select value={filterClassId} onChange={e => setFilterClassId(e.target.value)} className="appearance-none bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 font-medium text-sm focus:ring-2 focus:ring-primary outline-none">
                        <option value="all">Totes les classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                </div>
                )}
            </div>

            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                { studentTab === 'list' ? (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredStudents.length > 0 ? filteredStudents.map(student => (
                        <li key={student.id}>
                            <a href="#" onClick={(e) => { e.preventDefault(); viewStudent(student.id); }} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full object-cover"/>
                            <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">{student.name}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{getClassName(student.classId)}</p>
                            </div>
                            <Icon name="chevron_right" className="ml-auto text-slate-400"/>
                            </a>
                        </li>
                        )) : <li className="p-6 text-center text-slate-500">No hi ha alumnes.</li>}
                    </ul>
                ) : studentTab === 'import' ? (
                     <div className="p-8 max-w-lg mx-auto space-y-6">
                        <div className="text-center">
                            <Icon name="upload_file" className="text-5xl text-primary mb-4" />
                            <h2 className="text-2xl font-bold">Importar Alumnes</h2>
                            <p className="text-slate-500 mt-2">Carrega un fitxer CSV o Excel amb una columna anomenada 'Nom'.</p>
                        </div>
                        
                        {classes.length > 0 ? (
                            <>
                                <div>
                                    <label className="text-left block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">1. Selecciona la classe de destí</label>
                                    <select 
                                        value={importTargetClassId} 
                                        onChange={e => setImportTargetClassId(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="text-left block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">2. Selecciona el fitxer</label>
                                    <input 
                                        type="file" 
                                        accept=".csv,.xlsx,.xls"
                                        onChange={handleFileChange} 
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
                                    />
                                </div>
                                
                                <button 
                                    onClick={handleImport} 
                                    disabled={isImporting || !file} 
                                    className="w-full bg-primary text-white font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center transition-all shadow-lg shadow-primary/20 hover:bg-primary-dark"
                                >
                                    {isImporting && <Icon name="progress_activity" className="animate-spin mr-2"/>}
                                    {isImporting ? 'Important...' : 'Importar Alumnes'}
                                </button>

                                {importError && <p className="text-red-500 text-sm mt-2 text-center">{importError}</p>}
                                {importSuccess && <p className="text-green-600 text-sm mt-2 text-center">{importSuccess}</p>}
                            </>
                        ) : (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-300 text-sm text-center">
                                <p className="font-bold">Primer has de crear una classe abans de poder importar alumnes.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8 max-w-lg mx-auto">
                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <input type="text" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="Nom de l'alumne" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 outline-none" />
                            <select value={newStudentClassId} onChange={e => setNewStudentClassId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 outline-none">
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl">Guardar Alumne</button>
                        </form>
                    </div>
                )}
            </div>
        </>
      )}

      { mainView === 'classes' && (
        <>
            <div className="flex items-center justify-between mb-4">
                 <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button onClick={() => setClassTab('list')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${classTab === 'list' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500'}`}>Llistat</button>
                    <button onClick={() => setClassTab('add')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${classTab === 'add' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500'}`}>Afegir Classe</button>
                </div>
            </div>
             <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                { classTab === 'list' ? (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {classes.map(cls => (
                        <li key={cls.id}>
                             <a href="#" onClick={(e) => { e.preventDefault(); viewClass(cls.id); }} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"><Icon name="groups" className="text-primary"/></div>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{cls.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{students.filter(s => s.classId === cls.id).length} alumnes</p>
                                </div>
                                <Icon name="chevron_right" className="ml-auto text-slate-400"/>
                            </a>
                        </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-8 max-w-lg mx-auto">
                        <form onSubmit={handleAddClass} className="space-y-4 text-center">
                            <Icon name="create_new_folder" className="text-5xl text-primary mx-auto mb-4" />
                            <input type="text" value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="Nom de la classe" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 outline-none" />
                            <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl">Crear Classe</button>
                        </form>
                    </div>
                )}
            </div>
        </>
      )}
    </main>
  );
};