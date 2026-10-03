import React from 'react';
import { X, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Appointment } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';

interface AppointmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
}

export const AppointmentHistoryModal: React.FC<AppointmentHistoryModalProps> = ({
  isOpen,
  onClose,
  appointments,
  onSelectAppointment,
}) => {
  if (!isOpen) return null;

  const pastAppointments = appointments.filter(
    (apt) => apt.status === 'completada' || apt.status === 'cancelada' || apt.status === 'no_asistio' || apt.status === 'rechazada'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A3073B]">
              Expediente de Atención
            </span>
            <h3 className="text-lg font-bold text-slate-900">Historial de Consultas Médicas</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto space-y-3 custom-scroll pr-1 flex-1">
          {pastAppointments.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No tienes registros de consultas pasadas finalizadas.
            </div>
          ) : (
            pastAppointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => {
                  onSelectAppointment(apt);
                  onClose();
                }}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {formatDisplayDate(apt.date)} • {apt.time}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        apt.status === 'completada'
                          ? 'bg-slate-200 text-slate-700'
                          : apt.status === 'no_asistio'
                          ? 'bg-slate-900 text-white'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {apt.status === 'completada'
                        ? 'Atendida'
                        : apt.status === 'no_asistio'
                        ? 'Inasistida'
                        : apt.status === 'rechazada'
                        ? 'Rechazada EPS'
                        : 'Cancelada'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">
                    {apt.doctorSpecialty} • {apt.doctorName}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {apt.location} • {apt.reason}
                  </p>
                  {apt.prescription?.diagnosis && (
                    <p className="text-[11px] font-medium text-slate-700 mt-1 bg-white p-2 rounded-lg border border-slate-200/60 inline-block">
                      Diagnóstico: {apt.prescription.diagnosis}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold text-[#A3073B] hover:underline">
                    Ver constancia →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            Cerrar Historial
          </button>
        </div>

      </div>
    </div>
  );
};
