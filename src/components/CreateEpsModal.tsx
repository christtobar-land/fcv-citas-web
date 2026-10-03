import React, { useState } from 'react';
import { ShieldCheck, X, AlertCircle, Check, Hash } from 'lucide-react';
import { EpsItem, createAdminEps } from '../services/appointmentApi';

interface CreateEpsModalProps {
  onClose: () => void;
  onSuccess: (newEps: EpsItem) => void;
}

export const CreateEpsModal: React.FC<CreateEpsModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!code.trim()) {
      setErrorMessage('El código de la aseguradora es obligatorio.');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('El nombre de la entidad EPS es obligatorio.');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createAdminEps({
        code: code.trim().toUpperCase(),
        name: name.trim(),
      });
      onSuccess(created);
    } catch (err: any) {
      console.error('Error registrando EPS:', err);
      setErrorMessage(
        err?.message || 'Error al registrar la entidad EPS. Verifica que el código no esté repetido.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-wine-50 text-wine-700 flex items-center justify-center border border-wine-100">
              <ShieldCheck className="w-5 h-5 text-[#A3073B]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Registrar Aseguradora EPS</h2>
              <p className="text-xs text-slate-500">
                Vincula una entidad prestadora o administradora de salud
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Código Institucional EPS <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="Ej. EPS_MUTUAL_SER, EPS_COOSALUD"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A3073B] font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nombre de la Entidad EPS <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Mutual Ser EPS, Coosalud EPS"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A3073B]"
            />
          </div>

          <div className="pt-2">
            <p className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              Al guardar, la entidad EPS quedará habilitada para validación de afiliaciones y autorización de órdenes de especialistas.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#A3073B] hover:bg-[#870530] disabled:opacity-50 rounded-xl shadow-md transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Registrar EPS
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
