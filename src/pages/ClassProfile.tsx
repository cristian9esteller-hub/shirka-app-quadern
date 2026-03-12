import React, { useState } from 'react';
import Icon from '@/components/Icon';
import type { ClassGroup, Student, Objective } from '@/types';
import { StudentAvatar } from '@/components/StudentAvatar';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

interface ClassProfileProps {
  classGroup: ClassGroup;
  students: Student[];
  onBack: () => void;
  onUpdateClass: (id: string, updates: Partial<ClassGroup>) => void;
  onDeleteClass: (id: string) => void;
  onViewStudent: (studentId: string) => void;
}

const ClassProfile: React.FC<ClassProfileProps> = ({ classGroup, students, onBack, onUpdateClass, onDeleteClass, onViewStudent }) => {
  const classStudents = students.filter(s => s.classId === classGroup.id);
  const [tab, setTab] = useState<'alumnes' | 'objectius'>('alumnes');
  const [newObj, setNewObj] = useState('');
  const [objType, setObjType] = useState<'quarterly' | 'annual'>('quarterly');

  const addObjective = () => {
    if (!newObj.trim()) return;
    const obj: Objective = { id: Date.now().toString(), text: newObj.trim(), completed: false };
    if (objType === 'quarterly') {
      onUpdateClass(classGroup.id, { quarterlyObjectives: [...(classGroup.quarterlyObjectives || []), obj] });
    } else {
      onUpdateClass(classGroup.id, { annualObjectives: [...(classGroup.annualObjectives || []), obj] });
    }
    setNewObj('');
  };

  const toggleObjective = (type: 'quarterly' | 'annual', objId: string) => {
    const list = type === 'quarterly' ? classGroup.quarterlyObjectives : classGroup.annualObjectives;
    const updated = (list || []).map(o => o.id === objId ? { ...o, completed: !o.completed } : o);
    onUpdateClass(classGroup.id, type === 'quarterly' ? { quarterlyObjectives: updated } : { annualObjectives: updated });
  };

  const deleteObjective = (type: 'quarterly' | 'annual', objId: string) => {
    if (!confirm('Eliminar aquest objectiu?')) return;
    const list = type === 'quarterly' ? classGroup.quarterlyObjectives : classGroup.annualObjectives;
    const updated = (list || []).filter(o => o.id !== objId);
    onUpdateClass(classGroup.id, type === 'quarterly' ? { quarterlyObjectives: updated } : { annualObjectives: updated });
  };

  const exportToWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: `Objectius: ${classGroup.name}`,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: "Objectius Anuals",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          ...(classGroup.annualObjectives || []).length > 0
            ? (classGroup.annualObjectives || []).map(obj =>
              new Paragraph({
                text: obj.text,
                bullet: { level: 0 }
              })
            )
            : [new Paragraph({ children: [new TextRun({ text: "Cap objectiu anual definit.", italics: true })] })],

          new Paragraph({
            text: "Objectius Trimestrals",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          ...(classGroup.quarterlyObjectives || []).length > 0
            ? (classGroup.quarterlyObjectives || []).map(obj =>
              new Paragraph({
                text: obj.text,
                bullet: { level: 0 }
              })
            )
            : [new Paragraph({ children: [new TextRun({ text: "Cap objectiu trimestral definit.", italics: true })] })],
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `Objectius_${classGroup.name.replace(/\s+/g, '_')}.docx`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const TabButton = ({ active, onClick, children }: any) => (
    <button onClick={onClick} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${active ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>
      {children}
    </button>
  );

  return (
    <main className="p-4 md:p-8 lg:p-10 w-full overflow-y-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm font-medium">
        <Icon name="arrow_back" className="text-lg" /> Tornar
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <Icon name="groups" className="text-primary text-3xl" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{classGroup.name}</h1>
          <p className="text-muted-foreground">{classStudents.length} alumnes</p>
        </div>
        <button onClick={() => { if (confirm('Eliminar la classe?')) { onDeleteClass(classGroup.id); onBack(); } }}
          className="ml-auto text-muted-foreground hover:text-destructive p-2">
          <Icon name="delete" className="text-xl" />
        </button>
      </div>

      <div className="flex bg-secondary p-1 rounded-xl mb-6 w-fit">
        <TabButton active={tab === 'alumnes'} onClick={() => setTab('alumnes')}>Alumnes</TabButton>
        <TabButton active={tab === 'objectius'} onClick={() => setTab('objectius')}>Objectius</TabButton>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm">
        {tab === 'alumnes' ? (
          <ul className="divide-y divide-border">
            {classStudents.map(s => (
              <li key={s.id}>
                <button onClick={() => onViewStudent(s.id)} className="w-full flex items-center gap-4 p-4 hover:bg-secondary transition-colors text-left">
                  <StudentAvatar student={s} size="md" />
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <Icon name="chevron_right" className="ml-auto text-muted-foreground" />
                </button>
              </li>
            ))}
            {classStudents.length === 0 && <li className="p-6 text-center text-muted-foreground">No hi ha alumnes en aquesta classe.</li>}
          </ul>
        ) : (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4 mb-2">
              <h2 className="text-lg font-bold text-foreground">Gestió d'Objectius</h2>
              <button
                onClick={exportToWord}
                className="flex items-center gap-2 bg-secondary text-foreground px-4 py-2 rounded-xl font-semibold text-sm hover:bg-secondary/80 transition-all border border-border"
              >
                <Icon name="description" className="text-lg" />
                Exportar a Word
              </button>
            </div>

            {/* Add objective */}
            <div className="flex gap-2">
              <input value={newObj} onChange={e => setNewObj(e.target.value)} placeholder="Nou objectiu..."
                className="flex-1 bg-secondary border border-border rounded-xl py-2 px-3 text-sm outline-none text-foreground" />
              <select value={objType} onChange={e => setObjType(e.target.value as any)}
                className="bg-secondary border border-border rounded-xl py-2 px-3 text-sm outline-none text-foreground">
                <option value="quarterly">Trimestral</option>
                <option value="annual">Anual</option>
              </select>
              <button onClick={addObjective} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm">
                Afegir
              </button>
            </div>

            {/* Quarterly */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">Objectius Trimestrals</h3>
              <ul className="space-y-2">
                {(classGroup.quarterlyObjectives || []).map(obj => (
                  <li key={obj.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-secondary">
                    <button onClick={() => toggleObjective('quarterly', obj.id)}>
                      <Icon name={obj.completed ? 'check_circle' : 'radio_button_unchecked'} className={`text-xl ${obj.completed ? 'text-primary' : 'text-muted-foreground'}`} />
                    </button>
                    <span className={`text-sm ${obj.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{obj.text}</span>
                    <button onClick={() => deleteObjective('quarterly', obj.id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1">
                      <Icon name="delete" className="text-lg" />
                    </button>
                  </li>
                ))}
                {(classGroup.quarterlyObjectives || []).length === 0 && <li className="text-sm text-muted-foreground">Cap objectiu trimestral.</li>}
              </ul>
            </div>

            {/* Annual */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">Objectius Anuals</h3>
              <ul className="space-y-2">
                {(classGroup.annualObjectives || []).map(obj => (
                  <li key={obj.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-secondary">
                    <button onClick={() => toggleObjective('annual', obj.id)}>
                      <Icon name={obj.completed ? 'check_circle' : 'radio_button_unchecked'} className={`text-xl ${obj.completed ? 'text-primary' : 'text-muted-foreground'}`} />
                    </button>
                    <span className={`text-sm ${obj.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{obj.text}</span>
                    <button onClick={() => deleteObjective('annual', obj.id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1">
                      <Icon name="delete" className="text-lg" />
                    </button>
                  </li>
                ))}
                {(classGroup.annualObjectives || []).length === 0 && <li className="text-sm text-muted-foreground">Cap objectiu anual.</li>}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default ClassProfile;
