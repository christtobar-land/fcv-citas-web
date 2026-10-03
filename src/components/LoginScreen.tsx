import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Mail, Calendar, RotateCcw, FileText, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { authErrorMessage, login } from '../auth/authApi';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  onNavigateRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateRegister,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice(null);
    setIsLoading(true);

    try {
      const user = await login(email, password, rememberMe);
      onLoginSuccess(user);
    } catch (error) {
      setErrorMessage(authErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative w-full min-h-screen flex items-center justify-center p-4 sm:p-6 lg:py-6 lg:px-10 font-sans overflow-x-hidden"
      id="login-main-container"
    >
      {/* ==================== FULL-SCREEN BACKGROUND WITH CENTERED NURSE HERO ==================== */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Natural wide clinic image with nurse clearly centered and visible */}
        <img
          src="/nurse_care.jpg"
          alt="Atención médica y cuidado clínico profesional en MediHealth Plus"
          className="w-full h-full object-cover object-center select-none"
        />

        {/* Red/Wine brand overlay - calibrated so it tints the scene without drowning or scorching the nurse's face */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/25 to-slate-950/80 mix-blend-multiply" />
        
        {/* Soft atmospheric wine wash */}
        <div className="absolute inset-0 bg-[#870530]/20 pointer-events-none" />
        
        {/* Subtle warm wine glow from bottom right corner towards card */}
        <div className="absolute bottom-0 right-0 w-[550px] h-[550px] bg-gradient-to-tl from-[#870530]/40 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* Top/bottom edge vignettes for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/40" />
      </div>

      {/* ==================== CONTENT CONTAINER ==================== */}
      <div className="relative z-10 w-full max-w-[1520px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16 my-auto">
        
        {/* ==================== LEFT EDITORIAL MESSAGE ==================== */}
        <div className="w-full lg:w-[480px] xl:w-[520px] text-white space-y-7 pt-4 lg:pt-0">
          
          {/* Much larger brand logo & platform identity */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/30 p-3 sm:p-3.5 flex items-center justify-center shadow-2xl shrink-0">
              <img
                src="/logo.png"
                alt="MediHealth Plus Logo"
                className="w-full h-full object-contain filter brightness-0 invert drop-shadow-md"
              />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
                  MediHealth
                </span>
                <span className="text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full bg-[#A3073B] text-white border border-white/30 uppercase tracking-wider shadow-sm">
                  Plus
                </span>
              </div>
              <p className="text-sm sm:text-base text-white/90 font-medium tracking-wide drop-shadow-xs mt-1">
                Gestión Inteligente de Citas Médicas
              </p>
            </div>
          </div>

          {/* Headline & Subhead */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-white leading-[1.18] drop-shadow-md">
              Cuidamos tu salud y bienestar en cada consulta
            </h1>

            <p className="text-white/90 text-sm sm:text-base font-normal leading-relaxed drop-shadow-xs max-w-lg">
              Sin filas ni trámites complejos. Agenda con medicina general o especialistas disponibles de forma inmediata y 100% digital.
            </p>
          </div>

          {/* Action-oriented patient feature cards (Neutral monochromatic icons, no arbitrary colors) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-white/20">
            <div className="bg-black/35 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
              <div className="flex items-center gap-2 text-white/80">
                <Calendar className="w-4 h-4 text-white" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Agendamiento</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-white block">
                Reserva en 1 minuto
              </span>
            </div>

            <div className="bg-black/35 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
              <div className="flex items-center gap-2 text-white/80">
                <RotateCcw className="w-4 h-4 text-white" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Reprogramación</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-white block">
                Cambia fecha u hora
              </span>
            </div>

            <div className="bg-black/35 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
              <div className="flex items-center gap-2 text-white/80">
                <FileText className="w-4 h-4 text-white" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Expediente</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-white block">
                Historial y órdenes
              </span>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT FLOATING CARD ==================== */}
        <div className="w-full lg:w-[470px] shrink-0 my-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-7 sm:p-9 shadow-2xl shadow-slate-950/40 border border-white/80 transition relative">
            
            {/* Clean Card Header without redundant logo */}
            <div className="mb-6 pb-4 border-b border-slate-100">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#A3073B] block mb-1">
                Acceso al Portal
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Iniciar Sesión
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Ingresa con tu correo electrónico registrado y contraseña
              </p>
            </div>

            {/* Accessible Error Alert */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-2xl bg-[#FDF2F4] border border-[#F3C5D3] text-[#A3073B] text-xs font-semibold flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#A3073B] shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Notice Banner */}
            {successNotice && (
              <div
                role="status"
                className="mb-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Input */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5"
                >
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full bg-slate-50/70 hover:bg-white border border-slate-200/90 rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A3073B] focus:border-[#A3073B] transition"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/70 hover:bg-white border border-slate-200/90 rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A3073B] focus:border-[#A3073B] transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember & Recover */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded-md border-slate-300 text-[#A3073B] focus:ring-[#A3073B]"
                  />
                  <span>Recordar sesión</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessNotice(null);
                    setErrorMessage('');
                    setIsForgotPasswordOpen(true);
                  }}
                  className="font-bold text-[#A3073B] hover:text-[#870530] transition cursor-pointer"
                >
                  ¿Olvidaste tu clave?
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#A3073B] hover:bg-[#870530] text-white font-bold text-xs tracking-wide shadow-md shadow-slate-900/10 hover:shadow-lg transition duration-150 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Ingresando...</span>
                    </>
                  ) : (
                    <>
                      <span>Ingresar</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Navigation to Register */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
              ¿Aún no tienes cuenta médica?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="font-bold text-[#A3073B] hover:text-[#870530] transition ml-1 inline-flex items-center gap-1"
              >
                Regístrate como afiliado
              </button>
            </div>

          </div>
        </div>

        {/* Modal de recuperación de contraseña */}
        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          initialEmail={email}
          onClose={() => setIsForgotPasswordOpen(false)}
          onSuccessReset={(recoveredEmail) => {
            setEmail(recoveredEmail);
            setSuccessNotice('Tu contraseña ha sido restablecida exitosamente. Ingresa ahora con tu nueva clave.');
          }}
        />

      </div>
    </div>
  );
};
