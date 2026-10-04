import React, { useState } from 'react';
import { X, Calendar, Clock, RotateCcw, MapPin, CheckCircle2, XCircle, FileText, AlertCircle, Eye } from 'lucide-react';
import { Appointment } from '../types';
import { getSpecialtyIcon } from '../utils/specialtyIcons';
import { formatDisplayDate } from '../utils/dateUtils';
import { cleanProfessionalName } from '../utils/professionalUtils';

interface PendingAppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  onOpenDetail: (appointment: Appointment, mode?: 'detail' | 'reschedule') => void;
  onCancelAppointment: (id: string) => void;
  initialFilter?: 'all' | 'pending' | 'completed' | 'cancelled' | 'no_show';
}

export const PendingAppointmentsModal: React.FC<PendingAppointmentsModalProps> = ({
  isOpen,
  onClose,
  appointments,
  onOpenDetail,
  onCancelAppointment,
  initialFilter = 'all',
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled' | 'no_show'>(initialFilter);

  if (!isOpen) return null;

  const getTime = (apt: Appointment) => {
    if (apt.scheduledStartAt) return new Date(apt.scheduledStartAt).getTime();
    if (apt.date && apt.time) return new Date(`${apt.date}T${apt.time.substring(0, 5)}:00`).getTime();
    return 0;
  };

  const pendingCount = appointments.filter((a) => a.status === 'confirmada' || a.status === 'pendiente').length;
  const completedCount = appointments.filter((a) => a.status === 'completada').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelada' || a.status === 'rechazada').length;
  const noShowCount = appointments.filter((a) => a.status === 'no_asistio').length;

  // Filtrado según la pestaña activa
  const filteredList = appointments.filter((apt) => {
    if (filter === 'pending') return apt.status === 'confirmada' || apt.status === 'pendiente';
    if (filter === 'completed') return apt.status === 'completada';
    if (filter === 'cancelled') return apt.status === 'cancelada' || apt.status === 'rechazada';
    if (filter === 'no_show') return apt.status === 'no_asistio';
    return true;
  });

  // Orden cronológico:
  // Citas próximas primero (de la más cercana a la más lejana)
  // Seguidas de citas pasadas / historial (de la más reciente a la más antigua)
  const sortedList = [...filteredList].sort((a, b) => {
    const isAPending = a.status === 'confirmada' || a.status === 'pendiente';
    const isBPending = b.status === 'confirmada' || b.status === 'pendiente';

    if (isAPending && !isBPending) return -1;
    if (!isAPending && isBPending) return 1;

    const timeA = getTime(a);
    const timeB = getTime(b);

    if (isAPending && isBPending) {
      return timeA - timeB;
    }
    return timeB - timeA;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A3073B]">
                Agenda y Expediente
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FDF2F4] text-[#A3073B] border border-[#F3C5D3]">
                {appointments.length} {appointments.length === 1 ? 'registro en total' : 'registros en total'}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Mis Citas Médicas e Historial
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulta todas tus citas programadas y consultas pasadas organizadas cronológicamente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shrink-0 cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 pb-3 shrink-0 overflow-x-auto custom-scroll">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              filter === 'all'
                ? 'bg-[#A3073B] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Todas ({appointments.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              filter === 'pending'
                ? 'bg-[#A3073B] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Próximas ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              filter === 'completed'
                ? 'bg-[#A3073B] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Cumplidas ({completedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('cancelled')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              filter === 'cancelled'
                ? 'bg-[#A3073B] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Canceladas ({cancelledCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('no_show')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              filter === 'no_show'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Inasistencias ({noShowCount})
          </button>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto space-y-3.5 custom-scroll pr-1 flex-1">
          {sortedList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No se encontraron citas médicas con el filtro seleccionado.
            </div>
          ) : (
            sortedList.map((apt, index) => {
              const isPending = apt.status === 'confirmada' || apt.status === 'pendiente';
              const isCompleted = apt.status === 'completada';
              const isCancelled = apt.status === 'cancelada' || apt.status === 'rechazada';
              const isNoShow = apt.status === 'no_asistio';

              return (
                <div
                  key={apt.id}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border transition relative group ${
                    isNoShow
                      ? 'border-slate-300/80 bg-slate-50/60 shadow-2xs hover:shadow-xs'
                      : isCancelled
                      ? 'border-slate-200/60 bg-slate-50/40 opacity-80'
                      : isCompleted
                      ? 'border-emerald-100 bg-white shadow-2xs hover:shadow-xs'
                      : 'border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xs shrink-0 border ${
                          isNoShow
                            ? 'bg-slate-100 text-slate-800 border-slate-300'
                            : isCancelled
                            ? 'bg-slate-100 text-slate-400 border-slate-200'
                            : isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-[#FDF2F4] text-[#A3073B] border-[#F3C5D3]'
                        }`}
                      >
                        {getSpecialtyIcon(
                          apt.doctorSpecialty,
                          `w-5 h-5 ${
                            isNoShow
                              ? 'text-slate-800'
                              : isCancelled
                              ? 'text-slate-400'
                              : isCompleted
                              ? 'text-emerald-700'
                              : 'text-[#A3073B]'
                          }`
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold tracking-wider uppercase ${
                              isNoShow
                                ? 'text-slate-600'
                                : isCancelled
                                ? 'text-slate-400'
                                : isCompleted
                                ? 'text-emerald-700'
                                : 'text-[#A3073B]'
                            }`}
                          >
                            {apt.doctorSpecialty}
                          </span>
                          {isPending && index === 0 && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              Más próxima
                            </span>
                          )}
                        </div>
                        <h4 className={`text-sm font-bold leading-tight ${isCancelled ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900'}`}>
                          {cleanProfessionalName(apt.doctorName)}
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#A3073B] shrink-0" />
                          <span>{apt.location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="self-start sm:self-auto">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Cumplida
                        </span>
                      ) : isNoShow ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full bg-slate-900 text-white border border-slate-900 shadow-2xs">
                          <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
                          Inasistida
                        </span>
                      ) : isCancelled ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          {apt.status === 'rechazada' ? 'Rechazada EPS' : 'Cancelada'}
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                          {apt.status === 'confirmada' ? 'Confirmada' : 'En revisión'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Schedule pill */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white text-slate-700 border border-slate-200/60 shadow-2xs">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isCancelled ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>
                          {formatDisplayDate(apt.date)}
                        </p>
                        <p className="text-[11px] text-slate-500">{apt.reason || 'Consulta médica general'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                      <Clock className={`w-3.5 h-3.5 ${isCancelled ? 'text-slate-400' : isNoShow ? 'text-slate-700' : isCompleted ? 'text-emerald-600' : 'text-[#A3073B]'}`} />
                      <span className={`text-xs font-extrabold ${isCancelled ? 'text-slate-500' : 'text-slate-900'}`}>
                        {apt.time}
                      </span>
                    </div>
                  </div>

                  {/* Actions according to status */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    {isPending ? (
                      <>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onOpenDetail(apt, 'detail');
                              onClose();
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
                            title="Ver detalle y comprobante de cita"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            Ver cita
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onOpenDetail(apt, 'reschedule');
                              onClose();
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A3073B] hover:text-[#870530] hover:bg-[#FDF2F4] px-3 py-1.5 rounded-xl transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reprogramar
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onCancelAppointment(apt.id);
                          }}
                          className="text-xs font-semibold text-slate-400 hover:text-slate-700 px-2 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          Cancelar cita
                        </button>
                      </>
                    ) : isCompleted ? (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenDetail(apt, 'detail');
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition cursor-pointer ml-auto"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        Ver constancia e indicaciones médicas →
                      </button>
                    ) : isNoShow ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          Inasistencia registrada por el profesional • Consulta no asistida
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenDetail(apt, 'reschedule');
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A3073B] hover:text-[#870530] hover:bg-[#FDF2F4] px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Agendar de nuevo
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        {apt.status === 'rechazada' ? 'Solicitud no autorizada por EPS' : 'Cita médica cancelada • El cupo fue liberado'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-3 shrink-0">
          <p className="text-xs text-slate-400 font-medium">
            Mostrando {sortedList.length} de {appointments.length} citas registradas
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
