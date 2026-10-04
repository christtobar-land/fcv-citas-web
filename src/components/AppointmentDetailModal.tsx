import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Download, FileText, Pill, History, UserCheck, ShieldCheck, Cpu, MapPin, RotateCcw } from 'lucide-react';
import { Appointment } from '../types';
import { getSpecialtyIcon } from '../utils/specialtyIcons';
import { fetchAppointmentHistory, AppointmentHistoryItem } from '../services/appointmentApi';
import { formatDisplayDate } from '../utils/dateUtils';
import { cleanProfessionalName } from '../utils/professionalUtils';

interface AppointmentDetailModalProps {
  isOpen?: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onOpenReschedule?: (appointment: Appointment) => void;
  // Propiedades opcionales para retrocompatibilidad con tests existentes
  initialMode?: 'detail' | 'reschedule';
  onCancelAppointment?: (id: string, reason?: string) => void;
  onRescheduleAppointment?: (
    id: string,
    newDate: string,
    newTime: string,
    reason?: string,
    isoDateTime?: string
  ) => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  isOpen = true,
  appointment,
  onClose,
  onOpenReschedule,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [history, setHistory] = useState<AppointmentHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!appointment?.id) return;
    const numId = Number(appointment.id);
    if (!isNaN(numId) && numId > 0) {
      setIsLoadingHistory(true);
      fetchAppointmentHistory(numId)
        .then((data) => {
          if (isMounted) setHistory(data);
        })
        .catch(() => {
          if (isMounted) setHistory([]);
        })
        .finally(() => {
          if (isMounted) setIsLoadingHistory(false);
        });
    } else {
      setHistory([]);
    }
    return () => {
      isMounted = false;
    };
  }, [appointment?.id]);

  if (!isOpen || !appointment) return null;

  const formatHistoryDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate().toString().padStart(2, '0');
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strTime = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      return `${day} ${month} ${year}, ${strTime}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusColorConfig = (code: string) => {
    const upper = (code || '').toUpperCase();
    switch (upper) {
      case 'COMPLETED':
      case 'COMPLETADA':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-800',
          border: 'border-emerald-200',
          dot: 'bg-emerald-500',
          badgeText: 'Atendida',
        };
      case 'APPROVED':
      case 'CONFIRMED':
      case 'CONFIRMADA':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-800',
          border: 'border-blue-200',
          dot: 'bg-blue-600',
          badgeText: 'Confirmada',
        };
      case 'REQUESTED':
      case 'PENDING':
      case 'PENDIENTE':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-200',
          dot: 'bg-amber-500',
          badgeText: 'En revisión EPS',
        };
      case 'NO_SHOW':
      case 'NO_ASISTIO':
        return {
          bg: 'bg-slate-900',
          text: 'text-white',
          border: 'border-slate-900',
          dot: 'bg-slate-700',
          badgeText: 'Inasistida',
        };
      case 'CANCELLED':
      case 'CANCELADA':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-800',
          border: 'border-rose-200',
          dot: 'bg-rose-500',
          badgeText: 'Cancelada',
        };
      case 'REJECTED':
      case 'RECHAZADA':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-800',
          border: 'border-rose-200',
          dot: 'bg-rose-600',
          badgeText: 'Rechazada EPS',
        };
      default:
        return {
          bg: 'bg-slate-50',
          text: 'text-slate-800',
          border: 'border-slate-200',
          dot: 'bg-slate-400',
          badgeText: code || 'Registrada',
        };
    }
  };

  const getActorIcon = (source: string) => {
    if (source === 'ADMIN') return <ShieldCheck className="w-3.5 h-3.5 text-[#A3073B]" />;
    if (source === 'SYSTEM') return <Cpu className="w-3.5 h-3.5 text-slate-500" />;
    return <UserCheck className="w-3.5 h-3.5 text-slate-600" />;
  };

  const handleDownloadProof = () => {
    setIsDownloading(true);
    try {
      const text = `================================================
