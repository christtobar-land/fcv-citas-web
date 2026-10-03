import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  User,
  CreditCard,
  Building2,
  Phone,
  Mail,
  Lock,
  HeartHandshake,
  CheckCircle2,
  Calendar,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { User as UserType } from '../types';
import { authErrorMessage, register } from '../auth/authApi';
import { fetchEpsList, EpsItem } from '../services/appointmentApi';
import { CustomSelect } from './CustomSelect';

interface RegisterScreenProps {
  onRegisterSuccess: (user: UserType) => void;
  onNavigateLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateLogin,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentType, setDocumentType] = useState('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [selectedEps, setSelectedEps] = useState<string>('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [epsCatalog, setEpsCatalog] = useState<EpsItem[]>([]);

  // Cargar catálogo de EPS registradas con convenio directamente desde la base de datos
  useEffect(() => {
    fetchEpsList()
      .then((list) => {
        if (list && list.length > 0) {
          // Presentar tal cual las entidades registradas en la base de datos
          const activeEps = list
            .filter((e) => e.active !== false)
            .sort((a, b) => a.name.localeCompare(b.name));
          setEpsCatalog(activeEps);
          if (activeEps.length > 0) {
            setSelectedEps(String(activeEps[0].id));
          }
        }
      })
      .catch(() => {
        // Fallback estatutario con EPS registradas en la base de datos
        const fallbackEps: EpsItem[] = [
          { id: 5, code: 'EPS_COMPENSAR', name: 'Compensar EPS', active: true },
          { id: 6, code: 'EPS_FAMISANAR', name: 'EPS Famisanar', active: true },
          { id: 1, code: 'EPS_SALUD_TOTAL', name: 'EPS Salud Total', active: true },
          { id: 2, code: 'EPS_SANITAS', name: 'EPS Sanitas', active: true },
          { id: 3, code: 'EPS_SURA', name: 'EPS Sura', active: true },
          { id: 4, code: 'EPS_NUEVA_EPS', name: 'Nueva EPS', active: true },
        ];
        setEpsCatalog(fallbackEps);
        setSelectedEps(String(fallbackEps[0].id));
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !documentType || !documentNumber.trim() || !email.trim() || !phone.trim() || !password) {
      setErrorMessage('Por favor completa todos los campos obligatorios del registro.');
      return;
    }
    if (!acceptTerms) {
      setErrorMessage('Debes aceptar los términos de servicio y tratamiento de datos de salud.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    try {
      const user = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        documentType,
        documentNumber: documentNumber.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });
      onRegisterSuccess(user);
    } catch (error) {
      setErrorMessage(authErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const documentTypeOptions = [
    { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
    { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
    { value: 'CE', label: 'Cédula de Extranjería (CE)' },
    { value: 'PA', label: 'Pasaporte (PA)' },
  ];

  const epsOptions = epsCatalog.map((item) => ({
    value: String(item.id),
    label: item.name,
  }));

  return (
    <div
      className="relative w-full min-h-screen flex items-center justify-center p-4 sm:p-6 lg:py-8 lg:px-10 font-sans overflow-x-hidden"
      id="register-main-container"
    >
      {/* Fondo cinematográfico coherente con la identidad visual de MediHealth Plus */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/nurse_care.jpg"
          alt="Atención médica y cuidado clínico profesional en MediHealth Plus"
          className="w-full h-full object-cover object-center select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/30 to-slate-950/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[#870530]/20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[550px] h-[550px] bg-gradient-to-tl from-[#870530]/40 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/40" />
      </div>

      {/* Contenedor principal responsive */}
      <div className="relative z-10 w-full max-w-[1520px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14 my-auto">
        
        {/* ==================== PANEL IZQUIERDO INSTITUCIONAL ==================== */}
        <div className="w-full lg:w-[480px] xl:w-[520px] text-white space-y-7 pt-2 lg:pt-0">
          
          {/* Logo y Marca Principal */}
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
                Portal Asistencial y Gestión de Citas
              </p>
            </div>
          </div>

          {/* Título de bienvenida */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-white leading-[1.18] drop-shadow-md">
              Crea tu expediente digital en minutos
            </h1>
            <p className="text-white/90 text-sm sm:text-base font-normal leading-relaxed drop-shadow-xs max-w-lg">
              Regístrate para agendar citas médicas generales y especializadas de forma inmediata, consultar tu historial asistencial y descargar constancias clínicas certificadas.
            </p>
          </div>

          {/* Tarjetas de valor institucional */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-white/20">
            <div className="bg-black/35 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
              <div className="flex items-center gap-2 text-white/80">
                <Calendar className="w-4 h-4 text-white" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Agendamiento</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-white block">
                Disponibilidad en vivo
              </span>
            </div>

            <div className="bg-black/35 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
              <div className="flex items-center gap-2 text-white/80">
                <HeartHandshake className="w-4 h-4 text-white" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Convenios EPS</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-white block">
                Validación de órdenes
              </span>
            </div>

            <div className="bg-black/35 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
              <div className="flex items-center gap-2 text-white/80">
                <ShieldCheck className="w-4 h-4 text-white" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Seguridad</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-white block">
                Reserva médica 100%
              </span>
            </div>
          </div>
        </div>

        {/* ==================== PANEL DERECHO: FORMULARIO DE REGISTRO ==================== */}
        <div className="w-full lg:w-[560px] xl:w-[600px] shrink-0 my-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-9 shadow-2xl shadow-slate-950/40 border border-white/80 transition relative">
            
            {/* Botón superior para volver al login */}
            <div className="flex items-center justify-start mb-5 pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={onNavigateLogin}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al ingreso</span>
              </button>
            </div>

            {/* Encabezado del Formulario */}
            <div className="mb-5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#A3073B] block mb-1">
                Afiliación de Paciente
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Crear Cuenta de Paciente
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Ingresa tus datos personales, identificación y EPS para gestionar tus citas médicas
              </p>
            </div>

            {/* Alerta de Error Accesible */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-2xl bg-[#FDF2F4] border border-[#F3C5D3] text-[#A3073B] text-xs font-semibold flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#A3073B] shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Bloque 1: Nombres y Apellidos (50% / 50%) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="register-first-name"
                    className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5"
                  >
                    Nombres
                  </label>
                  <div className="relative">
                    <input
                      id="register-first-name"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ej. Carlos Andrés"
                      className="w-full h-11 bg-slate-50/70 hover:bg-white border border-slate-200/90 rounded-2xl px-4 text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#A3073B] focus:border-[#A3073B] transition pr-10"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="register-last-name"
                    className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5"
                  >
                    Apellidos
                  </label>
                  <div className="relative">
                    <input
                      id="register-last-name"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ej. Méndez Pérez"
                      className="w-full h-11 bg-slate-50/70 hover:bg-white border border-slate-200/90 rounded-2xl px-4 text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#A3073B] focus:border-[#A3073B] transition pr-10"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Tipo y Número de Documento (Equilibrado 50% / 50%) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="register-doc-type"
                    className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5"
                  >
                    Tipo de Documento
                  </label>
                  <CustomSelect
                    id="register-doc-type"
                    value={documentType}
                    onChange={setDocumentType}
                    options={documentTypeOptions}
                    className="w-full"
                    buttonClassName="h-11 px-4 rounded-2xl bg-slate-50/70 hover:bg-white border-slate-200/90"
                  />
                </div>

                <div>
                  <label
                    htmlFor="register-doc-number"
                    className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5"
                  >
                    Número de Documento
                  </label>
                  <div className="relative">
                    <input
                      id="register-doc-number"
                      type="text"
                      required
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="Ej. 1098765432"
                      className="w-full h-11 bg-slate-50/70 hover:bg-white border border-slate-200/90 rounded-2xl px-4 text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#A3073B] focus:border-[#A3073B] transition pr-10"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque 3: EPS y Teléfono (50% / 50%) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="register-eps"
                    className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5"
                  >
                    EPS de Afiliación
                  </label>
                  <CustomSelect
                    id="register-eps"
                    value={selectedEps}
                    onChange={setSelectedEps}
                    options={epsOptions}
                    className="w-full"
                    buttonClassName="h-11 px-4 rounded-2xl bg-slate-50/70 hover:bg-white border-slate-200/90"
                  />
                </div>

                <div>
                  <label
                    htmlFor="register-phone"
                    className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5"
                  >
                    Teléfono Móvil
                  </label>
                  <div className="relative">
                    <input
                      id="register-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej. 310 123 4567"
                      className="w-full h-11 bg-slate-50/70 hover:bg-white border border-slate-200/90 rounded-2xl px-4 text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#A3073B] focus:border-[#A3073B] transition pr-10"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque 4: Correo Electrónico y Contraseña (50% / 50%) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="register-email"
                    className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5"
                  >
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <input
                      id="register-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full h-11 bg-slate-50/70 hover:bg-white border border-slate-200/90 rounded-2xl px-4 text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#A3073B] focus:border-[#A3073B] transition pr-10"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="register-password"
                    className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full h-11 bg-slate-50/70 hover:bg-white border border-slate-200/90 rounded-2xl px-4 text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#A3073B] focus:border-[#A3073B] transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Consentimiento Informado */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded-md border-slate-300 text-[#A3073B] focus:ring-[#A3073B]"
                  />
                  <span className="leading-relaxed text-[11px] text-slate-500">
                    Acepto los términos del servicio y autorizo el tratamiento confidencial de mis datos clínicos en la red asistencial de salud (Ley 1581 de 2012).
                  </span>
                </label>
              </div>

              {/* Botón de Enviar */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#A3073B] hover:bg-[#870530] text-white font-bold text-xs tracking-wide shadow-md shadow-slate-900/10 hover:shadow-lg transition duration-150 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creando expediente digital...</span>
                    </>
                  ) : (
                    <>
                      <span>Registrarme y Acceder</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Footer con enlace a login */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
              ¿Ya tienes cuenta activa?{' '}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="font-bold text-[#A3073B] hover:text-[#870530] transition ml-1 inline-flex items-center gap-1 cursor-pointer"
              >
                Inicia sesión aquí
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
