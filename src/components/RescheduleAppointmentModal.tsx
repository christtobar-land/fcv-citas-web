import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, RotateCcw, Check, Users, AlertCircle, MapPin, ChevronDown } from 'lucide-react';
import { Appointment } from '../types';
import { fetchAvailableSlots, type AvailableSlot } from '../services/appointmentApi';
import { getSpecialtyIcon } from '../utils/specialtyIcons';

interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  existingAppointments?: Appointment[];
  onClose: () => void;
  onRescheduleAppointment: (
    id: string,
    newDate: string,
    newTime: string,
    reason?: string,
    isoDateTime?: string,
    professionalId?: number
  ) => Promise<void> | void;
}
import {
  getTodayIso,
  getUpcomingDays,
  formatDisplayDate,
  formatTimeFromIso,
} from '../utils/dateUtils';
import { CustomSelect } from './CustomSelect';
import { CustomDatePicker } from './CustomDatePicker';

export const RescheduleAppointmentModal: React.FC<RescheduleAppointmentModalProps> = ({
  isOpen,
  appointment,
  existingAppointments = [],
  onClose,
  onRescheduleAppointment,
}) => {
  const [selectedProfessionalOption, setSelectedProfessionalOption] = useState<'same' | 'all'>('same');
  const [selectedLocationId, setSelectedLocationId] = useState<number>(1);
  const [newDate, setNewDate] = useState(() => appointment?.date || getTodayIso());
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('Inconveniente de horario o laboral');

  const cleanDoctorName = (name?: string): string => {
    if (!name) return 'Especialista';
    return name.replace(/^(Dr\(a\)\.\s*|Dr\.\s*|Dra\.\s*)/i, '').trim();
  };

  useEffect(() => {
    if (appointment?.date) {
      setNewDate(appointment.date);
    }
    const locId = appointment?.locationId || (appointment?.location.toLowerCase().includes('norte') ? 2 : 1);
    setSelectedLocationId(locId);
    setSelectedProfessionalOption('same');
    setSelectedSlot(null);
  }, [appointment, isOpen]);

  useEffect(() => {
    if (!isOpen || !appointment) return;

    let active = true;
    setIsLoadingSlots(true);
    setSelectedSlot(null);

    const originalProfId = appointment.professionalId || (parseInt(appointment.doctorId.replace(/\D/g, ''), 10) || 1);
    const specId = appointment.specialtyId || 1;

    // Si el usuario elige 'same', filtramos por el médico actual; si elige 'all', dejamos professionalId undefined para consultar dentro de la misma especialidad
    const profIdParam = selectedProfessionalOption === 'same' ? originalProfId : undefined;

    fetchAvailableSlots({
      locationId: selectedLocationId,
      specialtyId: specId,
      professionalId: profIdParam,
      date: newDate,
    })
      .then((slots) => {
        if (!active) return;
        // Excluir la franja actual de la cita si coincide exactamente
        const filtered = slots.filter((s) => s.startAt !== appointment.scheduledStartAt);
        setAvailableSlots(filtered);
        setIsLoadingSlots(false);
      })
      .catch((err) => {
        if (!active) return;
        console.warn('Fallo consulta de franjas para reprogramación:', err);
        setAvailableSlots([]);
        setIsLoadingSlots(false);
      })
      .finally(() => {
        if (active) setIsLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, appointment, newDate, selectedLocationId, selectedProfessionalOption]);

  if (!isOpen || !appointment) return null;

  const handleConfirm = async () => {
    if (!selectedSlot || !appointment) return;
    setIsSubmitting(true);
    try {
      const slotTime = formatTimeFromIso(selectedSlot.startAt);
      const slotDate = selectedSlot.startAt.split('T')[0];
      await onRescheduleAppointment(
        appointment.id,
        slotDate,
        slotTime,
        rescheduleReason,
        selectedSlot.startAt,
        selectedSlot.professionalId
      );
      onClose();
    } catch {
      // Manejado en el banner global
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSlotConflicting = (slot: AvailableSlot): boolean => {
    if (!existingAppointments || existingAppointments.length === 0) return false;
    const slotStartTime = new Date(slot.startAt).getTime();
    const slotEndTime = new Date(slot.endAt).getTime();
    return existingAppointments.some((apt) => {
      if (apt.id === appointment?.id) return false;
      if (apt.status === 'cancelada' || apt.status === 'completada') return false;
      let aptStart = 0;
      let aptEnd = 0;
      if (apt.scheduledStartAt) {
        aptStart = new Date(apt.scheduledStartAt).getTime();
        aptEnd = aptStart + 30 * 60 * 1000;
      } else if (apt.date && apt.time) {
        const aptIso = `${apt.date}T${apt.time.length === 5 ? apt.time + ':00' : apt.time}`;
        aptStart = new Date(aptIso).getTime();
        aptEnd = aptStart + 30 * 60 * 1000;
      }
      if (!aptStart) return false;
      return slotStartTime < aptEnd && slotEndTime > aptStart;
    });
  };

  const doctorDisplayName = cleanDoctorName(appointment.doctorName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reschedule-title"
    >
      <div
        className="w-full max-w-2xl sm:max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
        id="reschedule-appointment-modal"
      >
        {/* Modal Header */}
        <div className="px-6 sm:px-7 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FDF2F4] text-[#A3073B] border border-[#F3C5D3] flex items-center justify-center shadow-2xs">
              <RotateCcw className="w-4.5 h-4.5 text-[#A3073B]" />
            </div>
            <div>
              <h2 id="modal-reschedule-title" className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Reprogramar Cita Médica
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Selecciona una nueva fecha y franja horaria para tu atención asistencial
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8.5 h-8.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-5 flex-1 custom-scroll">
          
          {/* Recuadro del Profesional con Horario de la Cita Actual a la Derecha */}
          <div className="p-4.5 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Lado izquierdo: Especialista y sede */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#FDF2F4] text-[#A3073B] border border-[#F3C5D3] flex items-center justify-center shadow-2xs shrink-0">
                {getSpecialtyIcon(appointment.doctorSpecialty, 'w-6.5 h-6.5 sm:w-7 sm:h-7 text-[#A3073B]')}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#A3073B] uppercase tracking-wider bg-[#FDF2F4] px-2.5 py-0.5 rounded-full border border-[#F3C5D3] inline-block">
                    {appointment.doctorSpecialty}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    #{appointment.id}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight mt-1 truncate">
                  Especialista {doctorDisplayName}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {appointment.location} {appointment.room ? `• ${appointment.room}` : ''}
                </p>
              </div>
            </div>

            {/* Lado derecho: Horario actual (como en el wizard) */}
            <div className="sm:text-right flex flex-col sm:items-end justify-center shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200/70 sm:pl-5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Horario actual:
              </span>
              <span className="text-sm font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5 sm:justify-end">
                <Calendar className="w-3.5 h-3.5 text-[#A3073B]" />
                {formatDisplayDate(appointment.date)}
              </span>
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 sm:justify-end mt-0.5">
                <Clock className="w-3.5 h-3.5 text-[#A3073B]" />
                {appointment.time}
              </span>
              <span className="mt-1.5 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#FDF2F4] text-[#A3073B] border border-[#F3C5D3] inline-block">
                Cita por reprogramar
              </span>
            </div>
          </div>

          {/* Selector de Sede de Atención */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-800">
              Sede de Atención
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedLocationId(1);
                  setSelectedSlot(null);
                }}
                className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between cursor-pointer ${
                  selectedLocationId === 1
                    ? 'bg-[#FDF2F4] border-[#A3073B] text-slate-900 shadow-2xs font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <div>
                  <span className="block text-xs sm:text-sm font-bold">Sede El Bosque</span>
                  <span className="block text-[11px] text-slate-500 font-normal">Sede Principal</span>
                </div>
                {selectedLocationId === 1 && (
                  <div className="w-4.5 h-4.5 rounded-full bg-[#A3073B] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-3" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedLocationId(2);
                  setSelectedSlot(null);
                }}
                className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between cursor-pointer ${
                  selectedLocationId === 2
                    ? 'bg-[#FDF2F4] border-[#A3073B] text-slate-900 shadow-2xs font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <div>
                  <span className="block text-xs sm:text-sm font-bold">Sede Norte</span>
                  <span className="block text-[11px] text-slate-500 font-normal">Sede Alterna</span>
                </div>
                {selectedLocationId === 2 && (
                  <div className="w-4.5 h-4.5 rounded-full bg-[#A3073B] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-3" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Selector de Disponibilidad: Mismo Especialista vs Todos los Especialistas de la Especialidad */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-800">
              Disponibilidad de Especialistas
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedProfessionalOption('same')}
                className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center justify-between cursor-pointer ${
                  selectedProfessionalOption === 'same'
                    ? 'bg-[#FDF2F4] border-[#A3073B] text-slate-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <span className="block truncate font-bold text-xs sm:text-sm text-slate-900">
                    Solo con {doctorDisplayName}
                  </span>
                  <span className="block text-xs text-slate-500 font-normal mt-0.5">
                    Mantiene el especialista asignado
                  </span>
                </div>
                {selectedProfessionalOption === 'same' && (
                  <div className="w-4.5 h-4.5 rounded-full bg-[#A3073B] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-3" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedProfessionalOption('all')}
                className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center justify-between cursor-pointer ${
                  selectedProfessionalOption === 'all'
                    ? 'bg-[#FDF2F4] border-[#A3073B] text-slate-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <span className="block truncate font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#A3073B]" />
                    Cualquier especialista disponible
                  </span>
                  <span className="block text-xs text-slate-500 font-normal mt-0.5">
                    Más cupos en {appointment.doctorSpecialty}
                  </span>
                </div>
                {selectedProfessionalOption === 'all' && (
                  <div className="w-4.5 h-4.5 rounded-full bg-[#A3073B] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-3" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Selector de Nueva Fecha */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="reschedule-date-input" className="text-xs sm:text-sm font-bold text-slate-800">
                Nueva Fecha de Consulta
              </label>
              <div className="flex items-center gap-1.5">
                {getUpcomingDays(appointment?.date && appointment.date < getTodayIso() ? appointment.date : getTodayIso(), 3).map((chip) => (
                  <button
                    key={chip.iso}
                    type="button"
                    onClick={() => {
                      setNewDate(chip.iso);
                      setSelectedSlot(null);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      newDate === chip.iso
                        ? 'bg-[#A3073B] text-white border-[#A3073B] shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <CustomDatePicker
              id="reschedule-date-input"
              value={newDate}
              min={appointment?.date && appointment.date < getTodayIso() ? appointment.date : getTodayIso()}
              onChange={(newD) => {
                setNewDate(newD);
                setSelectedSlot(null);
              }}
            />
          </div>

          {/* Grid de Franjas Horarias Disponibles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-slate-800">
                Franjas Horarias Disponibles
              </label>
              <span className="text-xs font-bold text-slate-500">
                {availableSlots.length} {availableSlots.length === 1 ? 'cupo encontrado' : 'cupos encontrados'}
              </span>
            </div>

            {isLoadingSlots ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-500">
                <span className="w-4 h-4 border-2 border-[#A3073B] border-t-transparent rounded-full animate-spin" />
                Consultando disponibilidad médica en tiempo real...
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto pr-1 custom-scroll">
                {availableSlots.map((slot) => {
                  const timeStr = formatTimeFromIso(slot.startAt);
                  const isSelected = selectedSlot?.slotId === slot.slotId;
                  const isDifferentDoctor = slot.professionalId !== (appointment.professionalId || 1);
                  const slotDoctorName = cleanDoctorName(slot.professionalName);
                  const isConflicting = isSlotConflicting(slot);

                  return (
                    <button
                      key={slot.slotId}
                      type="button"
                      disabled={isConflicting}
                      title={isConflicting ? 'Ya cuentas con una cita médica programada en este horario' : undefined}
                      onClick={() => !isConflicting && setSelectedSlot(slot)}
                      className={`p-3 rounded-2xl text-left transition border ${
                        isConflicting
                          ? 'bg-amber-50/70 border-amber-200/90 text-slate-400 cursor-not-allowed opacity-85'
                          : isSelected
                          ? 'bg-[#A3073B] text-white shadow-2xs border-[#A3073B] cursor-pointer'
                          : 'bg-white hover:bg-[#FDF2F4]/40 text-slate-800 border-slate-200 shadow-2xs cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs sm:text-sm font-extrabold ${isConflicting ? 'text-amber-800 line-through decoration-amber-400' : isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {timeStr}
                        </span>
                        {isSelected && !isConflicting && <Check className="w-3.5 h-3.5 text-white shrink-0 stroke-3" />}
                        {isConflicting && (
                          <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100/90 border border-amber-200/70 px-1.5 py-0.5 rounded shrink-0">
                            Ya tienes cita
                          </span>
                        )}
                      </div>
                      {selectedProfessionalOption === 'all' && !isConflicting && (
                        <span
                          className={`block text-[11px] mt-0.5 truncate font-medium ${
                            isSelected
                              ? 'text-white/80'
                              : isDifferentDoctor
                              ? 'text-[#A3073B] font-semibold'
                              : 'text-slate-500'
                          }`}
                        >
                          {slotDoctorName}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center text-xs sm:text-sm text-slate-500 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  No hay franjas disponibles para esta fecha y sede. Prueba seleccionando otra fecha, cambiando de sede o activando &quot;Cualquier especialista disponible&quot;.
                </span>
              </div>
            )}
          </div>

          {/* Banner de Confirmación de Selección */}
          {selectedSlot && (
            <div className="p-4 rounded-2xl bg-[#FDF2F4] border border-[#F3C5D3] text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs">
              <div>
                <span className="font-extrabold block text-[11px] uppercase tracking-wider text-[#A3073B]">
                  Nueva cita seleccionada:
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                  {formatDisplayDate(selectedSlot.startAt.split('T')[0])} a las {formatTimeFromIso(selectedSlot.startAt)} • Especialista {cleanDoctorName(selectedSlot.professionalName)} ({selectedSlot.locationName})
                </span>
              </div>
              <div className="w-7 h-7 rounded-xl bg-[#A3073B] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Check className="w-4 h-4 stroke-3" />
              </div>
            </div>
          )}

          {/* Motivo de la Reprogramación */}
          <div className="space-y-1">
            <label htmlFor="reschedule-reason-select" className="block text-xs font-bold text-slate-700 uppercase">
              Motivo del cambio
            </label>
            <CustomSelect
              id="reschedule-reason-select"
              value={rescheduleReason}
              onChange={setRescheduleReason}
              options={[
                { value: 'Inconveniente de horario o laboral', label: 'Inconveniente de horario o laboral' },
                { value: 'Cambio de turno por viaje o reubicación', label: 'Viaje o desplazamiento fuera de la ciudad' },
                { value: 'Calamidad personal o familiar', label: 'Calamidad personal o de fuerza mayor' },
                { value: 'Preferencia de otro horario o especialista', label: 'Preferencia por otro horario o especialista' },
              ]}
              className="w-full"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-7 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white shrink-0">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Volver
          </button>
          <button
            type="button"
            disabled={!selectedSlot || isSubmitting}
            onClick={handleConfirm}
            className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
              selectedSlot && !isSubmitting
                ? 'bg-[#A3073B] hover:bg-[#870530] text-white shadow-sm'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Confirmando cambio...</span>
              </>
            ) : (
              <span>Confirmar Reprogramación</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