MEDIHEALTH PLUS - CONSTANCIA DE CITA MÉDICA
================================================
ID CITA: ${appointment.id}
PACIENTE: ${appointment.patientName} (${appointment.patientDocument || 'Afiliado Activo'})
PROFESIONAL: ${cleanProfessionalName(appointment.doctorName)}
ESPECIALIDAD: ${appointment.doctorSpecialty}
SEDE: ${appointment.location}
FECHA Y HORA: ${formatDisplayDate(appointment.date)} a las ${appointment.time}
ESTADO: ${appointment.status.toUpperCase()}
${appointment.prescription ? `\nDIAGNÓSTICO MÉDICO: ${appointment.prescription.diagnosis}\nINDICACIONES: ${appointment.prescription.notes}` : ''}
================================================
Constancia médica generada con firma y registro asistencial digital.`;

      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      if (typeof window !== 'undefined' && typeof window.URL?.createObjectURL === 'function') {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `comprobante-medihealth-${appointment.id}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (typeof window.URL?.revokeObjectURL === 'function') {
          window.URL.revokeObjectURL(url);
        }
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-detail-title"
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        id="appointment-detail-modal"
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A3073B]">
              Expediente Asistencial
            </span>
            <h2 id="modal-detail-title" className="text-base font-bold text-slate-900 leading-tight">
              Detalle de Consulta Médica
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                appointment.status === 'confirmada'
                  ? 'bg-slate-100 text-slate-800 border-slate-200'
                  : appointment.status === 'completada'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : appointment.status === 'pendiente'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : appointment.status === 'no_asistio'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {appointment.status === 'confirmada'
                ? 'Confirmada'
                : appointment.status === 'completada'
                ? 'Atendida'
                : appointment.status === 'pendiente'
                ? 'En revisión EPS'
                : appointment.status === 'no_asistio'
                ? 'Inasistida'
                : appointment.status === 'rechazada'
                ? 'Rechazada EPS'
                : 'Cancelada'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scroll">
          
          {/* Doctor Header Card */}
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="w-14 h-14 rounded-2xl bg-[#FDF2F4] text-[#A3073B] border border-[#F3C5D3] flex items-center justify-center shadow-2xs shrink-0">
              {getSpecialtyIcon(appointment.doctorSpecialty, 'w-7 h-7 text-[#A3073B]')}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-[#A3073B] uppercase tracking-wider block">
                {appointment.doctorSpecialty}
              </span>
              <h3 className="text-base font-bold text-slate-900 leading-tight truncate">
                {cleanProfessionalName(appointment.doctorName)}
              </h3>
            </div>
          </div>

          {/* Sede de Atención Médica destacada */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white text-[#A3073B] border border-[#F3C5D3] shadow-2xs shrink-0">
              <MapPin className="w-5 h-5 text-[#A3073B]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold text-[#A3073B] uppercase tracking-wider block">
                Sede de Atención
              </span>
              <p className="text-xs font-bold text-slate-900 truncate">
                {appointment.location || 'Sede Principal MediHealth'}
              </p>
            </div>
          </div>

          {/* Schedule Detail Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white text-slate-700 border border-slate-200/60 shadow-xs">
                <Calendar className="w-4 h-4 text-[#A3073B]" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fecha</span>
                <span className="text-xs font-bold text-slate-800">{formatDisplayDate(appointment.date)}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white text-slate-700 border border-slate-200/60 shadow-xs">
                <Clock className="w-4 h-4 text-[#A3073B]" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hora</span>
                <span className="text-xs font-bold text-slate-800">{appointment.time}</span>
              </div>
            </div>
          </div>

          {/* Diagnóstico e Indicaciones Médicas (si aplica para citas atendidas) */}
          {appointment.prescription && (
            <div className="p-4.5 rounded-2xl bg-[#FDF2F4] border border-[#F3C5D3] space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#A3073B]" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#A3073B]">
                  Diagnóstico e Indicaciones Médicas
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 bg-white/70 p-2.5 rounded-xl border border-[#F3C5D3]/60">
                {appointment.prescription.diagnosis}
              </p>
              {appointment.prescription.notes && (
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {appointment.prescription.notes}
                </p>
              )}
              {appointment.prescription.medicines.length > 0 && (
                <div className="pt-2 border-t border-[#F3C5D3]/70 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                    <Pill className="w-3 h-3 text-[#A3073B]" />
                    Medicamentos Formulados:
                  </span>
                  <div className="space-y-1">
                    {appointment.prescription.medicines.map((med, idx) => (
                      <div key={idx} className="text-xs text-slate-800 font-medium bg-white/60 p-2 rounded-lg">
                        • <span className="font-bold">{med.name}</span> — {med.dose} ({med.frequency} por {med.duration})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trazabilidad y Línea de Tiempo de Estados (HU-032) */}
          <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#A3073B]" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#A3073B]">
                  Línea de Tiempo y Auditoría de Estados
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">
                Registro inmutable
              </span>
            </div>

            {isLoadingHistory ? (
              <div className="py-4 text-center">
                <div className="inline-block w-5 h-5 border-2 border-slate-200 border-t-[#A3073B] rounded-full animate-spin mb-1"></div>
                <p className="text-xs text-slate-500">Cargando trazabilidad del expediente...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                <div className="relative">
                  <div
                    className={`absolute -left-6 top-1 w-3 h-3 rounded-full ring-4 ring-white ${getStatusColorConfig(appointment.status).dot}`}
                    aria-hidden="true"
                  />
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColorConfig(appointment.status).bg} ${getStatusColorConfig(appointment.status).text} ${getStatusColorConfig(appointment.status).border}`}
                      >
                        {getStatusColorConfig(appointment.status).badgeText}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatDisplayDate(appointment.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#A3073B]" />
                      <span className="font-semibold text-slate-800">Expediente Digital MediHealth</span>
                    </div>
                    {appointment.reason && (
                      <p className="text-xs text-slate-600 mt-1.5 italic bg-white/80 p-2 rounded-lg border border-slate-200/60">
                        {appointment.reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {history.map((item, idx) => {
                  const statusConfig = getStatusColorConfig(item.statusCode);
                  return (
                    <div key={item.id || idx} className="relative group">
                      <div
                        className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full ring-4 ring-white ${statusConfig.dot}`}
                        aria-hidden="true"
                      />
                      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 hover:bg-slate-50 transition">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                          >
                            {item.statusName || statusConfig.badgeText}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatHistoryDate(item.changedAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                          {getActorIcon(item.changeSource)}
                          <span className="font-semibold text-slate-800">{item.changedByName || 'Usuario'}</span>
                          <span className="text-[10px] text-slate-400">({item.changeSource})</span>
                        </div>

                        {item.reason && (
                          <p className="text-xs text-slate-600 mt-1.5 italic bg-white/80 p-2 rounded-lg border border-slate-200/60">
                            {item.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between gap-2 bg-white flex-wrap">
          <button
            type="button"
            onClick={handleDownloadProof}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'Generando...' : 'Descargar Constancia'}</span>
          </button>

          <div className="flex items-center gap-2">
            {onOpenReschedule && !appointment.isTerminal && appointment.status !== 'cancelada' && appointment.status !== 'completada' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReschedule(appointment);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#A3073B] hover:bg-[#870530] transition cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reprogramar Cita</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
