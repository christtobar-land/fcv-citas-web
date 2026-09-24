import React, { useEffect, useState } from 'react';
import { CheckCircle2, LogOut, Plus, ShieldCheck, Stethoscope, UserPlus } from 'lucide-react';
import {
  AdminOfferApiError,
  assignProfessionalLocations,
  assignProfessionalSpecialties,
  createProfessional,
  createSpecialty,
  listSpecialties,
  setProfessionalActive,
  type Specialty,
} from './adminOfferApi';
import type { User } from '../types';

interface AdminOfferScreenProps { user: User; onLogout: () => void; }

const fieldClass = 'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

function errorMessage(error: unknown): string {
  if (error instanceof AdminOfferApiError && error.status === 403) return 'No tienes permisos de administrador.';
  if (error instanceof AdminOfferApiError) return error.message;
  return 'No fue posible completar la operación.';
}

export const AdminOfferScreen: React.FC<AdminOfferScreenProps> = ({ user, onLogout }) => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [specialty, setSpecialty] = useState({ code: '', name: '', duration: '30', general: false });
  const [professional, setProfessional] = useState({ firstName: '', lastName: '', documentNumber: '', email: '', phone: '', password: '', code: '', license: '' });
  const [professionalId, setProfessionalId] = useState('');
  const [specialtyIds, setSpecialtyIds] = useState('');
  const [primaryId, setPrimaryId] = useState('');
  const [locationIds, setLocationIds] = useState('1,2');
  const [active, setActive] = useState(true);

  const reloadSpecialties = () => {
    setLoading(true);
    listSpecialties().then(setSpecialties).catch((e) => setError(errorMessage(e))).finally(() => setLoading(false));
  };
  useEffect(reloadSpecialties, []);

  const run = async (operation: () => Promise<unknown>, success: string) => {
    setError(''); setMessage('');
    try { await operation(); setMessage(success); } catch (e) { setError(errorMessage(e)); }
  };

  const submitSpecialty = async (event: React.FormEvent) => {
    event.preventDefault();
    await run(async () => {
      await createSpecialty({ code: specialty.code, name: specialty.name, appointmentDurationMinutes: Number(specialty.duration), general: specialty.general, requiresAdminApproval: !specialty.general });
      setSpecialty({ code: '', name: '', duration: '30', general: false });
      reloadSpecialties();
    }, 'Especialidad creada correctamente.');
  };

  const submitProfessional = async (event: React.FormEvent) => {
    event.preventDefault();
    await run(async () => {
      const created = await createProfessional({ firstName: professional.firstName, lastName: professional.lastName, documentType: 'CC', documentNumber: professional.documentNumber, email: professional.email, phone: professional.phone, temporaryPassword: professional.password, professionalCode: professional.code, licenseNumber: professional.license });
      setProfessionalId(String(created.id));
    }, 'Profesional creado. Conserva el ID para asignar oferta.');
  };

  const submitAssignments = async (event: React.FormEvent) => {
    event.preventDefault();
    const id = Number(professionalId);
    const ids = specialtyIds.split(',').map(Number).filter(Boolean);
    const locations = locationIds.split(',').map(Number).filter(Boolean);
    await run(async () => {
      await assignProfessionalSpecialties(id, ids, Number(primaryId));
      await assignProfessionalLocations(id, locations);
      await setProfessionalActive(id, active);
    }, 'Asignaciones y estado actualizados.');
  };

  return (
    <main className="w-full max-w-6xl mx-auto space-y-6 pb-12" id="admin-offer-screen">
      <header className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white"><ShieldCheck className="w-5 h-5" /></div>
          <div><span className="text-base font-bold text-slate-900 block">Administración de oferta</span><span className="text-xs text-slate-400 uppercase">{user.name}</span></div>
        </div>
        <button type="button" onClick={onLogout} className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label="Cerrar sesión"><LogOut className="w-4 h-4" /></button>
      </header>

      {(message || error) && <div role={error ? 'alert' : 'status'} className={`p-3 rounded-xl text-sm ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>{error || message}</div>}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={submitSpecialty} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-2"><Stethoscope className="w-5 h-5 text-blue-600" /><h2 className="font-bold text-slate-900">Especialidades</h2></div>
          <input className={fieldClass} placeholder="Código" aria-label="Código de especialidad" required value={specialty.code} onChange={(e) => setSpecialty({ ...specialty, code: e.target.value })} />
          <input className={fieldClass} placeholder="Nombre" aria-label="Nombre de especialidad" required value={specialty.name} onChange={(e) => setSpecialty({ ...specialty, name: e.target.value })} />
          <select className={fieldClass} aria-label="Duración" value={specialty.duration} onChange={(e) => setSpecialty({ ...specialty, duration: e.target.value })}><option value="30">30 minutos</option><option value="60">60 minutos</option></select>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={specialty.general} onChange={(e) => setSpecialty({ ...specialty, general: e.target.checked })} /> Medicina general</label>
          <button className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2" type="submit"><Plus className="w-4 h-4" />Crear especialidad</button>
          <div className="pt-2 border-t border-slate-100 space-y-2" aria-live="polite">
            {loading ? <p className="text-sm text-slate-400">Cargando catálogo…</p> : specialties.map((item) => <div key={item.id} className="flex justify-between text-sm"><span className="text-slate-700">{item.name}</span><span className="text-slate-400">{item.appointmentDurationMinutes} min · {item.active ? 'Activa' : 'Inactiva'}</span></div>)}
          </div>
        </form>

        <form onSubmit={submitProfessional} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-600" /><h2 className="font-bold text-slate-900">Crear profesional</h2></div>
          <div className="grid grid-cols-2 gap-3"><input className={fieldClass} placeholder="Nombres" aria-label="Nombres del profesional" required value={professional.firstName} onChange={(e) => setProfessional({ ...professional, firstName: e.target.value })} /><input className={fieldClass} placeholder="Apellidos" aria-label="Apellidos del profesional" required value={professional.lastName} onChange={(e) => setProfessional({ ...professional, lastName: e.target.value })} /></div>
          <input className={fieldClass} placeholder="Documento CC" aria-label="Documento del profesional" required value={professional.documentNumber} onChange={(e) => setProfessional({ ...professional, documentNumber: e.target.value })} />
          <div className="grid grid-cols-2 gap-3"><input className={fieldClass} placeholder="Correo" aria-label="Correo del profesional" type="email" required value={professional.email} onChange={(e) => setProfessional({ ...professional, email: e.target.value })} /><input className={fieldClass} placeholder="Teléfono" aria-label="Teléfono del profesional" required value={professional.phone} onChange={(e) => setProfessional({ ...professional, phone: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3"><input className={fieldClass} placeholder="Código profesional" aria-label="Código profesional" required value={professional.code} onChange={(e) => setProfessional({ ...professional, code: e.target.value })} /><input className={fieldClass} placeholder="Matrícula ficticia" aria-label="Matrícula profesional" required value={professional.license} onChange={(e) => setProfessional({ ...professional, license: e.target.value })} /></div>
          <input className={fieldClass} placeholder="Contraseña temporal" aria-label="Contraseña temporal" type="password" required value={professional.password} onChange={(e) => setProfessional({ ...professional, password: e.target.value })} />
          <button className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold flex items-center justify-center gap-2" type="submit"><UserPlus className="w-4 h-4" />Crear usuario PROFESSIONAL</button>
        </form>
      </section>

      <form onSubmit={submitAssignments} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
        <h2 className="font-bold text-slate-900">Asignaciones y estado</h2>
        <p className="text-xs text-slate-500">Usa IDs separados por coma. Las especialidades deben estar activas y una debe ser primaria.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3"><input className={fieldClass} placeholder="ID profesional" aria-label="ID profesional" required value={professionalId} onChange={(e) => setProfessionalId(e.target.value)} /><input className={fieldClass} placeholder="IDs especialidades: 1,11" aria-label="IDs de especialidades" required value={specialtyIds} onChange={(e) => setSpecialtyIds(e.target.value)} /><input className={fieldClass} placeholder="ID primaria" aria-label="ID especialidad primaria" required value={primaryId} onChange={(e) => setPrimaryId(e.target.value)} /><input className={fieldClass} placeholder="Sedes: 1,2" aria-label="IDs de sedes" required value={locationIds} onChange={(e) => setLocationIds(e.target.value)} /></div>
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Profesional activo</label>
        <button className="py-2.5 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold" type="submit">Guardar asignaciones</button>
      </form>

      <footer className="p-4 bg-white rounded-2xl border border-slate-100 text-center text-xs text-slate-500 flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Las validaciones definitivas permanecen en la API.</footer>
    </main>
  );
};
