import React, { useState } from 'react';
import { Calendar, Clock, MapPin, AlertCircle, Sparkles, X, Check } from 'lucide-react';
import { LocationItem, createAvailabilityBlock, AvailabilityBlockItem } from '../services/appointmentApi';
import { getTodayIso } from '../utils/dateUtils';
import { CustomDatePicker } from './CustomDatePicker';

interface CreateAvailabilityBlockModalProps {
  locations: LocationItem[];
  professionalId?: number;
  initialDate?: string;
  onClose: () => void;
  onSuccess: (newBlock: AvailabilityBlockItem) => void;
}

export const CreateAvailabilityBlockModal: React.FC<CreateAvailabilityBlockModalProps> = ({
  locations,
  professionalId = 1,
  initialDate,
  onClose,
  onSuccess,
}) => {
  const activeLocations = locations.filter((l) => l.active !== false);
  const [selectedLocationId, setSelectedLocationId] = useState<number>(activeLocations[0]?.id || locations[0]?.id || 1);
  const [availableDate, setAvailableDate] = useState<string>(() => initialDate || getTodayIso());
  const [preset, setPreset] = useState<'morning' | 'afternoon' | 'full' | 'custom'>('morning');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePresetSelect = (p: 'morning' | 'afternoon' | 'full' | 'custom') => {
    setPreset(p);
    setErrorMessage(null);
    if (p === 'morning') {
      setStartTime('08:00');
      setEndTime('12:00');
    } else if (p === 'afternoon') {
      setStartTime('14:00');
      setEndTime('18:00');
    } else if (p === 'full') {
      setStartTime('08:00');
      setEndTime('17:00');
    }
  };

  // Helper para calcular cuántos slots de 30 minutos se generarán
  const calculateSlotCount = (): number => {
    try {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      const diff = endMin - startMin;
      return diff > 0 && diff % 30 === 0 ? diff / 30 : 0;
    } catch {
      return 0;
    }
  };

  const slotCount = calculateSlotCount();
  const selectedLocation = locations.find((l) => l.id === selectedLocationId) || locations[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (slotCount <= 0) {
      setErrorMessage('La hora de fin debe ser posterior a la de inicio en intervalos de 30 minutos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;
      const formattedEndTime = endTime.length === 5 ? `${endTime}:00` : endTime;

      const created = await createAvailabilityBlock({
        professionalId,
        locationId: selectedLocationId,
        availableDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
      });

      onSuccess(created);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al registrar la franja de disponibilidad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A3073B]">
              Gestión de Agenda Médica
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
              Publicar Franja de Disponibilidad
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Habilita cupos de atención directa para que los pacientes puedan agendar sus citas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sede Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#A3073B]" />
              Sede de Atención Presencial
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeLocations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setSelectedLocationId(loc.id)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    selectedLocationId === loc.id
                      ? 'border-[#A3073B] bg-[#A3073B]/5 ring-1 ring-[#A3073B]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900">{loc.name}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 truncate">{loc.city}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#A3073B]" />
              Fecha de la Franja
            </label>
            <CustomDatePicker
              value={availableDate}
              onChange={setAvailableDate}
              min={initialDate && initialDate < getTodayIso() ? initialDate : getTodayIso()}
              className="w-full"
            />
          </div>

          {/* Presets de Jornada */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#A3073B]" />
              Turno / Horario de Atención
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2.5">
              <button
                type="button"
                onClick={() => handlePresetSelect('morning')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                  preset === 'morning'
                    ? 'bg-[#A3073B] text-white border-[#A3073B] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Mañana
                <span className="block text-[10px] font-normal opacity-90">08:00 - 12:00</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('afternoon')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                  preset === 'afternoon'
                    ? 'bg-[#A3073B] text-white border-[#A3073B] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tarde
                <span className="block text-[10px] font-normal opacity-90">14:00 - 18:00</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('custom')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                  preset === 'custom'
                    ? 'bg-[#A3073B] text-white border-[#A3073B] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Personalizado
                <span className="block text-[10px] font-normal opacity-90">Definir horas</span>
              </button>
            </div>

            {/* Custom Time inputs if custom preset */}
            {preset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl animate-fade-in">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    step="1800"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50/50 focus:outline-none focus:border-[#A3073B] focus:ring-2 focus:ring-[#A3073B]/20 transition cursor-pointer shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Hora Fin</label>
                  <input
                    type="time"
                    step="1800"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50/50 focus:outline-none focus:border-[#A3073B] focus:ring-2 focus:ring-[#A3073B]/20 transition cursor-pointer shadow-2xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Resumen dinámico y generación automática de cupos */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Cupos de 30 min a generar:</span>
              <span className="font-extrabold text-[#A3073B] bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                {slotCount > 0 ? `${slotCount} cupos` : 'Horario inválido'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Sede seleccionada:</span>
              <span className="font-bold text-slate-800">{selectedLocation?.name}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Horario continuo:</span>
              <span className="font-bold text-slate-800">{startTime} a {endTime}</span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
              Al guardar, los {slotCount} cupos quedarán inmediatamente disponibles para agendamiento por parte de los pacientes afiliados.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || slotCount <= 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#A3073B] hover:bg-[#870530] shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                'Publicando...'
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Publicar Disponibilidad</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
