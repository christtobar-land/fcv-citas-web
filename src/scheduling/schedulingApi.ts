import { getAccessToken } from '../auth/authApi';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export interface Specialty { id: number; code: string; name: string; appointmentDurationMinutes: number; general: boolean; }
export interface Location { id: number; code: string; name: string; active: boolean; }
export interface AvailabilityBlock { id: number; professionalId: number; locationId: number; date: string; startTime: string; endTime: string; }
export interface AvailabilityOption { professionalId: number; locationId: number; specialtyId: number; startAt: string; endAt: string; durationMinutes: number; general: boolean; professionalName: string; locationName: string; specialtyName: string; }
export interface Appointment { id: number; patientUserId: number; professionalId: number; locationId: number; specialtyId: number; status: 'APPROVED' | 'REQUESTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'; startAt: string; endAt: string; reason?: string | null; locationName: string; specialtyName: string; professionalName: string; patientName: string; }
export interface AppointmentHistory { appointmentId: number; status: Appointment['status']; actorUserId: number | null; source: 'USER' | 'ADMIN' | 'SYSTEM'; reason: string | null; changedAt: string; }
export interface RescheduleRequest { id: number; appointmentId: number; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'; requestedStartAt: string; requestedEndAt: string; locationName: string; specialtyName: string; professionalName: string; decisionReason?: string | null; }

export class SchedulingApiError extends Error { constructor(public readonly status: number, message: string) { super(message); this.name = 'SchedulingApiError'; } }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const access = getAccessToken();
  let response: Response;
  try { response = await fetch(`${API_URL}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...(access ? { Authorization: `Bearer ${access}` } : {}), ...init.headers } }); }
  catch { throw new SchedulingApiError(0, 'No fue posible conectar con el servicio de citas.'); }
  if (!response.ok) { const problem = await response.json().catch(() => null) as { detail?: string } | null; throw new SchedulingApiError(response.status, problem?.detail ?? 'No fue posible completar la operación.'); }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const getSpecialties = () => request<Specialty[]>('/api/v1/catalogs/specialties');
export const getLocations = () => request<Location[]>('/api/v1/catalogs/locations');
export const getAvailability = (locationId: number, specialtyId: number, date: string, professionalId?: number) => { const query = new URLSearchParams({ locationId: String(locationId), specialtyId: String(specialtyId), date }); if (professionalId) query.set('professionalId', String(professionalId)); return request<AvailabilityOption[]>(`/api/v1/availability?${query}`); };
export const reserveAppointment = (input: { professionalId: number; locationId: number; specialtyId: number; startAt: string; reason?: string }) => request<Appointment>('/api/v1/appointments', { method: 'POST', body: JSON.stringify(input) });
export const getMyAppointments = (status?: string, date?: string) => { const query = new URLSearchParams(); if (status) query.set('status', status); if (date) query.set('date', date); return request<Appointment[]>(`/api/v1/appointments${query.size ? `?${query}` : ''}`); };
export const cancelAppointment = (id: number) => request<Appointment>(`/api/v1/appointments/${id}/cancel`, { method: 'POST' });
export const getAppointmentHistory = (id: number) => request<AppointmentHistory[]>(`/api/v1/appointments/${id}/history`);
export const requestReschedule = (appointmentId: number, locationId: number, startAt: string) => request<RescheduleRequest>(`/api/v1/appointments/${appointmentId}/reschedules`, { method: 'POST', body: JSON.stringify({ locationId, startAt }) });
export const getMyReschedules = () => request<RescheduleRequest[]>('/api/v1/reschedules');
export const getOwnBlocks = (date: string, locationId?: number) => { const query = new URLSearchParams({ date }); if (locationId) query.set('locationId', String(locationId)); return request<AvailabilityBlock[]>(`/api/v1/professional/availability-blocks?${query}`); };
export const createBlock = (input: { locationId: number; date: string; startTime: string; endTime: string }) => request<AvailabilityBlock>('/api/v1/professional/availability-blocks', { method: 'POST', body: JSON.stringify(input) });
export const updateBlock = (id: number, input: { locationId: number; date: string; startTime: string; endTime: string }) => request<AvailabilityBlock>(`/api/v1/professional/availability-blocks/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
export const deleteBlock = (id: number) => request<void>(`/api/v1/professional/availability-blocks/${id}`, { method: 'DELETE' });
export const getProfessionalAppointments = (date?: string, locationId?: number) => { const query = new URLSearchParams(); if (date) query.set('date', date); if (locationId) query.set('locationId', String(locationId)); return request<Appointment[]>(`/api/v1/professional/appointments${query.size ? `?${query}` : ''}`); };
export const closeProfessionalAppointment = (id: number, outcome: 'COMPLETED' | 'NO_SHOW') => request<Appointment>(`/api/v1/professional/appointments/${id}/close`, { method: 'POST', body: JSON.stringify({ outcome }) });
export const getRequestedAppointments = () => request<Appointment[]>('/api/v1/admin/appointments');
export const decideAppointment = (id: number, decision: 'APPROVE' | 'REJECT', reason?: string) => request<Appointment>(`/api/v1/admin/appointments/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision, reason }) });
export const getPendingReschedules = () => request<RescheduleRequest[]>('/api/v1/admin/reschedules');
export const decideReschedule = (id: number, decision: 'APPROVE' | 'REJECT', reason?: string) => request<RescheduleRequest>(`/api/v1/admin/reschedules/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision, reason }) });
