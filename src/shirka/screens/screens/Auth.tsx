
import React, { useState } from 'react';
import Icon from '../components/Icon';
import { authService } from '../services/authService';

interface AuthProps {
  onLogin: (user: { name: string; role: string }) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Login states
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const userData = await authService.login(loginUser, loginPass);
      onLogin(userData);
    } catch (err: any) {
      setError(err.message || 'Error en iniciar sessió.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!regName || !regEmail || !regUser || !regPass) {
      setError('Si us plau, omple tots els camps.');
      return;
    }
    
    setIsLoading(true);
    try {
      await authService.register({
        name: regName,
        email: regEmail,
        username: regUser,
        password: regPass,
      });
      setSuccess('Registre completat! Ja pots iniciar sessió.');
      setIsLoginView(true);
      setLoginUser(regUser);
      setLoginPass(''); // Clear password for convenience
      // Clear registration form
      setRegName(''); setRegEmail(''); setRegUser(''); setRegPass('');
    } catch (err: any) {
      setError(err.message || 'Error en el registre.');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanState = () => {
    setError('');
    setSuccess('');
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background-light to-green-50 dark:from-background-dark dark:to-green-950/20 p-4">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-8 pb-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto mb-6 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary/20">
            S
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Benvingut a SHIRKA</h1>
          <p className="text-slate-500 dark:text-slate-400">Identifica't per gestionar el teu quadern</p>
        </div>

        <div className="px-8 flex gap-2 mb-8">
          <button 
            onClick={() => { setIsLoginView(true); cleanState(); }}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${isLoginView ? 'bg-primary/10 text-primary border-2 border-primary' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-2 border-transparent'}`}
          >
            Iniciar Sessió
          </button>
          <button 
            onClick={() => { setIsLoginView(false); cleanState(); }}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${!isLoginView ? 'bg-primary/10 text-primary border-2 border-primary' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-2 border-transparent'}`}
          >
            Registrar-se
          </button>
        </div>

        <div className="px-8 pb-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
              <Icon name="error_outline" className="text-lg" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400 rounded-xl text-sm flex items-center gap-2">
              <Icon name="check_circle_outline" className="text-lg" />
              {success}
            </div>
          )}

          {isLoginView ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Usuari</label>
                <div className="relative">
                  <Icon name="person" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                    placeholder="usuari"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Contrasenya</label>
                <div className="relative">
                  <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="password" 
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                    placeholder="••••"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all mt-4 transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center">
                {isLoading && <Icon name="progress_activity" className="animate-spin mr-2 text-base" />}
                {isLoading ? 'Accedint...' : 'Accedir a SHIRKA'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
               <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Nom complet</label>
                <input 
                  type="text" 
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="El teu nom"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Email</label>
                <input 
                  type="email" 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="email@exemple.com"
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Usuari</label>
                  <input 
                    type="text" 
                    value={regUser}
                    onChange={(e) => setRegUser(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Contrasenya</label>
                  <input 
                    type="password" 
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center">
                 {isLoading && <Icon name="progress_activity" className="animate-spin mr-2 text-base" />}
                 {isLoading ? 'Creant compte...' : 'Crear el Meu Compte'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
