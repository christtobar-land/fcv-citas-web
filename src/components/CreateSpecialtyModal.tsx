import React, { useState } from 'react';
import { Stethoscope, X, AlertCircle, Check, Clock, ShieldCheck, Hash } from 'lucide-react';
import { SpecialtyItem, createAdminSpecialty } from '../services/appointmentApi';

interface CreateSpecialtyModalProps {
  onClose: () => void;
  onSuccess: (newSpecialty: SpecialtyItem) => void;
}

export const CreateSpecialtyModal: React.FC<CreateSpecialtyModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [isGeneral, setIsGeneral] = useState(false);
  const [requiresAdminApproval, setRequiresAdminApproval] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!code.trim()) {
      setErrorMessage('El código de la especialidad es obligatorio.');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('El nombre de la especialidad es obligatorio.');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createAdminSpecialty({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        durationMinutes,
        isGeneral,
        requiresAdminApproval,
      });
      onSuccess(created);
    } catch (err: any) {
      console.error('Error registrando especialidad:', err);
      setErrorMessage(
        err?.message || 'Error al registrar la especialidad. Verifica que el código no esté repetido.'
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
              <Stethoscope className="w-5 h-5 text-[#A3073B]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Registrar Especialidad Médica</h2>
              <p className="text-xs text-slate-500">
                Añade una disciplina al portafolio asistencial
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
              Código Minsalud / Interno <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="Ej. DERM, NEURO, OFTAL"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A3073B] font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nombre de la Especialidad <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Dermatología Clínica, Neurología Adulto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A3073B]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Duración de Consulta Estándar <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDurationMinutes(30)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
                  durationMinutes === 30
                    ? 'bg-[#FDF2F4] border-[#A3073B] text-[#A3073B]'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>30 Minutos (General / Control)</span>
              </button>
              <button
                type="button"
                onClick={() => setDurationMinutes(60)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
                  durationMinutes === 60
                    ? 'bg-[#FDF2F4] border-[#A3073B] text-[#A3073B]'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>60 Minutos (Especializada / 1ra vez)</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={requiresAdminApproval}
                onChange={(e) => setRequiresAdminApproval(e.target.checked)}
                className="mt-0.5 rounded text-[#A3073B] focus:ring-[#A3073B]"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Requiere Autorización EPS previa
                </span>
                <span className="text-[11px] text-slate-500">
                  El paciente deberá adjuntar el número de orden/autorización para que un administrador confirme el cupo.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={isGeneral}
                onChange={(e) => {
                  setIsGeneral(e.target.checked);
                  if (e.target.checked) setRequiresAdminApproval(false);
                }}
                className="mt-0.5 rounded text-[#A3073B] focus:ring-[#A3073B]"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Es Especialidad de Atención Primaria (Medicina General)
                </span>
                <span className="text-[11px] text-slate-500">
                  Permite agendamiento inmediato y prioritario sin requisitos de autorización.
                </span>
              </div>
            </label>
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
                  Registrar Especialidad
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
