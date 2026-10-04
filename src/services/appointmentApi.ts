import { getAccessToken } from '../auth/authApi';
import { cleanProfessionalName } from '../utils/professionalUtils';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export interface LocationItem {
  id: number;
  code: string;
  name: string;
  address: string;
  city: string;
  active?: boolean;
}

export interface SpecialtyItem {
  id: number;
  code: string;
  name: string;
  durationMinutes: number;
  isGeneral: boolean;
  requiresAdminApproval: boolean;
  active?: boolean;
}

export interface EpsItem {
  id: number;
  code: string;
  name: string;
  active?: boolean;
}

export interface UserAffiliation {
  id: number | null;
  epsName: string;
  planName: string;
  membershipNumber: string;
  isCurrent: boolean;
}

export interface AvailableSlot {
  slotId: number;
  professionalId: number;
  professionalName: string;
  licenseNumber: string;
  locationId: number;
  locationName: string;
  startAt: string;
  endAt: string;
}

export interface AppointmentItem {
  id: number;
  professionalId: number;
  professionalName: string;
  licenseNumber: string;
  locationId: number;
  locationName: string;
  locationAddress: string;
  specialtyId: number;
  specialtyName: string;
  status: string;
  statusCode: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  scheduledStartAt: string;
  scheduledEndAt: string;
  durationMinutes: number;
  reason?: string;
  referralCode?: string;
  isTerminal: boolean;
}

export interface BookAppointmentPayload {
  locationId: number;
  specialtyId: number;
  professionalId: number;
  scheduledStartAt: string;
  reason?: string;
  referralCode?: string;
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null) as { detail?: string; message?: string } | null;
    const msg = errorBody?.detail || errorBody?.message || `Error del servidor (${res.status})`;
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

export async function fetchLocations(): Promise<LocationItem[]> {
  return apiFetch<LocationItem[]>('/api/v1/catalog/locations');
}

export async function fetchSpecialties(): Promise<SpecialtyItem[]> {
  return apiFetch<SpecialtyItem[]>('/api/v1/catalog/specialties');
}

export interface ProfessionalItem {
  id: number;
  name: string;
  licenseNumber: string;
  professionalCode: string;
  specialtyIds: number[];
  locationIds: number[];
  active?: boolean;
}

export async function fetchProfessionals(params?: {
  specialtyId?: number;
  locationId?: number;
}): Promise<ProfessionalItem[]> {
  const query = new URLSearchParams();
  if (params?.specialtyId) query.set('specialtyId', String(params.specialtyId));
  if (params?.locationId) query.set('locationId', String(params.locationId));
  const qs = query.toString();
  const list = await apiFetch<ProfessionalItem[]>(`/api/v1/catalog/professionals${qs ? `?${qs}` : ''}`);
  return list.map((p) => ({ ...p, name: cleanProfessionalName(p.name) }));
}

export async function fetchEpsList(): Promise<EpsItem[]> {
  return apiFetch<EpsItem[]>('/api/v1/catalog/eps');
}

export async function fetchMyAffiliation(): Promise<UserAffiliation> {
  return apiFetch<UserAffiliation>('/api/v1/catalog/my-affiliation');
}

export async function fetchAvailableSlots(params: {
  locationId?: number;
  specialtyId?: number;
  professionalId?: number;
  date?: string;
}): Promise<AvailableSlot[]> {
  const query = new URLSearchParams();
  if (params.locationId) query.set('locationId', String(params.locationId));
  if (params.specialtyId) query.set('specialtyId', String(params.specialtyId));
  if (params.professionalId) query.set('professionalId', String(params.professionalId));
  if (params.date) query.set('date', params.date);

  const qs = query.toString();
  const slots = await apiFetch<AvailableSlot[]>(`/api/v1/availability${qs ? `?${qs}` : ''}`);
  return slots.map((s) => ({ ...s, professionalName: cleanProfessionalName(s.professionalName) }));
}

export async function fetchMyAppointments(): Promise<AppointmentItem[]> {
  const list = await apiFetch<AppointmentItem[]>('/api/v1/appointments/my-appointments');
  return list.map((a) => ({ ...a, professionalName: cleanProfessionalName(a.professionalName) }));
}

