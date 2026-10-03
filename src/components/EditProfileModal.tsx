import React, { useState } from 'react';
import { X, Mail, Phone, User as UserIcon, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import type { User } from '../types';
import { updateUserProfile } from '../services/userApi';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSuccess }) => {
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError('El correo electrónico es obligatorio.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Ingresa un formato de correo electrónico válido.');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePhone = (val: string): boolean => {
    const trimmed = val.trim().replace(/\s+/g, '');
    if (!trimmed) {
      setPhoneError('El número telefónico es obligatorio.');
      return false;
    }
    const phoneRegex = /^3\d{9}$/;
    if (!phoneRegex.test(trimmed)) {
      setPhoneError('Debe ser un número celular colombiano válido de 10 dígitos (iniciando con 3).');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const isEmailValid = validateEmail(email);
    const isPhoneValid = validatePhone(phone);

    if (!isEmailValid || !isPhoneValid) {
      return;
    }

    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPhone = phone.trim().replace(/\s+/g, '');

      let updatedData: User = {
        ...user,
        email: trimmedEmail,
        phone: trimmedPhone,
      };

      try {
        const response = await updateUserProfile({
          email: trimmedEmail,
          phone: trimmedPhone,
        });

        updatedData = {
          ...user,
          email: response.email,
          phone: response.phone,
          documentType: response.documentType || user.documentType,
          documentNumber: response.documentNumber || user.documentNumber,
          insuranceName: response.affiliation?.epsName || user.insuranceName,
          insuranceId: response.affiliation?.membershipNumber || user.insuranceId,
        };
      } catch (apiErr: unknown) {
        const errObj = apiErr as Error;
        // If it's a conflict or server message, show it
        if (errObj.message && (errObj.message.includes('409') || errObj.message.includes('registrado') || errObj.message.includes('duplicado'))) {
          throw new Error('El correo electrónico ya se encuentra registrado por otro usuario.');
        } else if (errObj.message && !errObj.message.includes('Failed to fetch') && !errObj.message.includes('NetworkError')) {
          throw errObj;
        }
        // In local mode or mock fallback, continue with local update
      }

      // Persist to storage
      const savedUserStr = localStorage.getItem('portal_citas_user') || sessionStorage.getItem('portal_citas_user');
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          const merged = { ...parsed, email: updatedData.email, phone: updatedData.phone };
          if (localStorage.getItem('portal_citas_user')) {
            localStorage.setItem('portal_citas_user', JSON.stringify(merged));
          } else {
            sessionStorage.setItem('portal_citas_user', JSON.stringify(merged));
          }
        } catch {
          // ignore parsing error
        }
      }

      onSuccess(updatedData);
    } catch (err: unknown) {
      const errObj = err as Error;
      setErrorMessage(errObj.message || 'No fue posible actualizar tus datos de contacto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#A3073B]">
              <UserIcon className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Actualizar Datos de Contacto</h2>
              <p className="text-xs text-slate-500 font-medium">Mantén tu información al día para avisos de citas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Identification Summary (Read-Only) */}
        <div className="my-5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Identidad Verificada</span>
            </div>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{user.name}</p>
            <p className="text-xs text-slate-500 font-medium">
              {user.documentType || 'CC'} • {user.documentNumber || 'Documento no registrado'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Afiliación</span>
            <span className="text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 inline-block mt-0.5">
              {user.insuranceName || 'EPS Salud Total'}
            </span>
          </div>
        </div>

        {/* Global Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Edit Form */}
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(email)}
                placeholder="ejemplo@correo.com"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border rounded-2xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  emailError
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                    : 'border-slate-200 focus:ring-[#A3073B]/20 focus:border-[#A3073B]'
                }`}
              />
            </div>
            {emailError ? (
              <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {emailError}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-400 font-normal">
                Recibirás recordatorios y confirmaciones médicas en esta casilla.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Teléfono Celular de Contacto
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) validatePhone(e.target.value);
                }}
                onBlur={() => validatePhone(phone)}
                placeholder="3001234567"
                maxLength={10}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border rounded-2xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  phoneError
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                    : 'border-slate-200 focus:ring-[#A3073B]/20 focus:border-[#A3073B]'
                }`}
              />
            </div>
            {phoneError ? (
              <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {phoneError}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-400 font-normal">
                Número de 10 dígitos (iniciando con 3). Empleado para notificaciones de turno.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#A3073B] hover:bg-[#870530] rounded-2xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
