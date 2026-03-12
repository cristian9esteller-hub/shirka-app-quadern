import React, { useState, useMemo } from 'react';
import Icon from '@/components/Icon';
import { useData } from '@/contexts/DataContext';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import SMTPConfigModal from '@/components/SMTPConfigModal';

const Missatgeria: React.FC = () => {
  const { classes, students, sendComunicat, comunicats, loading } = useData();
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [selectionMode, setSelectionMode] = useState<'classe' | 'alumnes'>('classe');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState<{ student: boolean; tutors: boolean }>({
    student: true,
    tutors: true
  });

  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const { profile, updateProfile } = useData();

  const filteredStudents = useMemo(() => {
    return students
      .filter(s => s.classId === selectedClassId)
      .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClassId, searchTerm]);

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !title || !content) {
      setStatus({ type: 'error', message: 'Si us plau, omple tots els camps obligatoris.' });
      return;
    }

    if (selectionMode === 'alumnes' && selectedStudentIds.length === 0) {
      setStatus({ type: 'error', message: 'Selecciona almenys un alumne.' });
      return;
    }

    const recipientList = [];
    if (recipients.student) recipientList.push('alumne');
    if (recipients.tutors) {
      recipientList.push('pare');
      recipientList.push('mare');
    }

    if (recipientList.length === 0) {
      setStatus({ type: 'error', message: 'Selecciona almenys un tipus de destinatari (Alumne o Tutors).' });
      return;
    }

    setIsSending(true);
    setStatus(null);

    try {
      const { error } = await sendComunicat(
        title,
        content,
        selectedClassId,
        recipientList,
        selectionMode === 'alumnes' ? selectedStudentIds : undefined
      );
      if (error) throw error;

      setStatus({ type: 'success', message: 'Comunicat enviat correctament!' });
      setTitle('');
      setContent('');
      if (selectionMode === 'alumnes') setSelectedStudentIds([]);
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Error en enviar el comunicat.' });
    } finally {
      setIsSending(false);
    }
  };

  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto max-w-full overflow-x-hidden bg-white dark:bg-slate-950 scrollbar-hide">
      <main className="p-4 md:p-8 lg:p-10 w-full max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="mail" className="text-2xl" />
            </div>
            <div className="flex flex-col">
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-0.5">Gestió de Comunicats</p>
              <div
                onClick={() => setShowGuide(true)}
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors cursor-pointer group"
              >
                <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight uppercase">Enviaments</h1>
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon name="help" className="text-[10px]" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {showGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Icon name="auto_stories" className="text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Guia de Configuració</h2>
                      <p className="text-muted-foreground text-sm">Configura el teu correu en 1 minut</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGuide(false)}
                    className="p-2 hover:bg-secondary rounded-xl transition-colors"
                  >
                    <Icon name="close" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Punt 1 */}
                  <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Icon name="mail" className="text-lg" />
                      </div>
                      <span className="font-bold text-sm">Punt 1: Professionalitat</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Enviar correus des de Shirka dóna una imatge més professional i evita que els teus comunicats acabin a la carpeta de <strong>Spam</strong>.
                    </p>
                  </div>

                  {/* Punt 2 */}
                  <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Icon name="key" className="text-lg" />
                      </div>
                      <span className="font-bold text-sm">Punt 2: Què és la clau?</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Imagina que Shirka és el <strong>carter</strong> que porta les teves cartes. Per entrar al teu correu, necessita una "clau de pas" especial, <strong>NO la teva contrasenya habitual</strong>.
                    </p>
                  </div>

                  {/* Punt 3 */}
                  <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <Icon name="security" className="text-lg" />
                      </div>
                      <span className="font-bold text-sm">Punt 3: D'on surt la clau?</span>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        La clau te la dóna Google o Outlook a l'apartat de <strong>Seguretat</strong>. No te la inventes tu!
                      </p>
                      <a
                        href="https://support.google.com/accounts/answer/185833?hl=ca"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold hover:opacity-90 transition-all"
                      >
                        <Icon name="smart_display" className="text-xs" />
                        Guia de com fer-ho a Gmail
                      </a>
                    </div>
                  </div>

                  {/* Punt 4 */}
                  <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                        <Icon name="check_circle" className="text-lg" />
                      </div>
                      <span className="font-bold text-sm">Punt 4: Activació</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Un cop posis aquesta clau a la configuració, ja podràs avisar a totes les famílies amb un sol clic. <strong>Fàcil i ràpid!</strong>
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <button
                    onClick={() => setShowGuide(false)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-600/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <Icon name="done_all" />
                    Entès! Anem a configurar el meu correu
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form panel */}
          <div className="lg:col-span-3 bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Icon name="send" />
                </div>
                <h2 className="text-xl font-bold">Nou Comunicat</h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="p-2 bg-secondary/50 border border-border rounded-xl text-muted-foreground hover:text-primary transition-all shadow-sm"
                  title="Configuració SMTP"
                >
                  <Icon name="settings" className="text-xl" />
                </button>
                <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
                  <button
                    onClick={() => setSelectionMode('classe')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectionMode === 'classe' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Tota la classe
                  </button>
                  <button
                    onClick={() => setSelectionMode('alumnes')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectionMode === 'alumnes' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Alumnes seleccionats
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSend} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Grup / Classe</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setSelectedStudentIds([]);
                    }}
                    className="w-full bg-secondary/50 border border-border rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary text-foreground"
                  >
                    <option value="" disabled>Selecciona una classe</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Títol de l'Anunci</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Recordatori excursió"
                    className="w-full bg-secondary/50 border border-border rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              {selectionMode === 'alumnes' && (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Selecciona els Alumnes ({selectedStudentIds.length})</label>
                    <div className="relative">
                      <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                      <input
                        type="text"
                        placeholder="Cerca alumne..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-secondary/30 border border-border rounded-lg py-1.5 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary w-48"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-border/50 rounded-xl bg-secondary/10 custom-scrollbar">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleToggleStudent(s.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${selectedStudentIds.includes(s.id) ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/20' : 'bg-background border-border hover:border-primary/30'}`}
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                            {s.avatar ? <img src={s.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">{s.name[0]}</div>}
                          </div>
                          <span className="text-xs font-medium truncate flex-1">{s.name}</span>
                          {selectedStudentIds.includes(s.id) && <Icon name="check_circle" className="text-primary text-sm" />}
                        </button>
                      ))
                    ) : (
                      <div className="col-span-full py-8 text-center text-xs text-muted-foreground">No s'han trobat alumnes.</div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Contingut del Missatge</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={selectionMode === 'alumnes' ? 3 : 5}
                  placeholder="Escriu aquí el comunicat..."
                  className="w-full bg-secondary/50 border border-border rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary text-foreground resize-none transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1 block">Destinataris del comunicat</label>
                <div className="flex flex-wrap gap-4 pl-1">
                  <label className="flex items-center gap-3 cursor-pointer group bg-secondary/30 px-4 py-2 rounded-xl border border-border hover:border-primary/30 transition-all">
                    <div className={`w-5 h-5 rounded border ${recipients.student ? 'bg-primary border-primary' : 'border-border'} flex items-center justify-center transition-all`}>
                      {recipients.student && <Icon name="check" className="text-[12px] text-white" />}
                      <input type="checkbox" className="hidden" checked={recipients.student} onChange={() => setRecipients(r => ({ ...r, student: !r.student }))} />
                    </div>
                    <span className="text-sm font-bold italic">Email Alumne</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group bg-secondary/30 px-4 py-2 rounded-xl border border-border hover:border-primary/30 transition-all">
                    <div className={`w-5 h-5 rounded border ${recipients.tutors ? 'bg-primary border-primary' : 'border-border'} flex items-center justify-center transition-all`}>
                      {recipients.tutors && <Icon name="check" className="text-[12px] text-white" />}
                      <input type="checkbox" className="hidden" checked={recipients.tutors} onChange={() => setRecipients(r => ({ ...r, tutors: !r.tutors }))} />
                    </div>
                    <span className="text-sm font-bold">Tutors (Pare/Mare)</span>
                  </label>
                </div>
              </div>

              {status && (
                <div className={`p-4 rounded-xl text-sm font-medium animate-in zoom-in-95 duration-200 ${status.type === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSending || loading}
                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSending ? <Icon name="progress_activity" className="animate-spin" /> : <Icon name="send" />}
                {isSending ? 'Enviant...' : selectionMode === 'classe' ? 'Enviar a tota la classe' : `Enviar a ${selectedStudentIds.length} alumnes`}
              </button>
            </form>
          </div>

          {/* History panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Icon name="history" className="text-muted-foreground" />
                Historial de Comunicats
              </h3>
              <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-1 rounded-md uppercase">{comunicats.length} enviats</span>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[850px] pr-2 custom-scrollbar">
              {comunicats.length > 0 ? (
                comunicats.map((c) => (
                  <div key={c.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-1 rounded-md tracking-wider w-fit">
                          {classes.find(cl => cl.id === c.classId)?.name || 'Classe eliminada'}
                        </span>
                        {c.studentIds && c.studentIds.length > 0 && (
                          <span className="text-[9px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded-md w-fit border border-amber-100">
                            {c.studentIds.length} alumnes seleccionats
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {format(new Date(c.createdAt), "d 'de' MMM, HH:mm", { locale: ca })}
                      </span>
                    </div>
                    <h4 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors text-sm">{c.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3 italic">"{c.content}"</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.recipients.map(r => (
                        <span key={r} className="text-[9px] font-bold bg-secondary/50 text-secondary-foreground py-0.5 px-2 rounded-md border border-border/50 uppercase">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-secondary/10 border border-dashed border-border rounded-2xl p-12 text-center">
                  <Icon name="chat_bubble_outline" className="text-4xl text-muted-foreground mb-3 opacity-10" />
                  <p className="text-muted-foreground text-xs font-medium">Encara no hi ha cap comunicat enviat.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <SMTPConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          settings={profile.smtpSettings}
          onSave={(settings) => updateProfile({ smtpSettings: settings })}
        />
      </main>
    </div>
  );
};

export default Missatgeria;
