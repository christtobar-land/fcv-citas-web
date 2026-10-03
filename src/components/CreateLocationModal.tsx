import React, { useState } from 'react';
import { Building2, X, AlertCircle, Check, MapPin, Hash } from 'lucide-react';
import { LocationItem, createAdminLocation } from '../services/appointmentApi';
import { CustomSelect } from './CustomSelect';

interface CreateLocationModalProps {
  onClose: () => void;
  onSuccess: (newLocation: LocationItem) => void;
}

export const CreateLocationModal: React.FC<CreateLocationModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Floridablanca');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!code.trim()) {
      setErrorMessage('El código de la sede es obligatorio.');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('El nombre de la sede es obligatorio.');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('La dirección es obligatoria.');
      return;
    }
    if (!city.trim()) {
      setErrorMessage('La ciudad es obligatoria.');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createAdminLocation({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
      });
      onSuccess(created);
    } catch (err: any) {
      console.error('Error registrando sede:', err);
      setErrorMessage(
        err?.message || 'Error al registrar la sede. Verifica que el código no esté repetido.'
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
              <Building2 className="w-5 h-5 text-[#A3073B]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Registrar Nueva Sede</h2>
              <p className="text-xs text-slate-500">
                Añade un punto de atención presencial a la red de salud
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
              Código Institucional <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="Ej. HIC-SUR, SEDE-CAB"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A3073B] font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nombre de la Sede <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Sede Cañaveral Especialistas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A3073B]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Dirección Completa <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="Ej. Calle 30 # 25-18, Urbanización Cañaveral"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A3073B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ciudad / Municipio <span className="text-rose-500">*</span>
            </label>
            <CustomSelect
              value={city}
              onChange={setCity}
              options={[
                { value: 'Floridablanca', label: 'Floridablanca' },
                { value: 'Piedecuesta', label: 'Piedecuesta' },
                { value: 'Bucaramanga', label: 'Bucaramanga' },
                { value: 'Girón', label: 'Girón' },
              ]}
              className="w-full"
            />
          </div>

          <div className="pt-2">
            <p className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              La nueva sede se creará con estado habilitado para atención, permitiendo asignar médicos y publicar agendas.
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
                  Registrar Sede
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
