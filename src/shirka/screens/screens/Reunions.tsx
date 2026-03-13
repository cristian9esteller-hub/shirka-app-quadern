
import React, { useState, useMemo, useEffect } from 'react';
import Icon from '../components/Icon';
import { Meeting, MeetingType, Student } from '../types';

interface ReunionsProps {
  meetings: Meeting[];
  setMeetings: React.Dispatch<React.SetStateAction<Meeting[]>>;
  students: Student[];
}

const MEETING_TYPES: MeetingType[] = ['Tutoria Família', 'Claustre', 'Nivell', 'Coordinació', 'Altres'];

const Reunions: React.FC<ReunionsProps> = ({ meetings, setMeetings, students }) => {
  const [activeMainTab, setActiveMainTab] = useState<'familia' | 'centre'>('familia');
  const [filterStatus, setFilterStatus] = useState<'pendents' | 'realitzades'>('pendents');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    time: '17:00',
    location: 'Escola (Presencial)',
    type: 'Tutoria Família' as MeetingType,
    discussion: '',
    agreements: '',
    isRecurring: false,
    dayOfWeek: 1,
  });
  
  useEffect(() => {
    // Si canviem a pestanya de centre i no estem editant, el tipus per defecte no pot ser familia
    if (!editingMeetingId) {
        if (activeMainTab === 'centre' && formData.type === 'Tutoria Família') {
            setFormData(prev => ({ ...prev, type: 'Claustre' }));
        } else if (activeMainTab === 'familia' && formData.type !== 'Tutoria Família') {
            setFormData(prev => ({ ...prev, type: 'Tutoria Família' }));
        }
    }
  }, [activeMainTab, editingMeetingId]);

  const filteredMeetings = useMemo(() => {
    return meetings
      .filter(m => {
          const isFamily = m.type === 'Tutoria Família';
          if (activeMainTab === 'familia') {
              return isFamily && (filterStatus === 'pendents' ? !m.completed : m.completed);
          } else {
              return !isFamily;
          }
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`).getTime();
        const dateB = new Date(`${b.date}T${b.time}`).getTime();
        return (activeMainTab === 'familia' && filterStatus === 'pendents') ? dateA - dateB : dateB - dateA;
      });
  }, [meetings, activeMainTab, filterStatus]);

  const handleSaveMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMeetingId) {
        setMeetings(prev => prev.map(m => m.id === editingMeetingId ? {
            ...m,
            title: formData.title,
            studentId: formData.type === 'Tutoria Família' ? formData.studentId : undefined,
            date: formData.date,
            time: formData.time,
            location: formData.location,
            type: formData.type,
            discussion: formData.discussion,
            agreements: formData.agreements,
            recurring: formData.isRecurring ? { dayOfWeek: formData.dayOfWeek } : undefined,
        } : m));
    } else {
        const meetingId = Date.now().toString();
        const newMeeting: Meeting = {
          id: meetingId,
          title: formData.title,
          studentId: formData.type === 'Tutoria Família' ? formData.studentId : undefined,
          date: formData.date,
          time: formData.time,
          location: formData.location,
          type: formData.type,
          discussion: formData.discussion,
          agreements: formData.agreements,
          completed: false,
          recurring: formData.isRecurring ? { dayOfWeek: formData.dayOfWeek } : undefined,
        };
        setMeetings(prev => [...prev, newMeeting]);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleEditClick = (meeting: Meeting) => {
      setEditingMeetingId(meeting.id);
      setFormData({
          title: meeting.title,
          studentId: meeting.studentId || '',
          date: meeting.date,
          time: meeting.time,
          location: meeting.location,
          type: meeting.type,
          discussion: meeting.discussion,
          agreements: meeting.agreements,
          isRecurring: !!meeting.recurring,
          dayOfWeek: meeting.recurring?.dayOfWeek || 1,
      });
      setIsModalOpen(true);
  };

  const resetForm = () => {
      setEditingMeetingId(null);
      setFormData({
        title: '',
        studentId: '',
        date: new Date().toISOString().split('T')[0],
        time: '17:00',
        location: 'Escola (Presencial)',
        type: activeMainTab === 'familia' ? 'Tutoria Família' : 'Claustre',
        discussion: '',
        agreements: '',
        isRecurring: false,
        dayOfWeek: 1,
    });
  }

  const toggleComplete = (id: string) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
  };

  const deleteMeeting = (id: string) => {
    if (confirm('Segur que vols anul·lar/eliminar aquesta reunió? Aquesta acció no es pot desfer.')) {
      setMeetings(prev => prev.filter(m => m.id !== id));
    }
  };

  const getTypeColor = (type: MeetingType) => {
    switch (type) {
      case 'Tutoria Família': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'Claustre': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
      case 'Nivell': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
      case 'Coordinació': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    }
  };

  const getStudentName = (id?: string) => students.find(s => s.id === id)?.name || "Alumne no especificat";

  const MeetingCard: React.FC<{meeting: Meeting}> = ({ meeting }) => (
    <div className={`bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-sm border ${meeting.completed ? 'border-slate-200 dark:border-slate-800' : 'border-primary/30 dark:border-primary/20'} flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group/card`}>
        {!meeting.completed && <div className="absolute top-0 right-0 w-2 h-full bg-primary/20"></div>}
        
        <div className="flex justify-between items-start mb-4">
            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getTypeColor(meeting.type)}`}>
            {meeting.type}
            </span>
            <div className="flex gap-1">
            <button 
                onClick={() => toggleComplete(meeting.id)} 
                className={`p-1.5 rounded-lg transition-colors ${meeting.completed ? 'text-primary bg-primary/10' : 'text-slate-300 hover:text-primary hover:bg-primary/5'}`}
                title={meeting.completed ? "Marcar com a pendent" : "Marcar com a realitzada"}
            >
                <Icon name={meeting.completed ? "check_circle" : "radio_button_unchecked"} />
            </button>
            <button 
                onClick={() => handleEditClick(meeting)} 
                className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors"
                title="Modificar dades"
            >
                <Icon name="edit" type="outlined" />
            </button>
            <button 
                onClick={() => deleteMeeting(meeting.id)} 
                className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                title="Anul·lar reunió"
            >
                <Icon name="delete" type="outlined" />
            </button>
            </div>
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{meeting.title || (meeting.type === 'Tutoria Família' ? 'Entrevista Família' : meeting.type)}</h3>
        
        {meeting.type === 'Tutoria Família' && (
            <div className="flex items-center gap-2 mb-4 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                <img src={students.find(s => s.id === meeting.studentId)?.avatar || "https://picsum.photos/seed/default/100/100"} className="w-6 h-6 rounded-full object-cover" alt="" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{getStudentName(meeting.studentId)}</p>
            </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <Icon name="calendar_today" className="text-sm text-primary" /> 
                {new Date(meeting.date).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <Icon name="schedule" className="text-sm text-primary" /> {meeting.time}h
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium col-span-2 truncate">
                <Icon name="location_on" className="text-sm text-primary" /> {meeting.location}
            </div>
        </div>

        {(meeting.discussion || meeting.agreements) && (
            <div className="mt-2 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                {meeting.discussion && (
                    <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Temes Tractats</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-3">{meeting.discussion}</p>
                    </div>
                )}
                {meeting.agreements && (
                    <div className="bg-primary/5 dark:bg-primary/10 p-2.5 rounded-lg border border-primary/10">
                        <h4 className="text-[10px] font-bold text-primary uppercase mb-1">Acords</h4>
                        <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-medium line-clamp-3">{meeting.agreements}</p>
                    </div>
                )}
            </div>
        )}
        
        {meeting.recurring && (
            <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 w-fit px-2 py-0.5 rounded-full">
                <Icon name="sync" className="text-xs" /> RECURRENTE
            </div>
        )}
    </div>
  );

  return (
    <main className="p-4 md:p-8 lg:p-10 w-full bg-background-light dark:bg-background-dark min-h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Registre de Reunions</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gestió de tutories i reunions d'equip docent.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white dark:text-slate-900 px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
        >
          <Icon name="add_circle" /> Nova Reunió
        </button>
      </header>

      {/* Main Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit mb-8 shadow-inner">
        <button 
          onClick={() => { setActiveMainTab('familia'); setFilterStatus('pendents'); }}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeMainTab === 'familia' ? 'bg-white dark:bg-surface-dark text-primary shadow-md' : 'text-slate-500'}`}
        >
          <Icon name="family_restroom" className="text-lg" />
          Tutories Família
        </button>
        <button 
          onClick={() => setActiveMainTab('centre')}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeMainTab === 'centre' ? 'bg-white dark:bg-surface-dark text-primary shadow-md' : 'text-slate-500'}`}
        >
          <Icon name="school" className="text-lg" />
          Reunions de Centre
        </button>
      </div>

      {activeMainTab === 'familia' && (
          <div className="space-y-6">
              <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 mb-6">
                  <button 
                    onClick={() => setFilterStatus('pendents')}
                    className={`pb-3 px-4 text-sm font-bold transition-all relative ${filterStatus === 'pendents' ? 'text-primary' : 'text-slate-400'}`}
                  >
                      Pendents ({meetings.filter(m => m.type === 'Tutoria Família' && !m.completed).length})
                      {filterStatus === 'pendents' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>}
                  </button>
                  <button 
                    onClick={() => setFilterStatus('realitzades')}
                    className={`pb-3 px-4 text-sm font-bold transition-all relative ${filterStatus === 'realitzades' ? 'text-primary' : 'text-slate-400'}`}
                  >
                      Realitzades ({meetings.filter(m => m.type === 'Tutoria Família' && m.completed).length})
                      {filterStatus === 'realitzades' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>}
                  </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredMeetings.length > 0 ? filteredMeetings.map(meeting => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                )) : (
                  <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-white dark:bg-surface-dark rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <Icon name={filterStatus === 'pendents' ? "event_upcoming" : "history"} className="text-6xl mb-4 text-slate-200" />
                    <p className="text-xl font-bold text-slate-400">No hi ha {filterStatus === 'pendents' ? 'reunions pendents' : 'registres de reunions'}</p>
                    <p className="text-sm text-slate-400 mt-1">Les tutories finalitzades apareixen també a la fitxa de l'alumne.</p>
                  </div>
                )}
              </div>
          </div>
      )}

      {activeMainTab === 'centre' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredMeetings.length > 0 ? filteredMeetings.map(meeting => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                )) : (
                  <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-white dark:bg-surface-dark rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <Icon name="history_edu" className="text-6xl mb-4 text-slate-200" />
                    <p className="text-xl font-bold text-slate-400">Encara no has registrat cap reunió de centre</p>
                    <p className="text-sm text-slate-400 mt-1">Registra aquí claustres, reunions de nivell i coordinacions.</p>
                  </div>
                )}
            </div>
          </div>
      )}


      {/* Modal Nova/Editar Reunió */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <form onSubmit={handleSaveMeeting} className="flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Icon name={editingMeetingId ? "edit" : "add_task"} className="text-primary" /> 
                  {editingMeetingId ? 'Modificar' : 'Nova'} Reunió {activeMainTab === 'familia' ? 'Família' : 'de Centre'}
                </h2>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2">
                  <Icon name="close" />
                </button>
              </div>
              
              <div className="p-6 space-y-5 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tipus</label>
                        <select 
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value as MeetingType})}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary font-medium"
                        >
                            {activeMainTab === 'familia' ? (
                                <option value="Tutoria Família">Tutoria Família</option>
                            ) : (
                                MEETING_TYPES.filter(t => t !== 'Tutoria Família').map(t => <option key={t} value={t}>{t}</option>)
                            )}
                        </select>
                    </div>
                    {activeMainTab === 'familia' && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Alumne</label>
                            <select 
                                required
                                value={formData.studentId}
                                onChange={e => setFormData({...formData, studentId: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary font-medium"
                            >
                                <option value="">Selecciona Alumne</option>
                                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                    {(activeMainTab === 'centre' || editingMeetingId) && (
                         <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Títol</label>
                            <input 
                                type="text" 
                                required
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none font-medium"
                                placeholder="Ex: Seguiment Projecte"
                            />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data</label>
                        <input 
                            type="date" required value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Hora</label>
                        <input 
                            type="time" required value={formData.time}
                            onChange={e => setFormData({...formData, time: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Lloc / Enllaç</label>
                  <input 
                    type="text" value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ex: Sala de professors, Meet, Trucada..."
                  />
                </div>
                
                {(activeMainTab === 'centre' || editingMeetingId) && (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <input
                            type="checkbox"
                            id="isRecurring"
                            checked={formData.isRecurring}
                            onChange={e => setFormData({ ...formData, isRecurring: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="isRecurring" className="flex-1 text-sm font-bold text-slate-700 dark:text-slate-300">Repetir cada setmana</label>
                        {formData.isRecurring && (
                            <select
                                value={formData.dayOfWeek}
                                onChange={e => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="1">Dl</option>
                                <option value="2">Dt</option>
                                <option value="3">Dc</option>
                                <option value="4">Dj</option>
                                <option value="5">Dv</option>
                            </select>
                        )}
                    </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Temes Tractats</label>
                  <textarea 
                    value={formData.discussion}
                    onChange={e => setFormData({...formData, discussion: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary min-h-[100px] text-sm"
                    placeholder="Què s'ha parlat a la reunió..."
                  />
                </div>
                 <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 text-primary">Acords i Decisions</label>
                  <textarea 
                    value={formData.agreements}
                    onChange={e => setFormData({...formData, agreements: e.target.value})}
                    className="w-full bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary min-h-[80px] text-sm font-medium"
                    placeholder="Quins compromisos s'han pres..."
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-4 shrink-0 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                >
                  CANCEL·LAR
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  {editingMeetingId ? 'GUARDAR CANVIS' : 'AFEGIR REUNIÓ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Reunions;
