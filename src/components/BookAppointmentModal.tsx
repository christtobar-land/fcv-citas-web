import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, CheckCircle2, ChevronRight, ShieldCheck, ChevronDown } from 'lucide-react';
import { Appointment, Doctor } from '../types';
import { DOCTORS, SEDES, SPECIALTIES } from '../data/mockData';
import { getTodayIso, formatDisplayDate } from '../utils/dateUtils';
import { cleanProfessionalName } from '../utils/professionalUtils';
import { CustomSelect } from './CustomSelect';
import { CustomDatePicker } from './CustomDatePicker';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentBooked: (appointment: Appointment) => void;
  patientName: string;
  patientId: string;
  existingAppointments?: Appointment[];
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  onAppointmentBooked,
  patientName,
  patientId,
  existingAppointments = [],
}) => {
  const [selectedSedeId, setSelectedSedeId] = useState<string>('el-bosque');
  const [selectedSpecialtyName, setSelectedSpecialtyName] = useState<string>('Medicina General');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(DOCTORS[0]?.id || 'doc-1');
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayIso());
  const [selectedTime, setSelectedTime] = useState<string>('08:30 AM');
  const [reason, setReason] = useState<string>('Control de salud preventivo');
  const [referralCode, setReferralCode] = useState<string>('');

  if (!isOpen) return null;

  const currentSede = SEDES.find((s) => s.id === selectedSedeId) || SEDES[0];
  const currentSpecialty = SPECIALTIES.find((s) => s.name === selectedSpecialtyName) || SPECIALTIES[0];
  const currentDoctor = DOCTORS.find((d) => d.id === selectedDoctorId) || DOCTORS[0];

  const timeSlots = ['08:00 AM', '08:30 AM', '09:30 AM', '10:00 AM', '11:00 AM', '02:00 PM'];

  const isTimeSlotConflicting = (slotStr: string): boolean => {
    if (!existingAppointments || existingAppointments.length === 0) return false;
    let hour = parseInt(slotStr.substring(0, 2), 10);
    const isPm = slotStr.toUpperCase().includes('PM');
    if (isPm && hour < 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
    const min = slotStr.substring(3, 5);
    const slotStartIso = `${selectedDate}T${String(hour).padStart(2, '0')}:${min}:00`;
    const slotStartTime = new Date(slotStartIso).getTime();
    const slotEndTime = slotStartTime + 30 * 60 * 1000;

    return existingAppointments.some((apt) => {
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

  const handleFinishBooking = () => {
    const isGeneral = currentSpecialty.isGeneral ?? false;
    const locationId = currentSede.id.includes('norte') ? 2 : 1;
    let specialtyId = 1;
    const spec = currentSpecialty.name.toLowerCase();
    if (spec.includes('cardio')) specialtyId = 2;
    else if (spec.includes('pediat')) specialtyId = 5;
    else if (spec.includes('ortop')) specialtyId = 11;
    else if (spec.includes('neuro')) specialtyId = 12;

    const professionalId = parseInt(currentDoctor.id.replace(/\D/g, ''), 10) || 1;

    let hour = parseInt(selectedTime.substring(0, 2), 10);
    const isPm = selectedTime.toUpperCase().includes('PM');
    if (isPm && hour < 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
    const min = selectedTime.substring(3, 5);
    const scheduledStartAt = `${selectedDate}T${String(hour).padStart(2, '0')}:${min}:00`;

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      doctorId: currentDoctor.id,
      doctorName: currentDoctor.name,
      doctorSpecialty: currentSpecialty.name,
      doctorAvatar: currentDoctor.avatar,
      patientId: patientId || 'usr-101',
      patientName: patientName || 'Carlos Andrés Méndez',
      patientDocument: 'CC 92.000.100',
      date: selectedDate,
      time: selectedTime,
      location: currentSede.name,
      room: currentDoctor.room || 'Consultorio 204',
      type: 'presencial',
      status: isGeneral ? 'confirmada' : 'pendiente',
      reason: reason.trim() || 'Consulta médica programada',
      notes: isGeneral
        ? 'Confirmada automáticamente. Asistir con 15 minutos de antelación.'
        : referralCode
        ? `Autorización EPS registrada: ${referralCode}`
        : 'Pendiente de autorización EPS para especialista.',
      locationId,
      specialtyId,
      professionalId,
      scheduledStartAt,
      referralCode: referralCode.trim() || undefined,
    };

    onAppointmentBooked(newAppointment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        id="book-appointment-modal"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#A3073B] to-[#870530] flex items-center justify-center text-white shadow-xs">
              <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A3073B] block">
                Agendamiento Rápido
              </span>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Pedir Nueva Cita Médica
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scroll">
          
          {/* Step 1: Sede */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
              1. Sede de Atención
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SEDES.map((sede) => {
                const isSelected = selectedSedeId === sede.id;
                return (
                  <button
                    key={sede.id}
                    type="button"
                    onClick={() => setSelectedSedeId(sede.id)}
                    className={`p-3.5 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'border-2 border-[#A3073B] bg-white shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isSelected ? 'text-[#A3073B]' : 'text-slate-400'}`}>
                        {sede.tag}
                      </span>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${isSelected ? 'bg-[#A3073B]' : 'border border-slate-300'}`}>
                        {isSelected && <span className="text-[10px]">✓</span>}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-900">{sede.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{sede.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Especialidad */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                2. Especialidad Médica
              </label>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {currentSpecialty.subtitle}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SPECIALTIES.map((spec) => {
                const isSelected = selectedSpecialtyName === spec.name;
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => setSelectedSpecialtyName(spec.name)}
                    className={`p-3 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'bg-[#A3073B] text-white border-2 border-[#A3073B] shadow-sm'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-bold">{spec.name}</p>
                    <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                      {spec.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3 & 4: Médico y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                3. Médico Especialista
              </label>
              <CustomSelect
                value={selectedDoctorId}
                onChange={(val) => setSelectedDoctorId(val)}
                options={DOCTORS.map((doc) => ({
                  value: doc.id,
                  label: `${cleanProfessionalName(doc.name)} (${doc.specialty})`,
                }))}
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                4. Fecha Deseada
              </label>
              <CustomDatePicker
                value={selectedDate}
                min={getTodayIso()}
                onChange={(newD) => setSelectedDate(newD)}
              />
            </div>
          </div>

          {/* Step 5: Horarios */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
              5. Horario Disponible
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {timeSlots.map((slot) => {
                const isSelected = selectedTime === slot;
                const isConflicting = isTimeSlotConflicting(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isConflicting}
                    title={isConflicting ? 'Ya cuentas con una cita médica programada en este horario' : undefined}
                    onClick={() => !isConflicting && setSelectedTime(slot)}
                    className={`p-2.5 rounded-2xl text-center transition ${
                      isConflicting
                        ? 'border border-amber-200/90 bg-amber-50/70 text-slate-400 cursor-not-allowed opacity-85'
                        : isSelected
                        ? 'border-2 border-[#A3073B] bg-[#FDF2F4] text-[#A3073B]'
                        : 'border border-slate-200 bg-white hover:border-[#A3073B]/40'
                    }`}
                  >
                    <p className={`text-xs font-extrabold ${isConflicting ? 'text-amber-800 line-through decoration-amber-400' : isSelected ? 'text-[#A3073B]' : 'text-slate-800'}`}>
                      {slot}
                    </p>
                    <p className={`text-[9px] font-bold ${isConflicting ? 'text-amber-700' : isSelected ? 'text-[#A3073B]' : 'text-slate-400'}`}>
                      {isConflicting ? 'Ocupado' : isSelected ? 'Elegido' : 'Libre'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Referral Code (Especialista) */}
          {!currentSpecialty.isGeneral && (
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                Código de Autorización EPS u Orden Médica
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Ej. AUT-2026-99182 o código EPS"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3 text-xs font-medium text-slate-800"
              />
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
              Motivo o Síntomas (Opcional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Chequeo preventivo de tensión, dolor articular..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3 text-xs font-medium text-slate-800"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <div>
            <p className="text-xs font-bold text-slate-800">
              {selectedSpecialtyName} con {currentDoctor.name}
            </p>
            <p className="text-[11px] text-slate-500">
              {currentSede.name} • {formatDisplayDate(selectedDate)} a las {selectedTime}
            </p>
          </div>
          <button
            type="button"
            disabled={isTimeSlotConflicting(selectedTime)}
            onClick={handleFinishBooking}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-2xl font-bold text-xs shadow-md transition ${
              isTimeSlotConflicting(selectedTime)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#A3073B] hover:bg-[#870530] text-white cursor-pointer'
            }`}
          >
            Confirmar Cita
          </button>
        </div>

      </div>
    </div>
  );
};
