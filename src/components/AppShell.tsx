import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/contexts/DataContext';
import { Screen } from '@/types';
import Auth from '@/pages/Auth';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/pages/Dashboard';
import Alumnes from '@/pages/Alumnes';
import Avaluacio from '@/pages/Avaluacio';
import Calendari from '@/pages/Calendari';
import Assistencia from '@/pages/Assistencia';
import Reunions from '@/pages/Reunions';
import Missatgeria from '@/pages/Missatgeria';
import StudentProfile from '@/pages/StudentProfile';
import ClassProfile from '@/pages/ClassProfile';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import LandingPage from '@/pages/LandingPage';
import Llibreta from '@/pages/Llibreta';
import Icon from '@/components/Icon';
import FloatingSchedule from '@/components/FloatingSchedule';

const SCREEN_LABELS: Record<Screen, string> = {
  [Screen.Dashboard]: 'Tauler',
  [Screen.Alumnes]: 'Alumnes',
  [Screen.Avaluacio]: 'Avaluació',
  [Screen.Calendari]: 'Calendari',
  [Screen.Assistencia]: 'Assistència',
  [Screen.Reunions]: 'Reunions',
  [Screen.Missatgeria]: 'Missatgeria',
  [Screen.StudentProfile]: 'Perfil Alumne',
  [Screen.ClassProfile]: 'Perfil Classe',
  [Screen.PrivacyPolicy]: 'Privadesa',
  [Screen.Llibreta]: 'La meva Llibreta',
};

const AppShell: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const data = useData();
  const [screen, setScreen] = useState<Screen>(Screen.Dashboard);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('shirka-dark') === 'true';
    }
    return false;
  });
  const [showSchedule, setShowSchedule] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('shirka-show-schedule') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('shirka-show-schedule', String(showSchedule));
  }, [showSchedule]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('shirka-dark', String(darkMode));
  }, [darkMode]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Icon name="progress_activity" className="animate-spin text-primary text-4xl mb-4" />
          <p className="text-muted-foreground">Carregant SHIRKA...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (screen === Screen.PrivacyPolicy) {
      return (
        <div className="flex h-screen overflow-hidden bg-background">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-14 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => setScreen(Screen.Dashboard)}
                className="flex items-center gap-2 text-sm font-bold text-primary hover:opacity-80 transition-opacity"
              >
                <Icon name="arrow_back" />
                Tornar al Login
              </button>
              <span className="font-bold text-sm text-foreground">Política de Privadesa</span>
              <div className="w-20" /> {/* Spacer */}
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <PrivacyPolicy />
            </div>
          </div>
        </div>
      );
    }

    if (showLanding) {
      return <LandingPage onGetStarted={() => setShowLanding(false)} />;
    }
    return <Auth onShowPrivacy={() => setScreen(Screen.PrivacyPolicy)} />;
  }

  if (data.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Icon name="progress_activity" className="animate-spin text-primary text-4xl mb-4" />
          <p className="text-muted-foreground">Carregant dades...</p>
        </div>
      </div>
    );
  }

  const viewStudent = (id: string) => {
    setSelectedStudentId(id);
    setScreen(Screen.StudentProfile);
  };

  const viewClass = (id: string) => {
    setSelectedClassId(id);
    setScreen(Screen.ClassProfile);
  };

  const goBack = () => {
    setScreen(Screen.Alumnes);
    setSelectedStudentId(null);
    setSelectedClassId(null);
  };

  const renderScreen = () => {
    if (screen === Screen.StudentProfile && selectedStudentId) {
      const student = data.students.find(s => s.id === selectedStudentId);
      if (!student) return null;
      const cls = data.classes.find(c => c.id === student.classId);
      return <StudentProfile student={student} students={data.students} classes={data.classes} className={cls?.name || ''} onBack={goBack} onUpdateStudent={data.updateStudent} onDeleteStudent={data.deleteStudent} activities={data.activities} grades={data.grades} meetings={data.meetings} subjects={data.profile.subjects} attendance={data.attendance} />;
    }

    if (screen === Screen.ClassProfile && selectedClassId) {
      const classGroup = data.classes.find(c => c.id === selectedClassId);
      if (!classGroup) return null;
      return <ClassProfile classGroup={classGroup} students={data.students} onBack={goBack} onUpdateClass={data.updateClass} onDeleteClass={data.deleteClass} onViewStudent={viewStudent} />;
    }

    switch (screen) {
      case Screen.Dashboard:
        return <Dashboard onNavigate={setScreen} />;
      case Screen.Alumnes:
        return <Alumnes students={data.students} classes={data.classes} onAddStudent={data.addStudent} onAddClass={data.addClass}
          onViewStudent={viewStudent} onViewClass={viewClass} />;
      case Screen.Avaluacio:
        return <Avaluacio />;
      case Screen.Calendari:
        return <Calendari events={data.events} subjects={data.profile.subjects} onAddEvent={data.addEvent} onDeleteEvent={data.deleteEvent} meetings={data.meetings} />;
      case Screen.Assistencia:
        return <Assistencia />;
      case Screen.Reunions:
        return <Reunions meetings={data.meetings} students={data.students} onAddMeeting={data.addMeeting} onUpdateMeeting={data.updateMeeting} onDeleteMeeting={data.deleteMeeting} />;
      case Screen.Missatgeria:
        return <Missatgeria />;
      case Screen.PrivacyPolicy:
        return <PrivacyPolicy />;
      case Screen.Llibreta:
        return <Llibreta />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        currentScreen={screen}
        setScreen={(s) => { setScreen(s); setSelectedStudentId(null); setSelectedClassId(null); }}
        onSignOut={signOut}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 h-full">
            {/* Hamburger for mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground mr-1"
            >
              <Icon name="menu" className="text-xl" />
            </button>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white flex items-center h-full border-l border-border/50 pl-4 md:pl-6 ml-1 md:ml-0">
              {SCREEN_LABELS[screen]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className={`p-2 rounded-lg transition-all ${showSchedule ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted-foreground'}`}
              title="El meu Horari"
            >
              <Icon name="event_note" className="text-xl" />
            </button>
            <div className="h-6 w-px bg-border/60 mx-1"></div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
              <Icon name={darkMode ? 'light_mode' : 'dark_mode'} className="text-xl" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden touch-scrolling scrollbar-hide">
          <div className="flex-1 w-full max-w-[2000px] mx-auto p-4 sm:p-6 lg:p-8">
            {renderScreen()}
          </div>
        </div>
      </div>
      {showSchedule && <FloatingSchedule onClose={() => setShowSchedule(false)} />}
    </div>
  );
};

export default AppShell;