export async function bookAppointment(payload: BookAppointmentPayload): Promise<AppointmentItem> {
  const item = await apiFetch<AppointmentItem>('/api/v1/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { ...item, professionalName: cleanProfessionalName(item.professionalName) };
}

export async function rescheduleAppointment(
  appointmentId: number,
  newStartAt: string,
  reason?: string,
  professionalId?: number
): Promise<AppointmentItem> {
  const item = await apiFetch<AppointmentItem>(`/api/v1/appointments/${appointmentId}/reschedule`, {
    method: 'PATCH',
    body: JSON.stringify({ newStartAt, reason, professionalId }),
  });
  return { ...item, professionalName: cleanProfessionalName(item.professionalName) };
}

export async function cancelAppointment(
  appointmentId: number,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/v1/appointments/${appointmentId}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export interface ProfessionalAppointmentItem {
  id: number;
  patientId: number | null;
  patientName: string;
  patientDocumentType: string;
  patientDocumentNumber: string;
  patientPhone: string;
  patientEmail: string;
  epsName: string;
  professionalId: number;
  professionalName: string;
  locationId: number;
  locationName: string;
  locationAddress: string;
  specialtyId: number;
  specialtyName: string;
  status: string;
  statusCode: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  scheduledStartAt: string;
  scheduledEndAt: string;
  durationMinutes: number;
  reason?: string;
  referralCode?: string;
  isTerminal: boolean;
}

export interface AdminAppointmentItem {
  id: number;
  patientId: number | null;
  patientName: string;
  patientDocument: string;
  patientPhone: string;
  patientEmail: string;
  epsName: string;
  professionalId: number;
  professionalName: string;
  professionalLicense: string;
  locationId: number;
  locationName: string;
  locationAddress: string;
  specialtyId: number;
  specialtyName: string;
  status: string;
  statusCode: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  scheduledStartAt: string;
  scheduledEndAt: string;
  durationMinutes: number;
  reason?: string;
  referralCode?: string;
  createdAt: string;
}

export async function fetchProfessionalAgenda(params?: {
  professionalId?: number;
  date?: string;
  locationId?: number;
}): Promise<ProfessionalAppointmentItem[]> {
  const query = new URLSearchParams();
  if (params?.professionalId) query.set('professionalId', String(params.professionalId));
  if (params?.date) query.set('date', params.date);
  if (params?.locationId) query.set('locationId', String(params.locationId));
  const qs = query.toString();
  const list = await apiFetch<ProfessionalAppointmentItem[]>(`/api/v1/appointments/professional/agenda${qs ? `?${qs}` : ''}`);
  return list.map((a) => ({ ...a, professionalName: cleanProfessionalName(a.professionalName) }));
}

export async function completeProfessionalAppointment(
  appointmentId: number,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/v1/appointments/${appointmentId}/complete`, {
    method: 'PATCH',
    body: JSON.stringify({ notes }),
  });
}

export async function noShowProfessionalAppointment(
  appointmentId: number,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/v1/appointments/${appointmentId}/no-show`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export async function fetchAdminPendingRequests(): Promise<AdminAppointmentItem[]> {
  const list = await apiFetch<AdminAppointmentItem[]>('/api/v1/appointments/admin/pending');
  return list.map((a) => ({ ...a, professionalName: cleanProfessionalName(a.professionalName) }));
}

export async function approveAdminAppointment(
  appointmentId: number
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/v1/appointments/${appointmentId}/approve`, {
    method: 'PATCH',
  });
}

export async function rejectAdminAppointment(
  appointmentId: number,
  reason: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/v1/appointments/${appointmentId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export interface LocationOccupancyItem {
  locationId: number;
  locationName: string;
  locationAddress: string;
  totalSlotsMonth: number;
  bookedSlotsMonth: number;
  occupancyPercentMonth: number;
  totalSlotsToday: number;
  bookedSlotsToday: number;
  occupancyPercentToday: number;
  activeProfessionalsCount: number;
  pendingApprovalCount: number;
}

export async function fetchAdminLocationsOccupancy(): Promise<LocationOccupancyItem[]> {
  return apiFetch<LocationOccupancyItem[]>('/api/v1/appointments/admin/locations-occupancy');
}

// ==================== DISPONIBILIDAD DEL PROFESIONAL (RF-08) ====================

export interface AvailabilityBlockItem {
  id: number;
  professionalId: number;
  professionalName: string;
  locationId: number;
  locationName: string;
  locationAddress: string;
  availableDate: string;
  startTime: string;
  endTime: string;
  active: boolean;
  totalSlots: number;
  bookedSlots: number;
  canDelete: boolean;
}

export interface CreateBlockPayload {
  professionalId?: number;
  locationId: number;
  availableDate: string;
  startTime: string;
  endTime: string;
}

export async function fetchProfessionalBlocks(professionalId?: number): Promise<AvailabilityBlockItem[]> {
  const query = new URLSearchParams();
  if (professionalId) query.set('professionalId', String(professionalId));
  const qs = query.toString();
  return apiFetch<AvailabilityBlockItem[]>(`/api/v1/availability/blocks${qs ? `?${qs}` : ''}`);
}

export async function createAvailabilityBlock(payload: CreateBlockPayload): Promise<AvailabilityBlockItem> {
  return apiFetch<AvailabilityBlockItem>('/api/v1/availability/blocks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteAvailabilityBlock(blockId: number): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/v1/availability/blocks/${blockId}`, {
    method: 'DELETE',
  });
}

// ==================== HISTORIAL Y AUDITORÍA DE ESTADOS (HU-032) ====================

export interface AppointmentHistoryItem {
  id: number;
  appointmentId: number;
  statusCode: string;
  statusName: string;
  changeSource: string;
  changedByName: string;
  reason: string | null;
  changedAt: string;
}

export async function fetchAppointmentHistory(
  appointmentId: number | string
): Promise<AppointmentHistoryItem[]> {
  return apiFetch<AppointmentHistoryItem[]>(`/api/v1/appointments/${appointmentId}/history`);
}

// ==================== GESTIÓN DE PROFESIONALES (ADMIN) ====================

export interface CreateProfessionalPayload {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  licenseNumber: string;
  specialtyIds: number[];
  locationIds: number[];
}

export async function createAdminProfessional(payload: CreateProfessionalPayload): Promise<ProfessionalItem> {
  const p = await apiFetch<ProfessionalItem>('/api/v1/appointments/admin/professionals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { ...p, name: cleanProfessionalName(p.name) };
}

export async function toggleAdminProfessionalStatus(
  professionalId: number
): Promise<{ success: boolean; active: boolean; message: string }> {
  return apiFetch<{ success: boolean; active: boolean; message: string }>(
    `/api/v1/appointments/admin/professionals/${professionalId}/toggle-status`,
    {
      method: 'PATCH',
    }
  );
}

// ==================== GESTIÓN DE CATÁLOGOS MAESTROS (ADMIN) ====================

export interface CreateLocationPayload {
  code: string;
  name: string;
  address: string;
  city: string;
}

export async function createAdminLocation(payload: CreateLocationPayload): Promise<LocationItem> {
  return apiFetch<LocationItem>('/api/v1/appointments/admin/locations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function toggleAdminLocationStatus(
  locationId: number
): Promise<{ success: boolean; active: boolean; message: string }> {
  return apiFetch<{ success: boolean; active: boolean; message: string }>(
    `/api/v1/appointments/admin/locations/${locationId}/toggle-status`,
    {
      method: 'PATCH',
    }
  );
}

export interface CreateSpecialtyPayload {
  code: string;
  name: string;
  durationMinutes: number;
  isGeneral: boolean;
  requiresAdminApproval: boolean;
}

export async function createAdminSpecialty(payload: CreateSpecialtyPayload): Promise<SpecialtyItem> {
  return apiFetch<SpecialtyItem>('/api/v1/appointments/admin/specialties', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function toggleAdminSpecialtyStatus(
  specialtyId: number
): Promise<{ success: boolean; active: boolean; message: string }> {
  return apiFetch<{ success: boolean; active: boolean; message: string }>(
    `/api/v1/appointments/admin/specialties/${specialtyId}/toggle-status`,
    {
      method: 'PATCH',
    }
  );
}

export interface CreateEpsPayload {
  code: string;
  name: string;
}

export async function createAdminEps(payload: CreateEpsPayload): Promise<EpsItem> {
  return apiFetch<EpsItem>('/api/v1/appointments/admin/eps', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function toggleAdminEpsStatus(
  epsId: number
): Promise<{ success: boolean; active: boolean; message: string }> {
  return apiFetch<{ success: boolean; active: boolean; message: string }>(
    `/api/v1/appointments/admin/eps/${epsId}/toggle-status`,
    {
      method: 'PATCH',
    }
  );
}


