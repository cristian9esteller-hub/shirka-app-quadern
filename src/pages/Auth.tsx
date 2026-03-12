import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import Icon from '@/components/Icon';

interface AuthProps {
  onShowPrivacy?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onShowPrivacy }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        // Map common errors to Spanish
        if (error.message.includes('Invalid login credentials')) {
          setError('Credenciales de acceso inválidas.');
        } else {
          setError(error.message);
        }
      }
    } else {
      if (!name.trim()) { setError("Debes introducir tu nombre."); setLoading(false); return; }
      const { error } = await signUp(email, password, name);
      if (error) {
        if (error.message.includes('User already registered')) {
          setError('El correo ya está registrado.');
        } else if (error.message.includes('Password should be at least 6 characters')) {
          setError('La contraseña debe tener al menos 6 caracteres.');
        } else {
          setError(error.message);
        }
      }
      else setSuccess("¡Cuenta creada! Revisa tu correo para verificarlo.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Icon name="auto_stories" className="text-primary text-4xl" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">SHIRKA</h1>
          <p className="text-muted-foreground mt-1">Cuaderno digital del maestro</p>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          <div className="flex bg-secondary p-1 rounded-xl mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === 'login' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === 'register' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Nombre completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary text-foreground"
                  placeholder="Tu nombre"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Correo electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="nombre@escuela.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            {success && <p className="text-primary text-sm text-center">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 transition-all hover:opacity-90"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="progress_activity" className="animate-spin text-lg" />
                  {mode === 'login' ? 'Entrando...' : 'Registrando...'}
                </span>
              ) : (
                mode === 'login' ? 'Entrar' : 'Crear cuenta'
              )}
            </button>

            {mode === 'register' && (
              <p className="text-[10px] text-muted-foreground text-center mt-4">
                En clicar a "Crear cuenta" acceptes la nostra{' '}
                <button
                  type="button"
                  onClick={onShowPrivacy}
                  className="text-primary hover:underline font-bold"
                >
                  Política de Privadesa
                </button>
              </p>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
