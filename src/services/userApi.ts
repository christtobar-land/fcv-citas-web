import { getAccessToken } from '../auth/authApi';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export interface UserProfileAffiliation {
  epsId: number | null;
  epsName: string | null;
  planId: number | null;
  planName: string | null;
  regimeId: number | null;
  regimeName: string | null;
  membershipNumber: string | null;
}

export interface UserProfileResponse {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  roles: string[];
  affiliation: UserProfileAffiliation | null;
}

export interface UpdateProfilePayload {
  email: string;
  phone: string;
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

export async function fetchUserProfile(): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>('/api/v1/users/me');
}

export async function updateUserProfile(payload: UpdateProfilePayload): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>('/api/v1/users/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
