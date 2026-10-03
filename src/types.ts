export type ScreenType = 'login' | 'register' | 'dashboard';
export type RoleType = 'USER' | 'PROFESSIONAL' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  insuranceId?: string;
  insuranceName?: string;
  documentType?: string;
  documentNumber?: string;
  avatarUrl?: string;
  roles?: string[];
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  rating: number;
  reviewsCount: number;
  availableDays: string[];
  price: number;
  avatar: string;
  experienceYears: number;
  consultationType: 'presencial' | 'videoconsulta' | 'ambas';
  room?: string;
}

export type AppointmentStatus = 'confirmada' | 'pendiente' | 'completada' | 'cancelada' | 'no_asistio' | 'rechazada';

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar?: string;
  patientId: string;
  patientName: string;
  patientDocument?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  room?: string;
  type: 'presencial' | 'videoconsulta';
  meetUrl?: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  prepInstructions?: string[];
  prescription?: {
    diagnosis: string;
    medicines: { name: string; dose: string; frequency: string; duration: string }[];
    notes: string;
  };
  locationId?: number;
  specialtyId?: number;
  professionalId?: number;
  referralCode?: string;
  scheduledStartAt?: string;
}

export interface Specialty {
  id: string;
  name: string;
  durationMinutes: number;
  subtitle: string;
  isGeneral?: boolean;
  description: string;
  active?: boolean;
}

export interface Sede {
  id: string;
  name: string;
  tag: string;
  description: string;
  isPrincipal: boolean;
  active?: boolean;
}
