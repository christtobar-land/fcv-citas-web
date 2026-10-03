import React, { useState } from 'react';
import { UserPlus, X, AlertCircle, Check, Stethoscope, Building2, Mail, Phone, FileText } from 'lucide-react';
import {
  LocationItem,
  SpecialtyItem,
  ProfessionalItem,
  createAdminProfessional,
} from '../services/appointmentApi';
import { CustomSelect } from './CustomSelect';

interface CreateProfessionalModalProps {
  locations: LocationItem[];
  specialties: SpecialtyItem[];
  onClose: () => void;
  onSuccess: (newProf: ProfessionalItem) => void;
}

export const CreateProfessionalModal: React.FC<CreateProfessionalModalProps> = ({
  locations,
  specialties,
  onClose,
  onSuccess,
}) => {
  const activeLocations = locations.filter((l) => l.active !== false);
  const activeSpecialties = specialties.filter((s) => s.active !== false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentType, setDocumentType] = useState('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<number[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleSpecialty = (id: number) => {
    setSelectedSpecialtyIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const toggleLocation = (id: number) => {
    setSelectedLocationIds((prev) =>
      prev.includes(id) ? prev.filter((lId) => lId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim()) {
      setErrorMessage('El nombre del profesional es obligatorio.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMessage('Los apellidos del profesional son obligatorios.');
      return;
    }
    if (!documentNumber.trim()) {
      setErrorMessage('El número de documento es obligatorio.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Ingresa un correo electrónico corporativo válido.');
      return;
    }
    if (!licenseNumber.trim()) {
      setErrorMessage('El registro médico o tarjeta profesional es obligatorio.');
      return;
    }
    if (selectedSpecialtyIds.length === 0) {
      setErrorMessage('Debes seleccionar al menos una especialidad médica.');
      return;
    }
    if (selectedLocationIds.length === 0) {
      setErrorMessage('Debes asignar al menos una sede de atención.');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createAdminProfessional({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        documentType,
        documentNumber: documentNumber.trim(),
        email: email.trim(),
        phone: phone.trim(),
        licenseNumber: licenseNumber.trim(),
        specialtyIds: selectedSpecialtyIds,
        locationIds: selectedLocationIds,
      });
      onSuccess(created);
    } catch (err: any) {
      console.error('Error registrando médico:', err);
      setErrorMessage(
        err?.message || 'Error al registrar el profesional. Verifica que el correo o documento no estén duplicados.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-wine-50 text-wine-700 flex items-center justify-center border border-wine-100">
              <UserPlus className="w-5 h-5 text-[#A3073B]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Registrar Nuevo Médico</h2>
              <p className="text-xs text-slate-500">
                Habilita el perfil profesional y asigna sus sedes y especialidades
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido / Formulario con Scroll */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Información Personal */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Información del Profesional
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nombres <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Eduardo"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A3073B] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Apellidos <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Gómez Silva"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A3073B] focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tipo Doc. <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={documentType}
                  onChange={setDocumentType}
                  options={[
                    { value: 'CC', label: 'CC (Cédula)' },
                    { value: 'CE', label: 'CE (Extranjería)' },
                    { value: 'TI', label: 'TI (Tarjeta Id.)' },
                    { value: 'PAS', label: 'PAS (Pasaporte)' },
                  ]}
                  className="w-full"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Número de Documento <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 1098765432"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A3073B] focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Correo Electrónico <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="doctor@medihealth.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A3073B] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Teléfono de Contacto
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    placeholder="Ej. 3158901234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A3073B] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tarjeta Profesional / Registro Médico <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Ej. RM-99482-COL"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A3073B] focus:border-transparent font-mono"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-[#A3073B]" />
                Especialidades Habilitadas <span className="text-rose-500">*</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {selectedSpecialtyIds.length} seleccionada(s)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
              {activeSpecialties.map((spec) => {
                const isSelected = selectedSpecialtyIds.includes(spec.id);
                return (
                  <button
                    type="button"
                    key={spec.id}
                    onClick={() => toggleSpecialty(spec.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#A3073B] text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate pr-2">{spec.name}</span>
                    {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#A3073B]" />
                Sedes de Atención Asignadas <span className="text-rose-500">*</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {selectedLocationIds.length} seleccionada(s)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeLocations.map((loc) => {
                const isSelected = selectedLocationIds.includes(loc.id);
                return (
                  <button
                    type="button"
                    key={loc.id}
                    onClick={() => toggleLocation(loc.id)}
                    className={`flex items-start justify-between p-3 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-[#FDF2F4] border-2 border-[#A3073B] text-[#870530]'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{loc.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{loc.address}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#A3073B] flex-shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <p className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              Al guardar, se creará el usuario institucional con rol MÉDICO y contraseña provisional estándar (<code className="font-mono text-slate-600 font-semibold">Password123</code>), permitiendo al profesional publicar franjas de disponibilidad.
            </p>
          </div>
        </form>

        {/* Pie de acciones */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#A3073B] hover:bg-[#870530] disabled:opacity-50 rounded-xl shadow-md transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Registrar Profesional
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
