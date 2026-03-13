
import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { UserProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUpdateUser: (user: UserProfile) => void;
  currentTheme: string;
  onChangeTheme: (theme: string) => void;
  subjects: string[];
  setSubjects: React.Dispatch<React.SetStateAction<string[]>>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onUpdateUser, currentTheme, onChangeTheme, subjects, setSubjects }) => {
  const [localUser, setLocalUser] = useState<UserProfile | null>(user);
  const [newSubject, setNewSubject] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalUser(user);
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const avatarDataUrl = event.target?.result as string;
        setLocalUser(prev => prev ? { ...prev, avatar: avatarDataUrl } : null);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = () => {
    if (localUser) {
      onUpdateUser(localUser);
    }
    onClose();
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubject.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects([...subjects, trimmed]);
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    if (confirm(`Segur que vols eliminar "${subjectToRemove}"? Les dades guardades no s'esborraran, però ja no apareixerà als selectors.`)) {
      setSubjects(subjects.filter(s => s !== subjectToRemove));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Icon name="settings" className="text-primary" /> Configuració
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <Icon name="close" />
          </button>
        </header>

        <main className="p-6 space-y-8 overflow-y-auto">
          {/* Perfil */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Perfil del Professor</h3>
            <div className="flex items-center gap-6">
              <div className="relative group shrink-0">
                <img src={localUser?.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800 shadow-md"/>
                <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icon name="photo_camera" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              </div>
              <div className="space-y-4 flex-1">
                <input 
                  type="text" 
                  value={localUser?.name || ''} 
                  onChange={e => setLocalUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Nom i cognoms"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                />
                <input 
                  type="text" 
                  value={localUser?.role || ''} 
                  onChange={e => setLocalUser(prev => prev ? { ...prev, role: e.target.value } : null)}
                  placeholder="Classe / Rol"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </section>

          {/* Gestió de Matèries */}
          <section className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Icon name="library_books" className="text-primary" /> Gestionar Matèries
            </h3>
            <form onSubmit={handleAddSubject} className="flex gap-2 mb-4">
                <input 
                    type="text"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    placeholder="Nova assignatura..."
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-xl font-bold shadow-sm">
                    <Icon name="add" />
                </button>
            </form>
            <div className="flex flex-wrap gap-2">
                {subjects.map(subject => (
                    <div key={subject} className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg shadow-sm">
                        <span className="text-xs font-medium">{subject}</span>
                        <button onClick={() => handleRemoveSubject(subject)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <Icon name="close" className="text-xs" />
                        </button>
                    </div>
                ))}
            </div>
          </section>

          {/* Tema */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Tema de l'Aplicació</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => onChangeTheme('verd')} className={`p-4 rounded-xl border-2 transition-all text-left ${currentTheme === 'verd' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold">Verd Shirka</span>
                  {currentTheme === 'verd' && <Icon name="check_circle" className="text-primary"/>}
                </div>
                <div className="flex gap-2 h-8">
                  <div className="w-1/4 rounded bg-[#19e65e]"></div>
                  <div className="w-1/4 rounded bg-[#112116]"></div>
                  <div className="w-1/4 rounded bg-slate-200"></div>
                </div>
              </button>

              <button onClick={() => onChangeTheme('foc')} className={`p-4 rounded-xl border-2 transition-all text-left ${currentTheme === 'foc' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold">Taronja Foc</span>
                  {currentTheme === 'foc' && <Icon name="check_circle" className="text-primary"/>}
                </div>
                <div className="flex gap-2 h-8">
                  <div className="w-1/4 rounded bg-[#f97316]"></div>
                  <div className="w-1/4 rounded bg-[#1c1917]"></div>
                  <div className="w-1/4 rounded bg-slate-200"></div>
                </div>
              </button>
            </div>
          </section>
        </main>

        <footer className="p-6 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button onClick={handleSave} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
            GUARDAR CONFIGURACIÓ
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;
