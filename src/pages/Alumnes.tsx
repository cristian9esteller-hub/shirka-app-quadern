import React, { useState, useMemo, useEffect } from 'react';
import Icon from '@/components/Icon';
import type { Student, ClassGroup } from '@/types';
import * as XLSX from 'xlsx';
import { StudentAvatar } from '@/components/StudentAvatar';
import { getAvatarSrc } from '@/lib/avatar-utils';

interface AlumnesProps {
  students: Student[];
  classes: ClassGroup[];
  onAddStudent: (name: string, classId: string, gender?: Student['gender'], personalData?: Partial<Student['personalData']>, tutors?: Student['tutors']) => Promise<any>;
  onAddClass: (name: string) => Promise<any>;
  onViewStudent: (studentId: string) => void;
  onViewClass: (classId: string) => void;
}

const Alumnes: React.FC<AlumnesProps> = ({ students, classes, onAddStudent, onAddClass, onViewStudent, onViewClass }) => {
  const [mainView, setMainView] = useState<'alumnes' | 'classes'>('alumnes');

  // Student view state
  const [studentTab, setStudentTab] = useState<'list' | 'import' | 'add'>('list');
  const [filterClassId, setFilterClassId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Class view state
  const [classTab, setClassTab] = useState<'list' | 'add'>('list');

  // Import state
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importTargetClassId, setImportTargetClassId] = useState(classes[0]?.id || '');
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);

  useEffect(() => {
    if (!importTargetClassId && classes.length > 0) {
      setImportTargetClassId(classes[0].id);
    }
  }, [classes, importTargetClassId]);

  // Add student state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClassId, setNewStudentClassId] = useState(classes[0]?.id || '');
  const [newStudentGender, setNewStudentGender] = useState<Student['gender']>('nen');
  const [addStudentError, setAddStudentError] = useState('');
  const [addStudentSuccess, setAddStudentSuccess] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Add class state
  const [newClassName, setNewClassName] = useState('');
  const [addClassError, setAddClassError] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (filterClassId !== 'all') {
      result = result.filter(s => s.classId === filterClassId);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(query));
    }
    return result;
  }, [students, filterClassId, searchQuery]);

  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name || 'Classe desconeguda';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportError('');
      setImportSuccess('');
    }
  };

  const handleImport = async () => {
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
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

        if (jsonData.length === 0) throw new Error("El fitxer està buit o no té dades d'alumnes.");

        const firstRow = jsonData[0];
        const headers = Object.keys(firstRow);

        const findHeader = (patterns: string[]) =>
          headers.find(h => patterns.some(p => h.trim().toLowerCase().includes(p.toLowerCase())));

        const hName = findHeader(['nom', 'nombre', 'alumne', 'estudiant']);
        const hGender = findHeader(['genere', 'gènere', 'sex', 'sexe']);
        const hEmail = findHeader(['email alumne', 'correu alumne', 'mail alumne', 'email student']);
        const hBirthDate = findHeader(['naixement', 'nacimiento', 'birth']);
        const hAddress = findHeader(['adreça', 'direccio', 'dirección', 'address']);
        const hSS = findHeader(['seguretat social', 'ss', 'seguridad social']);

        // Tutors headers
        const hTutor1Name = findHeader(['nom pare', 'nom mare', 'tutor 1', 'nom tutor']);
        const hTutor1Rel = findHeader(['relacio 1', 'relació 1', 'vinculo 1', 'parentiu 1']);
        const hTutor1Phone = findHeader(['telefon 1', 'telèfon 1', 'telefono 1', 'phone 1']);
        const hTutor1Email = findHeader(['email 1', 'mail 1', 'correu 1']);

        const hTutor2Name = findHeader(['nom segon tutor', 'nom tutor 2', 'tutor 2']);
        const hTutor2Rel = findHeader(['relacio 2', 'relació 2', 'vinculo 2', 'parentiu 2']);
        const hTutor2Phone = findHeader(['telefon 2', 'telèfon 2', 'telefono 2', 'phone 2']);
        const hTutor2Email = findHeader(['email 2', 'mail 2', 'correu 2']);

        if (!hName) throw new Error("No s'ha trobat la columna 'Nom' al fitxer.");

        const parseDate = (val: any) => {
          if (!val) return null;
          if (val instanceof Date) return val;
          const str = val.toString().trim();
          // Match DD/MM/YYYY or DD-MM-YYYY
          const ddmmyyyy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
          if (ddmmyyyy) {
            const day = parseInt(ddmmyyyy[1], 10);
            const month = parseInt(ddmmyyyy[2], 10) - 1;
            const year = parseInt(ddmmyyyy[3], 10);
            return new Date(year, month, day);
          }
          const d = new Date(str);
          return isNaN(d.getTime()) ? null : d;
        };

        const calculateAge = (dateVal: any) => {
          const birthDate = parseDate(dateVal);
          if (!birthDate) return 0;
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          return age;
        };

        const existingNames = new Set(students.map(s => s.name.toLowerCase()));
        let foundStudents: any[] = [];
        let duplicateCount = 0;

        for (const row of jsonData) {
          const name = row[hName]?.toString().trim();
          if (!name) continue;

          if (existingNames.has(name.toLowerCase())) {
            duplicateCount++;
            continue;
          }

          let gender: Student['gender'] = 'altre';
          const genderVal = row[hGender || '']?.toString().trim().toLowerCase();
          if (['nen', 'noi', 'm', 'mascle', 'hombre', 'niño', 'male'].includes(genderVal)) gender = 'nen';
          else if (['nena', 'noia', 'f', 'femella', 'mujer', 'niña', 'female'].includes(genderVal)) gender = 'nena';
          else if (name.toLowerCase().endsWith('a')) gender = 'nena';
          else gender = 'nen';

          const birthDate = parseDate(row[hBirthDate || '']);
          let birthDateStr = '';
          if (birthDate) {
            birthDateStr = birthDate.toISOString().split('T')[0];
          }

          const personalData = {
            birthDate: birthDateStr,
            age: calculateAge(row[hBirthDate || '']),
            address: row[hAddress || '']?.toString().trim() || '',
            socialSecurity: row[hSS || '']?.toString().trim() || '',
            email: row[hEmail || '']?.toString().trim() || '',
          };

          const tutors: any[] = [];
          if (row[hTutor1Name || '']) {
            tutors.push({
              name: row[hTutor1Name || ''].toString().trim(),
              relation: row[hTutor1Rel || '']?.toString().trim() || 'Tutor/a',
              phone: row[hTutor1Phone || '']?.toString().trim() || '',
              email: row[hTutor1Email || '']?.toString().trim() || '',
              initials: row[hTutor1Name || ''].toString().trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
            });
          }
          if (row[hTutor2Name || '']) {
            tutors.push({
              name: row[hTutor2Name || ''].toString().trim(),
              relation: row[hTutor2Rel || '']?.toString().trim() || 'Tutor/a',
              phone: row[hTutor2Phone || '']?.toString().trim() || '',
              email: row[hTutor2Email || '']?.toString().trim() || '',
              initials: row[hTutor2Name || ''].toString().trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
            });
          }

          foundStudents.push({ name, gender, personalData, tutors });
        }

        if (foundStudents.length === 0) {
          if (duplicateCount > 0) throw new Error("Tots els alumnes del fitxer ja existeixen a la llista.");
          throw new Error("No s'han trobat noms vàlids per importar.");
        }

        setPendingStudents(foundStudents);
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

  const handleAddStudent = async (e: React.FormEvent) => {
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
    if (students.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
      setAddStudentError("Ja existeix un alumne amb aquest nom.");
      return;
    }

    setIsAdding(true);
    setAddStudentError('');
    setAddStudentSuccess('');

    const { error } = await onAddStudent(trimmedName, newStudentClassId, newStudentGender);
    if (error) {
      setAddStudentError(error.message);
      setIsAdding(false);
      return;
    }

    setAddStudentSuccess(`'${trimmedName}' s'ha afegit correctament!`);
    setNewStudentName('');
    setIsAdding(false);
    setTimeout(() => { setStudentTab('list'); setAddStudentSuccess(''); }, 1500);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newClassName.trim();
    if (!trimmedName) {
      setAddClassError("El nom de la classe no pot estar buit.");
      return;
    }
    if (classes.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      setAddClassError('Ja existeix una classe amb aquest nom.');
      return;
    }

    setIsAddingClass(true);
    setAddClassError('');

    const { error } = await onAddClass(trimmedName);
    if (error) {
      setAddClassError(error.message);
      setIsAddingClass(false);
      return;
    }

    setNewClassName('');
    setClassTab('list');
    setIsAddingClass(false);
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    setImportError('');
    let count = 0;
    for (const s of pendingStudents) {
      const { error } = await onAddStudent(s.name, importTargetClassId, s.gender, s.personalData, s.tutors);
      if (!error) count++;
    }
    setPendingStudents([]);
    setImportSuccess(`S'han creat ${count} alumnes correctament!`);
    setFile(null);
    setTimeout(() => { setStudentTab('list'); setImportSuccess(''); }, 3000);
    setIsImporting(false);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Nom", "Gènere", "Email Alumne", "Data Naixement", "Adreça", "Seguretat Social",
      "Nom Tutor 1", "Relació 1", "Telèfon 1", "Email 1",
      "Nom Tutor 2", "Relació 2", "Telèfon 2", "Email 2"
    ];
    const data = [
      headers,
      ["Exemple Nom", "nen", "alumne@exemple.com", "01/01/2015", "Carrer Major 1", "12345678", "Joan", "Pare", "600000000", "pare@exemple.com", "Maria", "Mare", "611111111", "mare@exemple.com"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alumnes");
    XLSX.writeFile(wb, "plantilla_alumnes.xlsx");
  };

  const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className={`flex-1 h-11 flex items-center justify-center text-sm font-bold rounded-xl transition-all ${active ? 'bg-card text-primary shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}>
      {children}
    </button>
  );

  return (
    <main className="p-4 md:p-8 lg:p-10 w-full overflow-y-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Gestió de l'Aula</h1>
        <div className="flex bg-secondary/50 p-1.5 rounded-2xl border border-border/50 w-full sm:w-auto gap-2 md:gap-4">
          <TabButton active={mainView === 'alumnes'} onClick={() => setMainView('alumnes')}>Alumnes</TabButton>
          <TabButton active={mainView === 'classes'} onClick={() => setMainView('classes')}>Classes</TabButton>
        </div>
      </header>

      {mainView === 'alumnes' && (
        <>
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div className="flex bg-secondary/50 p-1.5 rounded-2xl border border-border/50 w-full sm:w-auto gap-2 md:gap-4">
              <TabButton active={studentTab === 'list'} onClick={() => setStudentTab('list')}>Llistat</TabButton>
              <TabButton active={studentTab === 'import'} onClick={() => setStudentTab('import')}>Importar</TabButton>
              <TabButton active={studentTab === 'add'} onClick={() => setStudentTab('add')}>Afegir</TabButton>
            </div>
            {studentTab === 'list' && (
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                  <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cerca alumne..."
                    className="w-full bg-card border border-border rounded-lg py-2 pl-10 pr-4 font-medium text-sm focus:ring-2 focus:ring-primary outline-none text-foreground"
                  />
                </div>
                <div className="relative">
                  <Icon name="filter_list" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select value={filterClassId} onChange={e => setFilterClassId(e.target.value)} className="appearance-none bg-card border border-border rounded-lg py-2 pl-10 pr-4 font-medium text-sm focus:ring-2 focus:ring-primary outline-none text-foreground min-w-[150px]">
                    <option value="all">Totes les classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border">
            {studentTab === 'list' ? (
              <ul className="divide-y divide-border">
                {filteredStudents.length > 0 ? filteredStudents.map(student => (
                  <li key={student.id}>
                    <button onClick={() => onViewStudent(student.id)} className="w-full flex items-center gap-4 p-4 hover:bg-secondary transition-colors text-left">
                      <StudentAvatar student={student} size="list" />
                      <div>
                        <p className="font-semibold text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{getClassName(student.classId)}</p>
                      </div>
                      <Icon name="chevron_right" className="ml-auto text-muted-foreground" />
                    </button>
                  </li>
                )) : <li className="p-6 text-center text-muted-foreground">No hi ha alumnes.</li>}
              </ul>
            ) : studentTab === 'import' ? (
              <div className="p-8 max-w-lg mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <Icon name="upload_file" className="text-5xl text-primary mb-2" />
                  <h2 className="text-2xl font-bold text-foreground">Importar Alumnes</h2>
                  <p className="text-sm text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
                    Baixa la plantilla, omple les dades dels teus alumnes i torna-la a pujar per actualitzar el grup automàticament.
                  </p>
                </div>

                {classes.length > 0 ? (
                  <>
                    {pendingStudents.length > 0 ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                          <p className="text-lg font-semibold text-foreground mb-1">S'han detectat {pendingStudents.length} alumnes.</p>
                          <p className="text-sm text-muted-foreground mb-6">Vols confirmar la importació d'aquests alumnes a la classe <b>{getClassName(importTargetClassId)}</b>?</p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setPendingStudents([])}
                              disabled={isImporting}
                              className="flex-1 bg-secondary text-secondary-foreground font-bold py-3 rounded-xl hover:bg-secondary/80 transition-colors"
                            >
                              Cancel·lar
                            </button>
                            <button
                              onClick={handleConfirmImport}
                              disabled={isImporting}
                              className="flex-[2] bg-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:translate-y-[-1px] transition-all"
                            >
                              {isImporting && <Icon name="progress_activity" className="animate-spin mr-2" />}
                              Confirmar Importació
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-6">
                          <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground bg-secondary/40 py-1.5 px-4 rounded-full w-fit mx-auto border border-border/30">
                            <Icon name="info" className="text-sm text-primary" />
                            <span>Recorda el format: <b className="text-foreground">DD/MM/AAAA</b></span>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="text-left block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-1">1. Selecciona la classe de destí</label>
                              <select
                                value={importTargetClassId}
                                onChange={e => setImportTargetClassId(e.target.value)}
                                className="w-full bg-secondary/50 border border-border rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary text-foreground transition-all"
                              >
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>

                            <div>
                              <label className="text-left block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-1">2. Selecciona el fitxer</label>
                              <div className="flex gap-3">
                                <div className="flex-1 relative">
                                  <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                  />
                                  <div className="bg-secondary/50 border border-border rounded-xl py-3 px-4 text-sm text-muted-foreground flex items-center gap-2 truncate">
                                    <Icon name="attach_file" className="text-primary shrink-0" />
                                    <span className="truncate">{file ? file.name : 'Tria un fitxer...'}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={handleDownloadTemplate}
                                  className="shrink-0 bg-secondary border border-border text-foreground font-bold py-3 px-4 rounded-xl hover:bg-secondary/80 transition-all flex items-center justify-center gap-2 shadow-sm"
                                  title="Baixar Plantilla Excel"
                                >
                                  <Icon name="download" />
                                  <span className="hidden sm:inline">Plantilla</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={handleImport}
                            disabled={isImporting || !file}
                            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl disabled:opacity-50 flex items-center justify-center transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]"
                          >
                            {isImporting && <Icon name="progress_activity" className="animate-spin mr-2" />}
                            {isImporting ? 'Processant...' : 'Processar Alumnes'}
                          </button>
                        </div>
                      </>
                    )}

                    {importError && <p className="text-destructive text-sm mt-4 text-center font-medium">{importError}</p>}
                    {importSuccess && <p className="text-primary text-sm mt-4 text-center font-bold animate-in fade-in">{importSuccess}</p>}
                  </>
                ) : (
                  <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl text-accent text-sm text-center">
                    <p className="font-bold">Primer has de crear una classe abans de poder importar alumnes.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 max-w-lg mx-auto">
                {classes.length > 0 ? (
                  <form onSubmit={handleAddStudent} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase px-1">Nom de l'alumne</label>
                      <input type="text" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="Nom de l'alumne" className="w-full bg-secondary border border-border rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary text-foreground" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase px-1">Classe</label>
                        <select value={newStudentClassId} onChange={e => setNewStudentClassId(e.target.value)} className="w-full bg-secondary border border-border rounded-xl py-3 px-4 outline-none text-foreground appearance-none">
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase px-1">Gènere</label>
                        <select value={newStudentGender} onChange={e => setNewStudentGender(e.target.value as any)} className="w-full bg-secondary border border-border rounded-xl py-3 px-4 outline-none text-foreground appearance-none">
                          <option value="nen">Nen</option>
                          <option value="nena">Nena</option>
                          <option value="altre">Altre</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" disabled={isAdding} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]">
                      {isAdding && <Icon name="progress_activity" className="animate-spin mr-2" />}
                      {isAdding ? 'Guardant...' : 'Guardar Alumne'}
                    </button>
                    {addStudentError && <p className="text-destructive text-sm text-center">{addStudentError}</p>}
                    {addStudentSuccess && <p className="text-primary text-sm text-center">{addStudentSuccess}</p>}
                  </form>
                ) : (
                  <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl text-accent text-sm text-center">
                    <p className="font-bold">Primer has de crear una classe.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {mainView === 'classes' && (
        <>
          <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
            <div className="flex bg-secondary p-1 rounded-xl">
              <TabButton active={classTab === 'list'} onClick={() => setClassTab('list')}>Llistat</TabButton>
              <TabButton active={classTab === 'add'} onClick={() => setClassTab('add')}>Afegir Classe</TabButton>
            </div>
            {classTab === 'list' && (
              <div className="flex gap-4">
                <div className="bg-card border border-border px-4 py-2 rounded-lg flex items-center gap-2">
                  <Icon name="groups" className="text-primary" />
                  <span className="text-sm font-semibold">{classes.length} Classes</span>
                </div>
                <div className="bg-card border border-border px-4 py-2 rounded-lg flex items-center gap-2">
                  <Icon name="person" className="text-primary" />
                  <span className="text-sm font-semibold">{students.length} Alumnes</span>
                </div>
              </div>
            )}
          </div>
          <div className="bg-card rounded-xl shadow-sm border border-border">
            {classTab === 'list' ? (
              <ul className="divide-y divide-border">
                {classes.length > 0 ? classes.map(cls => (
                  <li key={cls.id}>
                    <button onClick={() => onViewClass(cls.id)} className="w-full flex items-center gap-4 p-4 hover:bg-secondary transition-colors text-left">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Icon name="groups" className="text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{cls.name}</p>
                        <p className="text-sm text-muted-foreground">{students.filter(s => s.classId === cls.id).length} alumnes</p>
                      </div>
                      <Icon name="chevron_right" className="ml-auto text-muted-foreground" />
                    </button>
                  </li>
                )) : <li className="p-6 text-center text-muted-foreground">No hi ha classes.</li>}
              </ul>
            ) : (
              <div className="p-8 max-w-lg mx-auto">
                <form onSubmit={handleAddClass} className="space-y-4 text-center">
                  <Icon name="create_new_folder" className="text-5xl text-primary mx-auto mb-4" />
                  <input type="text" value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="Nom de la classe" className="w-full bg-secondary border border-border rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary text-foreground" />
                  <button type="submit" disabled={isAddingClass} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center">
                    {isAddingClass && <Icon name="progress_activity" className="animate-spin mr-2" />}
                    {isAddingClass ? 'Creant...' : 'Crear Classe'}
                  </button>
                  {addClassError && <p className="text-destructive text-sm text-center">{addClassError}</p>}
                </form>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
};

export default Alumnes;
