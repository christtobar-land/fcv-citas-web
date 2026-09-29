import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { decideAppointment, getRequestedAppointments, SchedulingApiError, type Appointment } from './schedulingApi';

const errorText = (e: unknown) => e instanceof SchedulingApiError ? e.message : 'No fue posible decidir la solicitud.';

export function AdminAppointmentsPanel() {
  const [appointments, setAppointments] = useState<Appointment[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const reload = async () => { setLoading(true); try { setAppointments(await getRequestedAppointments()); } catch (e) { setError(errorText(e)); } finally { setLoading(false); } };
  useEffect(() => { void reload(); }, []);
  const decide = async (id: number, decision: 'APPROVE' | 'REJECT') => { const rejectionReason = decision === 'REJECT' ? (window.prompt('Motivo de rechazo (obligatorio):') ?? '') : ''; if (decision === 'REJECT' && !rejectionReason.trim()) return; setError(''); try { await decideAppointment(id, decision, rejectionReason || undefined); await reload(); } catch (e) { setError(errorText(e)); } };
  return <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"><h2 className="font-bold text-slate-900">Solicitudes especializadas pendientes</h2>{error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{loading ? <p className="mt-4 text-sm text-slate-400">Cargando solicitudes…</p> : appointments.length === 0 ? <p className="mt-4 text-sm text-slate-500">No hay solicitudes pendientes.</p> : <div className="mt-4 space-y-3">{appointments.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4"><div><p className="font-medium text-slate-800">Solicitud #{item.id} · Profesional #{item.professionalId}</p><p className="text-xs text-slate-500">{item.startAt.slice(0, 10)} {item.startAt.slice(11, 16)} · Especialidad #{item.specialtyId}</p></div><div className="flex gap-2"><button onClick={() => void decide(item.id, 'APPROVE')} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white flex gap-1"><Check className="w-4 h-4" />Aprobar</button><button onClick={() => void decide(item.id, 'REJECT')} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white flex gap-1"><X className="w-4 h-4" />Rechazar</button></div></article>)}</div>}</section>;
}
