import React, { useState } from 'react';
import { X, AlertTriangle, Calendar, Clock, MapPin } from 'lucide-react';
import { Appointment } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';
import { cleanProfessionalName } from '../utils/professionalUtils';
import { CustomSelect } from './CustomSelect';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onConfirmCancel: (id: string, reason: string) => void;
}

export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onConfirmCancel,
}) => {
  const [reason, setReason] = useState('Inconveniente laboral o personal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleConfirm = () => {
    setIsSubmitting(true);
    onConfirmCancel(appointment.id, reason);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-appointment-title"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 id="cancel-appointment-title" className="text-base font-bold text-slate-900 leading-tight">
                Cancelar Cita Médica
              </h2>
              <span className="text-xs text-slate-400 font-mono">#{appointment.id}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs text-rose-900 space-y-1">
            <p className="font-bold text-rose-800">
              ¿Estás seguro de que deseas cancelar esta cita?
            </p>
            <p className="text-rose-700/90 text-[11px]">
              Al confirmar, el cupo médico será liberado inmediatamente para otro paciente afiliado en la sede.
            </p>
          </div>

          {/* Resumen de la Cita */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#A3073B] uppercase tracking-wider">
                {appointment.doctorSpecialty}
              </span>
              <span className="text-xs font-bold text-slate-900">
                {cleanProfessionalName(appointment.doctorName)}
              </span>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60 text-xs text-slate-700">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDisplayDate(appointment.date)}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {appointment.time}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              {appointment.location}
            </p>
          </div>

          {/* Motivo */}
          <div className="space-y-1">
            <label htmlFor="cancel-reason-select" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Motivo de Cancelación
            </label>
            <CustomSelect
              id="cancel-reason-select"
              value={reason}
              onChange={setReason}
              options={[
                { value: 'Inconveniente laboral o personal', label: 'Inconveniente laboral o personal' },
                { value: 'Mejora de síntomas de salud', label: 'Mejora de síntomas de salud' },
                { value: 'Reubicación o viaje fuera de la ciudad', label: 'Reubicación o viaje fuera de la ciudad' },
                { value: 'Reprogramaré para otra fecha o sede', label: 'Reprogramaré para otra fecha o sede' },
              ]}
              className="w-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            No, Mantener Cita
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="px-4.5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition cursor-pointer"
          >
            {isSubmitting ? 'Cancelando...' : 'Sí, Cancelar Cita'}
          </button>
        </div>
      </div>
    </div>
  );
};
