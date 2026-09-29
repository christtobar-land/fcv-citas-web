import React, { useState, useEffect } from 'react';
import { ScreenType, User } from './types';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { AdminOfferScreen } from './admin/AdminOfferScreen';
import { UserBookingScreen } from './scheduling/UserBookingScreen';
import { ProfessionalScheduleScreen } from './scheduling/ProfessionalScheduleScreen';
import { CheckCircle2 } from 'lucide-react';
import { logout, restoreSession } from './auth/authApi';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    restoreSession().then((user) => {
      if (!active) return;
      if (user) {
        setCurrentUser(user);
        setCurrentScreen('dashboard');
      }
      setIsRestoringSession(false);
    });
    return () => { active = false; };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentScreen('dashboard');
    showToast(`¡Bienvenido/a de nuevo, ${user.name}!`);
  };

  const handleRegisterSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentScreen('dashboard');
    showToast(`¡Cuenta creada exitosamente! Bienvenido, ${user.name}.`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setCurrentScreen('login');
      showToast('Has cerrado sesión correctamente.');
    } catch {
      showToast('No fue posible cerrar la sesión. Inténtalo nuevamente.');
    }
  };


  if (isRestoringSession) {
    return (
      <main className="min-h-screen bg-[#F1F4F9] flex items-center justify-center" aria-live="polite">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Verificando sesión segura...
        </div>
      </main>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F1F4F9] text-slate-800 flex flex-col items-center justify-center p-3 sm:p-6 md:p-10 font-sans selection:bg-blue-600 selection:text-white"
      id="portal-citas-app-root"
    >
      {/* Toast notification banner */}
      {toastMessage && (
        <div
          id="portal-toast"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700/80 flex items-center gap-2.5 text-xs sm:text-sm font-medium animate-bounce"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Render */}
      {currentScreen === 'login' && (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onNavigateRegister={() => setCurrentScreen('register')}
        />
      )}

      {currentScreen === 'register' && (
        <RegisterScreen
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateLogin={() => setCurrentScreen('login')}
        />
      )}

      {currentScreen === 'dashboard' && currentUser && (
        currentUser.roles?.includes('ADMIN') ? (
          <AdminOfferScreen user={currentUser} onLogout={handleLogout} />
        ) : currentUser.roles?.includes('PROFESSIONAL') ? (
          <ProfessionalScheduleScreen user={currentUser} onLogout={handleLogout} />
        ) : (
          <UserBookingScreen user={currentUser} onLogout={handleLogout} />
        )
      )}

    </div>
  );
}
