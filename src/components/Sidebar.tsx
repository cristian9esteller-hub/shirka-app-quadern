import Icon from '@/components/Icon';
import { Screen } from '@/types';
import { useData } from '@/contexts/DataContext';
import { useState } from 'react';
import { getProfessorAvatar, PREDEFINED_AVATARS } from '@/lib/avatar-utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
  onSignOut: () => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const JUNK_SUBJECTS = [
  "r", "a", "sdas", "sdasdadfds",
  "situacio d'aprenentatge", "situació d'aprenentatge",
  "situacio d'aprenentage", "situació d'aprenentage",
  "sdasdadfds "
];

const filterSubjects = (subs: string[]) => {
  return subs.filter(s => {
    const lower = s.toLowerCase().trim();
    return lower !== '' && !JUNK_SUBJECTS.includes(lower);
  });
};

import { getSubjectColor } from '@/lib/subject-utils';

const NavItem: React.FC<{
  screen: Screen;
  icon: string;
  label: string;
  activeScreen: Screen;
  onClick: (screen: Screen) => void;
  collapsed: boolean;
  badge?: number;
}> = ({ screen, icon, label, activeScreen, onClick, collapsed, badge }) => {
  const isActive = activeScreen === screen;
  return (
    <button
      onClick={() => onClick(screen)}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors group ${isActive
        ? 'bg-primary/20 text-primary'
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        }`}
    >
      <Icon name={icon} className={`text-xl shrink-0 ${isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'}`} />
      {!collapsed && <span className="flex-1 text-left text-sm">{label}</span>}
      {!collapsed && badge && (
        <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentScreen, setScreen, onSignOut, collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const {
    profile,
    classes,
    updateProfile: onUpdateProfile,
    updateClass: onUpdateClass,
    addClass: onAddClass,
    deleteClass: onDeleteClass,
    resetAllData,
    exportAllData,
    importAllData
  } = useData();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editAvatar, setEditAvatar] = useState(profile.avatar);
  const [editGender, setEditGender] = useState(profile.gender || 'other');
  const [editProfileSubjects, setEditProfileSubjects] = useState<string[]>(filterSubjects(profile.subjects));
  const [editClassSubjects, setEditClassSubjects] = useState<Record<string, string[]>>({});
  const [newSubject, setNewSubject] = useState('');
  const [newProfileSubject, setNewProfileSubject] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [importPayload, setImportPayload] = useState<any>(null);

  const handleSaveProfile = async () => {
    if (onUpdateProfile) {
      const cleanSubjects = filterSubjects(editProfileSubjects);

      onUpdateProfile({
        name: editName,
        avatar: editAvatar,
        gender: editGender as any,
        subjects: cleanSubjects
      });
    }

    // Save class subjects
    if (onUpdateClass) {
      for (const [classId, subjects] of Object.entries(editClassSubjects)) {
        await onUpdateClass(classId, { subjects });
      }
    }

    setIsEditDialogOpen(false);
  };

  const openEditDialog = () => {
    setEditName(profile.name);
    setEditAvatar(profile.avatar);
    setEditGender(profile.gender || 'other');
    setEditProfileSubjects(filterSubjects(profile.subjects));

    // Initialize class subjects from classes prop
    const initialClassSubjects: Record<string, string[]> = {};
    classes.forEach(c => {
      initialClassSubjects[c.id] = c.subjects || [];
    });
    setEditClassSubjects(initialClassSubjects);

    setIsEditDialogOpen(true);
  };

  const handleAddProfileSubject = () => {
    if (!newProfileSubject.trim()) return;
    if (!editProfileSubjects.includes(newProfileSubject.trim())) {
      setEditProfileSubjects(prev => [...prev, newProfileSubject.trim()]);
    }
    setNewProfileSubject('');
  };

  const handleRemoveProfileSubject = (sub: string) => {
    setEditProfileSubjects(prev => prev.filter(s => s !== sub));
  };

  const handleAddSubjectToClass = (classId: string, subject: string) => {
    if (!subject.trim()) return;
    const current = editClassSubjects[classId] || [];
    if (!current.includes(subject)) {
      setEditClassSubjects(prev => ({
        ...prev,
        [classId]: [...current, subject]
      }));
    }
    setNewSubject('');
  };

  const handleRemoveSubjectFromClass = (classId: string, subject: string) => {
    const current = editClassSubjects[classId] || [];
    setEditClassSubjects(prev => ({
      ...prev,
      [classId]: current.filter(s => s !== subject)
    }));
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim() || !onAddClass) return;
    setIsAddingClass(true);
    await onAddClass(newClassName.trim());
    setNewClassName('');
    setIsAddingClass(false);
  };

  const handleDeleteClass = async (id: string) => {
    if (!onDeleteClass) return;
    if (confirm('Estàs segur que vols eliminar aquesta classe? Es perdran totes les dades associades.')) {
      await onDeleteClass(id);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = async () => {
    if (!exportAllData) return;
    const data = await exportAllData();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shirka_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleImportClick = () => {
    document.getElementById('import-upload')?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const payload = JSON.parse(content);
          setImportPayload(payload);
          setIsImportConfirmOpen(true);
        } catch (err) {
          toast.error('Format de fitxer no vàlid');
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (importPayload && importAllData) {
      await importAllData(importPayload);
      setIsImportConfirmOpen(false);
      setImportPayload(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleResetCourse = async () => {
    if (resetConfirm === 'BORRAR' && resetAllData) {
      await resetAllData();
      setIsResetDialogOpen(false);
      setResetConfirm('');
      setIsEditDialogOpen(false);
    }
  };

  const handleNavClick = (screen: Screen) => {
    setScreen(screen);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <aside className={`h-screen flex flex-col bg-card border-r border-border transition-all duration-300 shrink-0 ${collapsed ? 'w-[72px]' : 'w-64'}`}>
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <button
          onClick={() => setScreen(Screen.Dashboard)}
          className={`flex items-center gap-3 transition-opacity hover:opacity-80 ${collapsed ? 'mx-auto' : ''}`}
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shrink-0 shadow-lg shadow-primary/20">
            S
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight text-foreground whitespace-nowrap">
              SHIRKA <span className="font-normal opacity-70">quadern</span>
            </span>
          )}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-muted-foreground hover:text-foreground shrink-0 hidden md:block"
        >
          <Icon name={collapsed ? 'chevron_right' : 'chevron_left'} className="text-xl" />
        </button>
        {/* Close button for mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto text-muted-foreground hover:text-foreground shrink-0 md:hidden"
        >
          <Icon name="close" className="text-xl" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto">
        <NavItem screen={Screen.Dashboard} icon="dashboard" label="Tauler" activeScreen={currentScreen} onClick={handleNavClick} collapsed={collapsed} />
        <NavItem screen={Screen.Alumnes} icon="school" label="Alumnes" activeScreen={currentScreen} onClick={handleNavClick} collapsed={collapsed} />
        <NavItem screen={Screen.Avaluacio} icon="assignment" label="Avaluació" activeScreen={currentScreen} onClick={handleNavClick} collapsed={collapsed} />
        <NavItem screen={Screen.Calendari} icon="calendar_month" label="Calendari" activeScreen={currentScreen} onClick={handleNavClick} collapsed={collapsed} />
        <NavItem screen={Screen.Assistencia} icon="fact_check" label="Assistència" activeScreen={currentScreen} onClick={handleNavClick} collapsed={collapsed} />
        <NavItem screen={Screen.Reunions} icon="groups_3" label="Reunions" activeScreen={currentScreen} onClick={handleNavClick} collapsed={collapsed} />
        <NavItem screen={Screen.Missatgeria} icon="forum" label="Missatgeria" activeScreen={currentScreen} onClick={handleNavClick} collapsed={collapsed} />
        <NavItem screen={Screen.Llibreta} icon="description" label="La meva Llibreta" activeScreen={currentScreen} onClick={handleNavClick} collapsed={collapsed} />
      </nav>

      {/* User & Logout */}
      <div className="p-3 mt-auto space-y-2 border-t border-border">
        <button
          onClick={onSignOut}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-destructive hover:bg-destructive/10 transition-colors text-sm ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Tancar Sessió' : undefined}
        >
          <Icon name="logout" className="text-destructive text-lg shrink-0" />
          {!collapsed && <span>Tancar Sessió</span>}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`bg-secondary p-3 rounded-xl flex items-center gap-3 w-full hover:bg-secondary/80 transition-colors ${collapsed ? 'justify-center' : ''}`}>
              <div className="p-0.5 rounded-full border-2 border-border bg-background shadow-sm shrink-0">
                <img
                  alt="Perfil"
                  className="w-8 h-8 rounded-full object-cover"
                  src={profile.avatar || getProfessorAvatar(profile.name, profile.gender)}
                />
              </div>
              {!collapsed && (
                <div className="overflow-hidden text-left">
                  <p className="text-xs font-semibold truncate leading-tight text-foreground">{profile.name || 'Usuari'}</p>
                  <p className="text-[10px] text-muted-foreground truncate leading-tight">{profile.role || 'Sense rol'}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {profile.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={openEditDialog}>
              <Icon name="edit" className="mr-2 h-4 w-4" />
              <span>Editar perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavClick(Screen.PrivacyPolicy)}>
              <Icon name="policy" className="mr-2 h-4 w-4" />
              <span>Privadesa</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden flex flex-col max-h-[90vh] bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold tracking-tight">El Teu Perfil</DialogTitle>
            <DialogDescription className="text-muted-foreground/80">
              Personalitza la teva experiència i organitza les teves classes de forma eficient.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Secció Perfil */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Configuració Personal</h3>
              </div>

              <div className="bg-secondary/20 p-6 rounded-[2.5rem] border border-border/40 transition-all hover:bg-secondary/30 relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                  {/* Avatar Column */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative group shrink-0">
                      <div className="p-1 rounded-full border-2 border-primary ring-8 ring-primary/5 shadow-xl shrink-0 transition-transform group-hover:scale-105 duration-300">
                        <img
                          src={editAvatar || getProfessorAvatar(editName, editGender)}
                          alt="Preview"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon name="photo_camera" className="text-white text-xl" />
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/5 rounded-full"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      Canviar Foto
                    </Button>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Info Column */}
                  <div className="flex-1 w-full space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Nom Complet</Label>
                      <Input
                        id="name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="El teu nom..."
                        className="rounded-2xl bg-background/50 border-border/50 focus:ring-primary/20 h-11 font-bold text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Gènere / Prefix</Label>
                      <Select value={editGender} onValueChange={setEditGender as any}>
                        <SelectTrigger id="gender" className="rounded-2xl bg-background/50 border-border/50 focus:ring-primary/20 h-11 font-medium">
                          <SelectValue placeholder="Selecciona gènere" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border/50 shadow-2xl">
                          <SelectItem value="female" className="rounded-xl">Científica / Professora 👩‍🏫</SelectItem>
                          <SelectItem value="male" className="rounded-xl">Científic / Professor 👨‍🏫</SelectItem>
                          <SelectItem value="other" className="rounded-xl">Altre / Neutre 🧑‍🏫</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                </div>
              </div>

              {/* Secció Seguretat i Dades */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Seguretat i Dades</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-secondary/20 p-5 rounded-[2rem] border border-border/40 hover:bg-secondary/30 transition-all space-y-3">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Icon name="cloud_download" className="text-lg" />
                      </div>
                      <h4 className="text-sm font-bold">Còpia de Seguretat</h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Descarrega tota la teva informació en un fitxer JSON per tenir una còpia local.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl h-9 text-xs font-bold border-blue-500/20 text-blue-500 hover:bg-blue-500/5 hover:border-blue-500/30"
                      onClick={handleExport}
                    >
                      <Icon name="download" className="mr-2 h-3.5 w-3.5" />
                      Exportar Dades
                    </Button>
                  </div>

                  <div className="bg-secondary/20 p-5 rounded-[2rem] border border-border/40 hover:bg-secondary/30 transition-all space-y-3">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Icon name="cloud_upload" className="text-lg" />
                      </div>
                      <h4 className="text-sm font-bold">Restaurar Dades</h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Puja un fitxer de còpia creat prèviament per restaurar tot el curs.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl h-9 text-xs font-bold border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5 hover:border-emerald-500/30"
                      onClick={handleImportClick}
                    >
                      <Icon name="upload" className="mr-2 h-3.5 w-3.5" />
                      Importar Dades
                    </Button>
                    <input
                      id="import-upload"
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="bg-destructive/5 p-5 rounded-[2rem] border border-destructive/20 hover:bg-destructive/10 transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-destructive">
                        <Icon name="warning" className="text-lg" />
                        <h4 className="text-sm font-bold">Reinici de Curs</h4>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Aquesta acció esborrarà **totes** les dades (alumnes, notes, calendari...) i no es pot desfer.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setIsResetDialogOpen(true)}
                      className="rounded-xl h-10 px-6 font-bold shadow-lg shadow-destructive/20 active:scale-[0.98] transition-all"
                    >
                      Borrar Tot
                    </Button>
                  </div>
                </div>
              </div>

              {/* Matèries Globals */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Matèries Globals</h3>
                </div>
                <div className="bg-secondary/30 p-5 rounded-[2rem] border border-border/40 space-y-4 transition-all hover:bg-secondary/40">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editProfileSubjects.map((sub, i) => {
                      const colors = getSubjectColor(sub, i);
                      return (
                        <span
                          key={sub}
                          className={`inline-flex items-center gap-1.5 ${colors.bg} ${colors.text} text-[11px] font-black px-4 py-1.5 rounded-2xl border ${colors.border} shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-md cursor-default`}
                        >
                          {sub}
                          <button
                            onClick={() => handleRemoveProfileSubject(sub)}
                            className="ml-1 hover:text-destructive transition-colors rounded-full hover:bg-destructive/10 p-0.5"
                          >
                            <Icon name="close" className="text-[14px]" />
                          </button>
                        </span>
                      );
                    })}
                    {editProfileSubjects.length === 0 && (
                      <p className="text-xs text-muted-foreground italic px-2">No hi ha matèries al perfil.</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nova matèria global (ex: Matemàtiques)..."
                      value={newProfileSubject}
                      onChange={(e) => setNewProfileSubject(e.target.value)}
                      className="rounded-2xl bg-background/50 border-border/50 focus:ring-primary/20 h-10"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddProfileSubject();
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddProfileSubject}
                      className="rounded-2xl h-10 px-6 font-bold shadow-lg shadow-primary/10 active:scale-[0.98] transition-all"
                    >
                      Afegir
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic border-t border-border/10 pt-3 mt-2">
                    * Aquestes són les matèries "originals" que apareixeran com a opcions quan creis activitats o configuris noves classes.
                  </p>
                </div>
              </div>

              {/* Secció Classes */}
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Classes i Matèries</h3>
                  </div>
                  {!isAddingClass && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-primary hover:text-primary hover:bg-primary/10 rounded-full text-xs font-bold px-4"
                      onClick={() => setIsAddingClass(true)}
                    >
                      <Icon name="add" className="mr-1 h-3 w-3" />
                      Afegir Classe
                    </Button>
                  )}
                </div>

                {isAddingClass && (
                  <div className="flex gap-2 bg-primary/5 p-4 rounded-3xl border border-primary/20 animate-in slide-in-from-top-4 duration-300">
                    <Input
                      placeholder="Nom de la classe (ex: 4t Primària)"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="h-10 rounded-2xl bg-background border-primary/20 ring-primary/10"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateClass();
                        if (e.key === 'Escape') setIsAddingClass(false);
                      }}
                    />
                    <Button size="sm" onClick={handleCreateClass} className="h-10 px-5 rounded-2xl font-bold shadow-lg shadow-primary/20">Crear</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsAddingClass(false)} className="h-10 w-10 p-0 rounded-2xl hover:bg-destructive/10 hover:text-destructive transition-colors">
                      <Icon name="close" />
                    </Button>
                  </div>
                )}

                <div className="space-y-5 pr-1">
                  {classes.map((cls) => (
                    <div key={cls.id} className="p-5 bg-secondary/15 rounded-[2.5rem] border border-border/30 shadow-sm space-y-4 transition-all hover:bg-secondary/20 hover:border-primary/20 group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125" />

                      <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-3 font-bold text-lg tracking-tight">
                          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <Icon name="groups" className="text-xl" />
                          </div>
                          {cls.name}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClass(cls.id)}
                          className="h-9 w-9 p-0 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                          title="Eliminar Classe"
                        >
                          <Icon name="delete" className="text-lg" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 min-h-[40px] relative z-10">
                        {(editClassSubjects[cls.id] || []).map(sub => {
                          const globalIndex = profile.subjects.indexOf(sub);
                          const colors = getSubjectColor(sub, globalIndex >= 0 ? globalIndex : undefined);
                          return (
                            <span
                              key={sub}
                              className={`inline-flex items-center gap-1.5 ${colors.bg} ${colors.text} text-[11px] px-3 py-1 rounded-2xl border ${colors.border} shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-md cursor-default`}
                            >
                              {sub}
                              <button onClick={() => handleRemoveSubjectFromClass(cls.id, sub)} className="ml-1 hover:text-destructive transition-colors rounded-full hover:bg-destructive/10 p-0.5">
                                <Icon name="close" className="text-[14px]" />
                              </button>
                            </span>
                          );
                        })}
                        {(editClassSubjects[cls.id] || []).length === 0 && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground/60 italic px-2">
                            <Icon name="info" className="text-base opacity-40" />
                            Sense matèries assignades
                          </div>
                        )}
                      </div>

                      <div className="pt-2 relative z-10 border-t border-border/10">
                        <div className="flex items-center gap-2">
                          <div className="w-full">
                            <Select
                              key={`select-sub-${cls.id}-${editProfileSubjects.length}`}
                              onValueChange={(val) => handleAddSubjectToClass(cls.id, val)}
                            >
                              <SelectTrigger className="h-10 text-xs bg-background/50 border-border/40 rounded-xl focus:ring-4 focus:ring-primary/5 transition-all hover:bg-background">
                                <SelectValue placeholder="Tria matèria del perfil..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl shadow-xl border-border/50 max-h-[200px] overflow-y-auto custom-scrollbar">
                                {filterSubjects(editProfileSubjects).map(s => (
                                  <SelectItem key={s} value={s} className="rounded-lg text-xs">{s}</SelectItem>
                                ))}
                                {filterSubjects(editProfileSubjects).length === 0 && (
                                  <p className="p-4 text-[10px] text-muted-foreground text-center">No tens matèries al perfil</p>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {classes.length === 0 && !isAddingClass && (
                    <div className="text-center py-12 bg-secondary/5 rounded-[3rem] border-2 border-dashed border-border/40 opacity-60 transition-all hover:opacity-100 hover:bg-secondary/10">
                      <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-border shadow-inner">
                        <Icon name="group_add" className="text-3xl text-primary/40" />
                      </div>
                      <p className="text-sm font-bold tracking-tight">Encara no tens cap classe</p>
                      <p className="text-xs text-muted-foreground mt-2 max-w-[200px] mx-auto leading-relaxed">Crea la teva primera classe per començar a organitzar les teves matèries i alumnes.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-6 rounded-full border-primary/20 text-primary hover:bg-primary/5 font-bold"
                        onClick={() => setIsAddingClass(true)}
                      >
                        Començar ara
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-background border-t border-border/40 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <Button
              type="submit"
              onClick={handleSaveProfile}
              className="w-full py-7 rounded-[2rem] font-black text-base shadow-xl shadow-primary/30 transition-all hover:translate-y-[-2px] active:translate-y-[1px] hover:shadow-2xl hover:shadow-primary/40 leading-none"
            >
              Guardar Configuració
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmació d'Importació */}
      <Dialog open={isImportConfirmOpen} onOpenChange={setIsImportConfirmOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Icon name="warning" />
              Confirmar Importació
            </DialogTitle>
            <DialogDescription className="py-2">
              Estàs a punt de restaurar una còpia de dades. **Aquesta acció sobrescriurà tota la informació actual** (alumnes, notes, calendari...).
              Vols continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsImportConfirmOpen(false)} className="rounded-xl font-bold">Cancel·lar</Button>
            <Button onClick={confirmImport} className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700">Confirmar i Restaurar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmació de Reinici (BORRAR) */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Icon name="dangerous" />
              Esborrar Totes les Dades
            </DialogTitle>
            <DialogDescription className="py-2">
              Aquesta acció no es pot desfer. Per confirmar l'esborrat total del curs, escriu **BORRAR** a continuació:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Escriu BORRAR aquí..."
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              className="rounded-xl border-destructive/20 focus:ring-destructive/20 text-center font-bold tracking-widest"
            />
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              className="w-full rounded-xl font-bold shadow-lg shadow-destructive/20 disabled:opacity-50"
              disabled={resetConfirm !== 'BORRAR'}
              onClick={handleResetCourse}
            >
              Confirmar Esborrat Definitiu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar - Persistent on md and above */}
      <div className="hidden md:block">
        {sidebarContent}
      </div>

      {/* Mobile drawer - Only on mobile devices */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-72 h-full animate-in slide-in-from-left duration-300 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
