import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  XCircle,
  Phone,
  Mail,
  Pencil,
  ChevronRight,
  ChevronDown,
  Trash2,
  Plus,
  Lock,
  Search,
  Building2,
  CalendarDays,
  UserPlus,
  Stethoscope,
  Power,
  Eye,
} from 'lucide-react';
import { Appointment, Doctor, RoleType, User, AppointmentStatus } from '../types';
import { DOCTORS, SEDES, SPECIALTIES } from '../data/mockData';
import { getSpecialtyIcon } from '../utils/specialtyIcons';
import { PendingAppointmentsModal } from './PendingAppointmentsModal';
import { EditProfileModal } from './EditProfileModal';
import { CreateAvailabilityBlockModal } from './CreateAvailabilityBlockModal';
import { CreateProfessionalModal } from './CreateProfessionalModal';
import { CreateLocationModal } from './CreateLocationModal';
import { CreateSpecialtyModal } from './CreateSpecialtyModal';
import { CreateEpsModal } from './CreateEpsModal';
import { CustomSelect } from './CustomSelect';
import { CustomDatePicker } from './CustomDatePicker';
import {
  fetchLocations,
  fetchSpecialties,
  fetchProfessionals,
  fetchAvailableSlots,
  fetchMyAffiliation,
  fetchProfessionalAgenda,
  completeProfessionalAppointment,
  noShowProfessionalAppointment,
  fetchAdminPendingRequests,
  approveAdminAppointment,
  rejectAdminAppointment,
  fetchProfessionalBlocks,
  deleteAvailabilityBlock,
  fetchAdminLocationsOccupancy,
  toggleAdminProfessionalStatus,
  toggleAdminLocationStatus,
  toggleAdminSpecialtyStatus,
  toggleAdminEpsStatus,
  fetchEpsList,
  type LocationItem,
  type SpecialtyItem,
  type ProfessionalItem,
  type AvailableSlot,
  type UserAffiliation,
  type ProfessionalAppointmentItem,
  type AdminAppointmentItem,
  type AvailabilityBlockItem,
  type LocationOccupancyItem,
  type EpsItem,
} from '../services/appointmentApi';
import {
  getTodayIso,
  getUpcomingDays as getUpcomingBookingDays,
  formatDisplayDate,
  formatDateTimeBadge,
  formatDateHeading,
  formatTimeFromIso,
} from '../utils/dateUtils';
import { cleanProfessionalName } from '../utils/professionalUtils';

interface DashboardScreenProps {
  user: User;
  appointments: Appointment[];
  onOpenBooking: () => void;
  onOpenDetail: (appointment: Appointment, mode?: 'detail' | 'reschedule') => void;
  onOpenHistory: () => void;
  onDirectBook: (newApt: Appointment) => void;
  onCancelAppointment: (id: string, reason?: string) => void;
  onLogout: () => void;
  onUpdateAppointmentStatus?: (id: string, newStatus: AppointmentStatus, notes?: string) => void;
  onRefreshMyAppointments?: () => void;
  onUpdateUser?: (updatedUser: User) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  appointments,
  onOpenBooking,
  onOpenDetail,
  onOpenHistory,
  onDirectBook,
  onCancelAppointment,
  onLogout,
  onUpdateAppointmentStatus,
  onRefreshMyAppointments,
  onUpdateUser,
}) => {
  // Determinación dinámica y estricta del rol del usuario según los roles asignados en Base de Datos
  const currentRole: RoleType = user.roles?.includes('ADMIN')
    ? 'ADMIN'
    : user.roles?.includes('PROFESSIONAL')
    ? 'PROFESSIONAL'
    : 'USER';

  // Modal para editar datos de contacto
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Live catalogs from backend
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyItem[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalItem[]>([]);
  const [affiliation, setAffiliation] = useState<UserAffiliation | null>(null);

  // Compartmentalized Step-by-Step Booking Wizard State
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayIso());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [liveSlots, setLiveSlots] = useState<AvailableSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  // Médico agenda filter state (RF-16, HU-033)
  const [doctorDateTab, setDoctorDateTab] = useState<'today' | 'upcoming' | 'past' | 'all' | 'custom'>('today');
  const [doctorCustomDate, setDoctorCustomDate] = useState<string>('');
  const [doctorLocationFilter, setDoctorLocationFilter] = useState<number | 'all'>('all');
  const [doctorSearchQuery, setDoctorSearchQuery] = useState<string>('');

  // Doctor agenda state
  const [doctorAgenda, setDoctorAgenda] = useState<ProfessionalAppointmentItem[]>([]);
  const [isLoadingDoctorAgenda, setIsLoadingDoctorAgenda] = useState(false);
  const [completingApt, setCompletingApt] = useState<ProfessionalAppointmentItem | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);

  // Doctor availability state (RF-08)
  const [doctorActiveTab, setDoctorActiveTab] = useState<'agenda' | 'availability'>('agenda');
  const [doctorBlocks, setDoctorBlocks] = useState<AvailabilityBlockItem[]>([]);
  const [isLoadingDoctorBlocks, setIsLoadingDoctorBlocks] = useState(false);
  const [isCreateBlockModalOpen, setIsCreateBlockModalOpen] = useState(false);

  // Admin approval queue & location occupancy state
  const [adminRequests, setAdminRequests] = useState<AdminAppointmentItem[]>([]);
  const [isLoadingAdminRequests, setIsLoadingAdminRequests] = useState(false);
  const [locationsOccupancy, setLocationsOccupancy] = useState<LocationOccupancyItem[]>([]);
  const [isLoadingOccupancy, setIsLoadingOccupancy] = useState(false);
  const [rejectingApt, setRejectingApt] = useState<AdminAppointmentItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Admin tabs & state (RF-06, RF-07, RF-12, RF-18)
  const [adminActiveTab, setAdminActiveTab] = useState<'requests' | 'professionals' | 'catalogs'>('requests');
  const [isCreateDoctorModalOpen, setIsCreateDoctorModalOpen] = useState(false);
  const [adminDoctorSearch, setAdminDoctorSearch] = useState('');
  const [adminDoctorFilterSede, setAdminDoctorFilterSede] = useState<number | 'all'>('all');
  const [adminDoctorFilterSpecialty, setAdminDoctorFilterSpecialty] = useState<number | 'all'>('all');
  const [epsList, setEpsList] = useState<EpsItem[]>([]);
  const [togglingDoctorId, setTogglingDoctorId] = useState<number | null>(null);

  // Admin catalogs state
  const [isCreateLocationModalOpen, setIsCreateLocationModalOpen] = useState(false);
  const [isCreateSpecialtyModalOpen, setIsCreateSpecialtyModalOpen] = useState(false);
  const [isCreateEpsModalOpen, setIsCreateEpsModalOpen] = useState(false);
  const [togglingLocationId, setTogglingLocationId] = useState<number | null>(null);
  const [togglingSpecialtyId, setTogglingSpecialtyId] = useState<number | null>(null);
  const [togglingEpsId, setTogglingEpsId] = useState<number | null>(null);

  // Toast feedback
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Modal de todas las citas pendientes
  const [isAllPendingModalOpen, setIsAllPendingModalOpen] = useState(false);
  const [pendingModalFilter, setPendingModalFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled' | 'no_show'>('all');

  // Fecha actual del sistema
  const systemTodayStr = getTodayIso();

  // Helper inteligente para calcular el estado temporal y dinámico de las citas
  const getAppointmentPhase = (startIso: string, endIso: string, statusCode: string) => {
    if (statusCode === 'COMPLETED') {
      return { phase: 'completed', label: 'Atendida', badgeClass: 'bg-slate-900 text-white border border-slate-900 font-extrabold shadow-2xs' };
    }
    if (statusCode === 'NO_SHOW') {
      return { phase: 'no_show', label: 'No asistió', badgeClass: 'bg-slate-900 text-white border border-slate-900 font-extrabold shadow-2xs' };
    }
    if (statusCode === 'CANCELLED') {
      return { phase: 'cancelled', label: 'Cancelada', badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200' };
    }
    if (statusCode === 'REJECTED') {
      return { phase: 'rejected', label: 'Rechazada', badgeClass: 'bg-rose-100 text-rose-800 border border-rose-200' };
    }
    if (statusCode === 'REQUESTED') {
      return { phase: 'requested', label: 'Por Autorizar EPS', badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200' };
    }

    const currentMs = Date.now();
    const startMs = new Date(startIso).getTime();
    const endMs = new Date(endIso).getTime();
    const dateStr = startIso.split('T')[0];

    // Si la fecha ya pasó (día anterior o más antiguo) y no fue completada, se marca como no asistida automáticamente
    if (dateStr < systemTodayStr) {
      return {
        phase: 'no_show',
        label: 'No asistió (Cierre automático)',
        badgeClass: 'bg-slate-900 text-white border border-slate-900 font-extrabold shadow-2xs',
      };
    }

    // ¿La cita está ocurriendo en este momento exacto?
    if (currentMs >= startMs && currentMs <= endMs) {
      return {
        phase: 'in_consultation',
        label: 'En Consulta Ahora',
        badgeClass: 'bg-emerald-600 text-white font-extrabold shadow-sm animate-pulse ring-2 ring-emerald-400/40',
      };
    }

    // ¿La cita es en el futuro?
    if (currentMs < startMs) {
      if (dateStr === systemTodayStr) {
        return { phase: 'upcoming_today', label: 'Próxima Hoy', badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200' };
      }
      return { phase: 'future_day', label: 'Programada', badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200' };
    }

    // Si ya pasó el horario de atención de hoy pero no fue completada ni marcada como inasistencia
    return {
      phase: 'overdue_today',
      label: 'Horario Cumplido (Requiere Cierre)',
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold',
    };
  };

  // Citas agrupadas por día para el rol Médico
  const todayDoctorAgenda = doctorAgenda.filter((a) => a.scheduledStartAt.startsWith(systemTodayStr));
  const upcomingDoctorAgenda = doctorAgenda.filter((a) => a.scheduledStartAt.split('T')[0] > systemTodayStr);
  const pastDoctorAgenda = doctorAgenda.filter((a) => a.scheduledStartAt.split('T')[0] < systemTodayStr);

  // Consulta actualmente activa para el médico
  const currentActiveConsultation = todayDoctorAgenda.find((a) => {
    if (a.statusCode !== 'APPROVED') return false;
    const startMs = new Date(a.scheduledStartAt).getTime();
    const endMs = new Date(a.scheduledEndAt).getTime();
    const nowMs = Date.now();
    return nowMs >= startMs && nowMs <= endMs;
  });

  // Sedes asignadas dinámicas para el profesional logueado (resuelto dinámicamente según la cuenta activa)
  const loggedDoctor = professionals.find((p) => {
    const cleanP = cleanProfessionalName(p.name).toLowerCase();
    const cleanU = user.name.toLowerCase();
    return cleanP.includes(cleanU) || cleanU.includes(cleanP) || String(p.id) === String(user.id);
  }) || professionals[0];
  const doctorAssignedLocations = loggedDoctor?.locationIds?.length
    ? locations.filter((loc) => loggedDoctor.locationIds.includes(loc.id))
    : locations.filter((loc) => loc.active);

  // Filtered active appointments for Paciente:
  // Sistema inteligente: Las citas ya atendidas, canceladas, rechazadas o con inasistencia NO se muestran en el feed de "próximas citas"
  const pendingAppointments = appointments
    .filter((apt) => {
      const isTerminal = apt.status === 'cancelada' || apt.status === 'completada' || apt.status === 'no_asistio' || apt.status === 'rechazada';
      if (isTerminal) return false;

      const aptTime = apt.scheduledStartAt
        ? new Date(apt.scheduledStartAt).getTime()
        : new Date(`${apt.date}T${apt.time.substring(0, 5)}:00`).getTime();

      // Citas activas cuyo horario aún no ha expirado
      return aptTime >= Date.now() - 45 * 60 * 1000;
    })
    .sort((a, b) => {
      const timeA = a.scheduledStartAt
        ? new Date(a.scheduledStartAt).getTime()
        : new Date(`${a.date}T${a.time.substring(0, 5)}:00`).getTime();
      const timeB = b.scheduledStartAt
        ? new Date(b.scheduledStartAt).getTime()
        : new Date(`${b.date}T${b.time.substring(0, 5)}:00`).getTime();
      return timeA - timeB;
    });

  const noShowAppointments = appointments.filter((a) => a.status === 'no_asistio');
  const visiblePendingAppointments = pendingAppointments.slice(0, 2);
  const hasMorePending = pendingAppointments.length > 2;

  const nextAppointment = pendingAppointments[0];

  const getGreeting = (fullName: string): string => {
    const hour = new Date().getHours();
    const firstName = fullName?.trim().split(' ')[0] || 'Paciente';
    if (hour >= 5 && hour < 12) return `Buenos días, ${firstName}`;
    if (hour >= 12 && hour < 19) return `Buenas tardes, ${firstName}`;
    return `Buenas noches, ${firstName}`;
  };

  const timeGreeting = getGreeting(user.name);

  const getPatientAssistantGuidance = () => {
    if (!nextAppointment) {
      return {
        urgency: 'none' as const,
        tag: 'Salud al día',
        title: 'Estás al día con tus citas médicas',
        message: 'No tienes consultas pendientes por asistir. Recuerda que puedes agendar una nueva cita en cualquier momento.',
        actionLabel: 'Agendar Consulta Médica',
        actionType: 'book' as const,
        appointment: null,
      };
    }

    const aptDate = nextAppointment.scheduledStartAt
      ? nextAppointment.scheduledStartAt.split('T')[0]
      : nextAppointment.date;

    let aptTimeMs = 0;
    if (nextAppointment.scheduledStartAt) {
      aptTimeMs = new Date(nextAppointment.scheduledStartAt).getTime();
    } else if (nextAppointment.date && nextAppointment.time) {
      aptTimeMs = new Date(`${nextAppointment.date}T${nextAppointment.time.substring(0, 5)}:00`).getTime();
    }

    const diffMinutes = Math.round((aptTimeMs - new Date().getTime()) / (1000 * 60));
    const isToday = aptDate === systemTodayStr;

    if (isToday) {
      if (diffMinutes <= 120 && diffMinutes >= -30) {
        return {
          urgency: 'imminent' as const,
          tag: 'Cita en breve',
          title: '¡Prepárate para tu consulta médica de hoy!',
          message: `Tienes cita hoy a las ${nextAppointment.time} de ${nextAppointment.doctorSpecialty} con ${nextAppointment.doctorName} en ${nextAppointment.location}. Te sugerimos presentarte 15 minutos antes.`,
          actionLabel: 'Ver detalles de atención',
          actionType: 'detail' as const,
          appointment: nextAppointment,
        };
      }
      return {
        urgency: 'today' as const,
        tag: 'Programada para hoy',
        title: 'Recuerda tu cita de hoy',
        message: `Hoy a las ${nextAppointment.time} serás atendido en ${nextAppointment.location} por ${nextAppointment.doctorName} (${nextAppointment.doctorSpecialty}).`,
        actionLabel: 'Ver expediente y sala',
        actionType: 'detail' as const,
        appointment: nextAppointment,
      };
    }

    return {
      urgency: 'future' as const,
      tag: 'Próxima consulta',
      title: 'Próxima cita agendada',
      message: `El ${formatDisplayDate(aptDate)} a las ${nextAppointment.time} tienes cita con ${nextAppointment.doctorName} (${nextAppointment.doctorSpecialty}) en ${nextAppointment.location}.`,
      actionLabel: 'Ver cita o reprogramar',
      actionType: 'detail' as const,
      appointment: nextAppointment,
    };
  };

  const patientGuidance = getPatientAssistantGuidance();

  const handleResetWizard = () => {
    setActiveStep(1);
    setSelectedSedeId(null);
    setSelectedSpecialtyId(null);
    setSelectedProfessionalId(null);
    setSelectedDate(getTodayIso());
    setSelectedTime('');
    setSelectedSlot(null);
    setReferralCode('');
    setReason('');
    setLiveSlots([]);
  };

  // Fetch catalogs on mount
  useEffect(() => {
    fetchLocations().then((res) => { if (res?.length) setLocations(res); }).catch(() => {});
    fetchSpecialties().then((res) => { if (res?.length) setSpecialties(res); }).catch(() => {});
    fetchProfessionals().then((res) => { if (res?.length) setProfessionals(res); }).catch(() => {});
    fetchMyAffiliation().then((res) => { if (res) setAffiliation(res); }).catch(() => {});
    fetchEpsList().then((res) => { if (res?.length) setEpsList(res); }).catch(() => {});
  }, []);

  const handleToggleDoctorStatus = async (doctor: ProfessionalItem) => {
    try {
      setTogglingDoctorId(doctor.id);
      const res = await toggleAdminProfessionalStatus(doctor.id);
      setProfessionals((prev) =>
        prev.map((p) => (p.id === doctor.id ? { ...p, active: res.active } : p))
      );
      setActionSuccessToast(
        res.active
          ? `El profesional ${doctor.name} ha sido activado para agendamiento.`
          : `El profesional ${doctor.name} ha sido desactivado.`
      );
    } catch (err: any) {
      console.error('Error actualizando estado del profesional:', err);
      setActionSuccessToast(`No se pudo actualizar el estado: ${err.message || 'Error del servidor'}`);
    } finally {
      setTogglingDoctorId(null);
    }
  };

  const handleDoctorCreated = (newDoctor: ProfessionalItem) => {
    setProfessionals((prev) => [...prev, newDoctor]);
    setIsCreateDoctorModalOpen(false);
    setActionSuccessToast(`${cleanProfessionalName(newDoctor.name)} registrado(a) exitosamente.`);
  };

  const handleToggleLocationStatus = async (loc: LocationItem) => {
    try {
      setTogglingLocationId(loc.id);
      const res = await toggleAdminLocationStatus(loc.id);
      setLocations((prev) =>
        prev.map((l) => (l.id === loc.id ? { ...l, active: res.active } : l))
      );
      setActionSuccessToast(
        res.active
          ? `La sede ${loc.name} ha sido habilitada para atención y agendamiento.`
          : `La sede ${loc.name} ha sido inhabilitada.`
      );
    } catch (err: any) {
      console.error('Error actualizando estado de sede:', err);
      setActionSuccessToast(`No se pudo actualizar el estado: ${err.message || 'Error del servidor'}`);
    } finally {
      setTogglingLocationId(null);
    }
  };

  const handleLocationCreated = (newLoc: LocationItem) => {
    setLocations((prev) => [...prev, newLoc]);
    setIsCreateLocationModalOpen(false);
    setActionSuccessToast(`Sede ${newLoc.name} registrada exitosamente.`);
  };

  const handleToggleSpecialtyStatus = async (spec: SpecialtyItem) => {
    try {
      setTogglingSpecialtyId(spec.id);
      const res = await toggleAdminSpecialtyStatus(spec.id);
      setSpecialties((prev) =>
        prev.map((s) => (s.id === spec.id ? { ...s, active: res.active } : s))
      );
      setActionSuccessToast(
        res.active
          ? `La especialidad ${spec.name} ha sido habilitada para agendamiento.`
          : `La especialidad ${spec.name} ha sido inhabilitada.`
      );
    } catch (err: any) {
      console.error('Error actualizando estado de especialidad:', err);
      setActionSuccessToast(`No se pudo actualizar el estado: ${err.message || 'Error del servidor'}`);
    } finally {
      setTogglingSpecialtyId(null);
    }
  };

  const handleSpecialtyCreated = (newSpec: SpecialtyItem) => {
    setSpecialties((prev) => [...prev, newSpec]);
    setIsCreateSpecialtyModalOpen(false);
    setActionSuccessToast(`Especialidad ${newSpec.name} registrada exitosamente.`);
  };

  const handleToggleEpsStatus = async (eps: EpsItem) => {
    try {
      setTogglingEpsId(eps.id);
      const res = await toggleAdminEpsStatus(eps.id);
      setEpsList((prev) =>
        prev.map((e) => (e.id === eps.id ? { ...e, active: res.active } : e))
      );
      setActionSuccessToast(
        res.active
          ? `La entidad ${eps.name} ha sido activada en convenios.`
          : `La entidad ${eps.name} ha sido desactivada.`
      );
    } catch (err: any) {
      console.error('Error actualizando estado de EPS:', err);
      setActionSuccessToast(`No se pudo actualizar el estado: ${err.message || 'Error del servidor'}`);
    } finally {
      setTogglingEpsId(null);
    }
  };

  const handleEpsCreated = (newEps: EpsItem) => {
    setEpsList((prev) => [...prev, newEps]);
    setIsCreateEpsModalOpen(false);
    setActionSuccessToast(`Entidad EPS ${newEps.name} registrada exitosamente.`);
  };

  const loadDoctorAgenda = async () => {
    setIsLoadingDoctorAgenda(true);
    try {
      const data = await fetchProfessionalAgenda();
      setDoctorAgenda(data);
    } catch (err) {
      console.warn('Error al cargar agenda médica:', err);
    } finally {
      setIsLoadingDoctorAgenda(false);
    }
  };

  const loadDoctorBlocks = async () => {
    setIsLoadingDoctorBlocks(true);
    try {
      const data = await fetchProfessionalBlocks();
      setDoctorBlocks(data);
    } catch (err) {
      console.warn('Error al cargar bloques de disponibilidad:', err);
    } finally {
      setIsLoadingDoctorBlocks(false);
    }
  };

  const handleDeleteBlock = async (block: AvailabilityBlockItem) => {
    if (!block.canDelete) {
      alert('Esta franja no se puede eliminar porque ya contiene citas reservadas por pacientes.');
      return;
    }
    const confirmDelete = window.confirm(
      `¿Deseas eliminar la franja del ${formatDisplayDate(block.availableDate)} (${block.startTime.substring(0, 5)} a ${block.endTime.substring(0, 5)}) en ${block.locationName}? Se cancelarán los ${block.totalSlots} cupos libres habilitados.`
    );
    if (!confirmDelete) return;

    try {
      await deleteAvailabilityBlock(block.id);
      setActionSuccessToast(`Franja horaria eliminada y sus ${block.totalSlots} cupos retirados.`);
      await loadDoctorBlocks();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la franja de disponibilidad.');
    }
  };

  const loadAdminRequests = async () => {
    setIsLoadingAdminRequests(true);
    try {
      const data = await fetchAdminPendingRequests();
      setAdminRequests(data);
    } catch (err) {
      console.warn('Error al cargar solicitudes admin:', err);
    } finally {
      setIsLoadingAdminRequests(false);
    }
  };

  const loadLocationsOccupancy = async () => {
    setIsLoadingOccupancy(true);
    try {
      const data = await fetchAdminLocationsOccupancy();
      setLocationsOccupancy(data);
    } catch (err) {
      console.warn('Error al cargar ocupación de sedes:', err);
    } finally {
      setIsLoadingOccupancy(false);
    }
  };

  useEffect(() => {
    if (currentRole === 'PROFESSIONAL') {
      loadDoctorAgenda();
      loadDoctorBlocks();
    } else if (currentRole === 'ADMIN') {
      loadAdminRequests();
      loadLocationsOccupancy();
    } else if (currentRole === 'USER') {
      onRefreshMyAppointments?.();
    }
  }, [currentRole]);

  const handleCompleteAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingApt) return;
    setIsSubmittingComplete(true);
    try {
      await completeProfessionalAppointment(completingApt.id, completeNotes);
      setActionSuccessToast(`Consulta de ${completingApt.patientName} finalizada con éxito.`);
      onUpdateAppointmentStatus?.(String(completingApt.id), 'completada', completeNotes);
      onRefreshMyAppointments?.();
      setCompletingApt(null);
      setCompleteNotes('');
      await loadDoctorAgenda();
    } catch (err: any) {
      alert(err.message || 'Error al completar la atención médica');
    } finally {
      setIsSubmittingComplete(false);
    }
  };

  const handleNoShowAppointment = async (apt: ProfessionalAppointmentItem) => {
    const confirmNoShow = window.confirm(`¿Confirmas la inasistencia de ${apt.patientName}? Se registrará el cierre de la consulta por inasistencia.`);
    if (!confirmNoShow) return;
    try {
      await noShowProfessionalAppointment(apt.id, 'Paciente no asistió a la consulta programada');
      setActionSuccessToast(`Se registró la inasistencia de ${apt.patientName}. Consulta cerrada por inasistencia.`);
      onUpdateAppointmentStatus?.(String(apt.id), 'no_asistio', 'Paciente no asistió a la consulta programada');
      onRefreshMyAppointments?.();
      await loadDoctorAgenda();
    } catch (err: any) {
      alert(err.message || 'Error al registrar inasistencia');
    }
  };

  const handleApproveAdminRequest = async (apt: AdminAppointmentItem) => {
    try {
      await approveAdminAppointment(apt.id);
      setActionSuccessToast(`Solicitud de ${apt.patientName} (${apt.specialtyName}) aprobada y cupo confirmado.`);
      onUpdateAppointmentStatus?.(String(apt.id), 'confirmada');
      onRefreshMyAppointments?.();
      await loadAdminRequests();
    } catch (err: any) {
      alert(err.message || 'Error al aprobar solicitud');
    }
  };

  const handleRejectAdminRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingApt) return;
    if (!rejectReason.trim()) {
      setRejectError('El motivo de rechazo es obligatorio según el protocolo clínico.');
      return;
    }
    setIsSubmittingReject(true);
    setRejectError(null);
    try {
      await rejectAdminAppointment(rejectingApt.id, rejectReason.trim());
      setActionSuccessToast(`Solicitud de ${rejectingApt.patientName} rechazada y cupo liberado.`);
      onUpdateAppointmentStatus?.(String(rejectingApt.id), 'rechazada', rejectReason.trim());
      onRefreshMyAppointments?.();
      setRejectingApt(null);
      setRejectReason('');
      await loadAdminRequests();
    } catch (err: any) {
      setRejectError(err.message || 'Error al rechazar solicitud');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // Fetch live slots searching ahead from selectedDate
  useEffect(() => {
    if (!selectedSedeId || !selectedSpecialtyId || !selectedDate) {
      setLiveSlots([]);
      return;
    }

    let active = true;
    setIsLoadingSlots(true);

    const getNextDays = (startDateStr: string, count: number): string[] => {
      const dates: string[] = [];
      try {
        const [y, m, d] = startDateStr.split('-').map(Number);
        const curr = new Date(y, m - 1, d);
        for (let i = 0; i < count; i++) {
          const next = new Date(curr);
          next.setDate(curr.getDate() + i);
          const yyyy = next.getFullYear();
          const mm = String(next.getMonth() + 1).padStart(2, '0');
          const dd = String(next.getDate()).padStart(2, '0');
          dates.push(`${yyyy}-${mm}-${dd}`);
        }
      } catch {
        dates.push(startDateStr);
      }
      return dates;
    };

    const datesToSearch = getNextDays(selectedDate, 3);
    Promise.all(
      datesToSearch.map((d) =>
        fetchAvailableSlots({
          locationId: selectedSedeId,
          specialtyId: selectedSpecialtyId,
          professionalId: selectedProfessionalId && selectedProfessionalId > 0 ? selectedProfessionalId : undefined,
          date: d,
        }).catch(() => [] as AvailableSlot[])
      )
    )
      .then((results) => {
        if (!active) return;
        const combined = results.flat();
        const nowMs = Date.now();
        const futureOnly = combined.filter((s) => new Date(s.startAt).getTime() > nowMs);
        const unique = Array.from(new Map(futureOnly.map((s) => [s.slotId, s])).values());
        unique.sort((a, b) => a.startAt.localeCompare(b.startAt));
        setLiveSlots(unique);
        setIsLoadingSlots(false);
      })
      .catch((err) => {
        if (!active) return;
        console.warn('Fallo consulta disponibilidad:', err);
        setLiveSlots([]);
        setIsLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSedeId, selectedSpecialtyId, selectedProfessionalId, selectedDate]);

  const currentSede = locations.find((s) => s.id === selectedSedeId) || (selectedSedeId ? {
    id: selectedSedeId,
    name: selectedSedeId === 1 ? 'Sede El Bosque' : 'Sede Norte',
    address: 'Calle 155A No. 23-58',
    city: 'Floridablanca',
  } : null);

  const currentSpecialty = specialties.find((s) => s.id === selectedSpecialtyId) || (selectedSpecialtyId ? {
    id: selectedSpecialtyId,
    name: 'Medicina General',
    durationMinutes: 30,
    isGeneral: selectedSpecialtyId === 1,
  } : null);

  const sortedSpecialties = [...(specialties.length > 0 ? specialties : SPECIALTIES)].sort((a, b) => {
    const aIsGeneral = a.isGeneral || a.id === 1 || a.name.toLowerCase().includes('general');
    const bIsGeneral = b.isGeneral || b.id === 1 || b.name.toLowerCase().includes('general');
    if (aIsGeneral && !bIsGeneral) return -1;
    if (!aIsGeneral && bIsGeneral) return 1;
    return a.name.localeCompare(b.name);
  });

  const currentDoctor = professionals.find((d) => d.id === (selectedSlot?.professionalId || selectedProfessionalId)) || (selectedSlot ? {
    id: selectedSlot.professionalId,
    name: selectedSlot.professionalName,
    licenseNumber: selectedSlot.licenseNumber,
  } : (selectedProfessionalId ? {
    id: selectedProfessionalId,
    name: 'Profesional Especialista',
    licenseNumber: 'MP-COL-1010',
  } : null));

  const isGeneralSpecialty = currentSpecialty?.isGeneral ?? true;
  const isSlotConflicting = (slot: AvailableSlot | null): boolean => {
    if (!slot) return false;
    const slotStartTime = new Date(slot.startAt).getTime();
    const slotEndTime = new Date(slot.endAt).getTime();
    return appointments.some((apt) => {
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

  const isAuthCodeValid = isGeneralSpecialty ? true : referralCode.trim().length >= 4;
  const isStep1Valid = selectedSedeId !== null;
  const isStep2Valid = selectedSpecialtyId !== null;
  const isStep3Valid = selectedSlot !== null && !isSlotConflicting(selectedSlot);
  const isStep4Valid = Boolean(currentSede && currentSpecialty && currentDoctor && selectedSlot && isAuthCodeValid && !isSlotConflicting(selectedSlot));

  const handleConfirmDirectBooking = () => {
    if (!isStep4Valid || !currentSede || !currentSpecialty || !currentDoctor || !selectedSlot) return;

    const isGeneral = isGeneralSpecialty;
    const scheduledStartAt = selectedSlot.startAt;

    const cleanDoctorName = cleanProfessionalName(currentDoctor.name);
    const cleanSedeName = currentSede.name.replace(/\s*\((Principal|Alterna)\)/gi, '');

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      doctorId: `doc-${currentDoctor.id}`,
      doctorName: cleanDoctorName,
      doctorSpecialty: currentSpecialty.name,
      doctorAvatar: undefined,
      patientId: user.id || 'usr-101',
      patientName: user.name || 'Carlos Andrés Méndez',
      patientDocument: user.documentNumber ? `CC ${user.documentNumber}` : 'CC 92.000.100',
      date: selectedDate,
      time: selectedTime,
      location: cleanSedeName,
      room: 'Consultorio 204',
      type: 'presencial',
      status: isGeneral ? 'confirmada' : 'pendiente',
      reason: reason.trim() || `Consulta médica de ${currentSpecialty.name}`,
      notes: isGeneral
        ? 'Confirmada automáticamente. Asistir con 15 minutos de antelación.'
        : referralCode
        ? `Autorización EPS registrada: ${referralCode}`
        : 'Cupo apartado provisionalmente. Pendiente de validación EPS.',
      locationId: selectedSedeId ?? undefined,
      specialtyId: selectedSpecialtyId ?? undefined,
      professionalId: selectedSlot.professionalId,
      scheduledStartAt,
      referralCode: referralCode.trim() || undefined,
    };

    onDirectBook(newApt);
    handleResetWizard();
  };

  return (
    <div className="w-full min-h-screen bg-[#F6F7FB] font-sans antialiased text-slate-800" id="portal-dashboard">
      
      {/* Decorative ambient background glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-slate-200/50 via-slate-100/30 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[450px] h-[450px] bg-gradient-to-tr from-slate-200/40 via-slate-100/20 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* ==================== MAIN HEADER ==================== */}
      <header className="sticky top-0 z-40 w-full pt-3 sm:pt-4 pb-3 bg-[#F6F7FB] transition-all duration-200">
        <div className="w-full max-w-[1520px] mx-auto px-3 sm:px-6 md:px-8">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl px-6 py-3.5 shadow-md shadow-slate-900/5 border border-slate-100/80 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Platform identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A3073B] to-[#870530] p-2 flex items-center justify-center shadow-md shadow-slate-900/10">
            <img src="/logo.png" alt="MediHealth Plus" className="w-full h-full object-contain filter brightness-0 invert" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">MediHealth</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                Plus
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500">Gestión Inteligente de Citas Médicas</p>
          </div>
        </div>

        {/* User Profile Badge & Logout */}
        <div className="flex items-center gap-3">
          {currentRole === 'USER' ? (
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              title="Editar datos de contacto (teléfono y correo)"
              className="flex items-center gap-2.5 p-1.5 pl-3 pr-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition group cursor-pointer text-left"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-[#A3073B] transition-colors">
                  {user.name}
                </p>
                <p className="text-[10px] font-medium text-slate-500 flex items-center justify-end gap-1">
                  <span>{user.documentNumber ? `CC ${user.documentNumber}` : 'Afiliado'}</span>
                  <span className="text-[#A3073B] font-bold text-[10px] bg-[#A3073B]/10 px-1.5 py-0.2 rounded-md">
                    Editar
                  </span>
                </p>
              </div>
              <div className="relative w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-800 shadow-2xs group-hover:border-[#A3073B]/40 group-hover:text-[#A3073B] transition-colors">
                {user.name.charAt(0) || 'U'}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#A3073B] text-white rounded-full flex items-center justify-center shadow-xs">
                  <Pencil className="w-2.5 h-2.5 stroke-[2.5]" />
                </span>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] font-medium text-slate-500">
                  {currentRole === 'PROFESSIONAL'
                    ? 'Médico Especialista • Consulta Externa'
                    : 'Coordinación Médica • Administración'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#A3073B]/10 border border-[#A3073B]/20 flex items-center justify-center font-bold text-sm text-[#A3073B] shadow-sm">
                {user.name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('') || (currentRole === 'PROFESSIONAL' ? 'MD' : 'AD')}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión"
            className="w-10 h-10 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        </div>
        </div>
      </header>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <div className="w-full max-w-[1520px] mx-auto px-3 sm:px-6 md:px-8 pt-5 pb-16">

      {/* ==================== VISTA ROL PACIENTE ==================== */}
      {currentRole === 'USER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          
          {/* Left Column: Personal Feed & Pending Appointments */}
          <aside className="lg:col-span-4 xl:col-span-4 space-y-6">
            
            {/* Intelligent Patient Assistant & Welcome Card */}
            <div
              className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-[#A3073B]/15 bg-gradient-to-br from-[#870530] via-[#A3073B] to-[#680424] border border-white/10"
              data-purpose="personal-panel-card"
            >
              {/* Subtle Celtic Weave Enrejado & Cross Logo Pattern Overlay */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.07]">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="medihealth-weave-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                      {/* Enrejado de cintas entrelazadas a 45° inspiradas en el núcleo del logo */}
                      <path d="M 0,24 L 24,0 M 24,48 L 48,24 M 0,24 L 24,48 M 24,0 L 48,24" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
                      <path d="M 4,24 L 24,4 M 24,44 L 44,24 M 4,24 L 24,44 M 24,4 L 44,24" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="2 2" fill="none" />
                      <path d="M 0,0 L 12,12 M 36,36 L 48,48 M 48,0 L 36,12 M 12,36 L 0,48" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
                      {/* Remates de nudo celta en intersecciones */}
                      <rect x="21" y="21" width="6" height="6" rx="1.5" stroke="#FFFFFF" strokeWidth="1" fill="none" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#medihealth-weave-grid)" />
                </svg>
              </div>

              {/* Marca de agua de la cruz entrelazada oficial de MediHealth en el fondo */}
              <div className="absolute -right-8 -bottom-10 pointer-events-none select-none opacity-[0.09] overflow-hidden">
                <img
                  src="/logo.png"
                  alt=""
                  className="w-56 h-56 object-contain filter brightness-0 invert rotate-12 transform"
                />
              </div>

              {/* Ambient Glow */}
              <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-black/20 blur-xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                {/* Header: Greeting & Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight leading-tight">
                      {timeGreeting}
                    </h2>
                    <p className="text-xs text-rose-100/80 font-medium">
                      Bienvenido a tu portal de salud personal
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 backdrop-blur-md text-white border border-white/20 shadow-xs shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Afiliado Activo
                  </span>
                </div>

                {/* Dynamic Context Card (Intelligent Patient Interaction) */}
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                      patientGuidance.urgency === 'imminent'
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : patientGuidance.urgency === 'today'
                        ? 'bg-rose-100 text-[#680424] font-bold'
                        : 'bg-white/20 text-white'
                    }`}>
                      {patientGuidance.tag}
                    </span>
                    {patientGuidance.urgency === 'imminent' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 animate-pulse">
                        <Clock className="w-3 h-3" />
                        Próxima
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {patientGuidance.title}
                    </h3>
                    <p className="text-xs text-rose-100/90 mt-1 leading-relaxed">
                      {patientGuidance.message}
                    </p>
                  </div>

                  {/* Action Buttons: only shown if there is an active appointment to inspect */}
                  {patientGuidance.actionType === 'detail' && patientGuidance.appointment && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(patientGuidance.appointment!, 'detail')}
                        className="flex-1 py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ver Cita</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenDetail(patientGuidance.appointment!, 'reschedule')}
                        className="flex-1 py-2 px-3 rounded-xl bg-white text-[#870530] hover:bg-rose-50 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reprogramar</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Health Affiliation Bar */}
                <div className="pt-2 flex items-center justify-between text-xs text-rose-100/90 border-t border-white/15">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-200 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-white">{user.insuranceName || 'EPS Salud Total'}</span>
                      <span className="text-rose-200/70 text-[11px] ml-1 hidden sm:inline">• Plan Contributivo</span>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] font-bold bg-black/25 px-2.5 py-0.5 rounded-lg border border-white/10 text-white/90 shrink-0">
                    {user.insuranceId || 'AF-COL-92000100'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pending Appointments Section Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#A3073B]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Citas Médicas Próximas</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {hasMorePending ? `2 de ${pendingAppointments.length} más próximas` : `${pendingAppointments.length} registradas`}
              </span>
            </div>

            {/* Appointment Cards Feed */}
            <div className="space-y-4">
              {pendingAppointments.length === 0 ? (
                <div className="bg-white rounded-3xl p-6 text-center border border-slate-100 text-slate-400 text-xs">
                  No tienes citas pendientes programadas. Puedes agendar una en el panel derecho.
                </div>
              ) : (
                <>
                  {visiblePendingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="bg-white rounded-3xl p-5 shadow-soft-card border border-slate-100 hover:shadow-soft-hover smooth-transition relative group overflow-hidden"
                    >
                      <div className="flex items-start justify-between mb-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-[#FDF2F4] text-[#A3073B] border border-[#F3C5D3] flex items-center justify-center shadow-2xs shrink-0">
                            {getSpecialtyIcon(apt.doctorSpecialty, 'w-5 h-5 text-[#A3073B]')}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold tracking-wider uppercase text-[#A3073B]">
                              {apt.doctorSpecialty}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                              {cleanProfessionalName(apt.doctorName)}
                            </h4>
                            <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-[#A3073B] shrink-0" />
                              <span>{apt.location || 'Sede Principal MediHealth'}</span>
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 text-[11px] font-bold rounded-full border ${
                            apt.status === 'confirmada'
                              ? 'bg-slate-100 text-slate-800 border-slate-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {apt.status === 'confirmada' ? 'Confirmada' : 'En revisión'}
                        </span>
                      </div>

                      {/* Schedule highlight pill */}
                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70 mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-white text-slate-700 border border-slate-200/60 shadow-xs">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{formatDisplayDate(apt.date)}</p>
                            <p className="text-[11px] text-slate-500">{apt.reason || 'Consulta médica general'}</p>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-xl shadow-xs border border-slate-200">
                          {apt.time}
                        </span>
                      </div>

                      {/* Interactive Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenDetail(apt, 'detail')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
                            title="Ver detalle y comprobante de cita"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            Ver cita
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDetail(apt, 'reschedule')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A3073B] hover:text-[#870530] hover:bg-[#FDF2F4] px-3 py-1.5 rounded-xl transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reprogramar
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => onCancelAppointment(apt.id)}
                          className="text-xs font-semibold text-slate-400 hover:text-slate-700 px-2 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          Cancelar cita
                        </button>
                      </div>
                    </div>
                  ))}

                </>
              )}
            </div>

            {/* Botón único unificado para ver todas las citas e historial */}
            {appointments.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPendingModalFilter('all');
                  setIsAllPendingModalOpen(true);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FDF2F4] hover:bg-[#FBE4EB] text-[#A3073B] font-bold text-xs flex items-center justify-between transition border border-[#F3C5D3] shadow-2xs group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#A3073B]" />
                  <span>Ver todas las citas e historial ({appointments.length})</span>
                </span>
                <span className="text-[11px] font-black group-hover:translate-x-0.5 transition-transform">
                  Ver todas →
                </span>
              </button>
            )}
          </aside>

          {/* Right Column: Integrated Booking Wizard */}
          <main className="lg:col-span-8 xl:col-span-8">
            <div id="booking-wizard-section" className="bg-white rounded-3xl p-7 lg:p-9 shadow-soft-card border border-slate-100" data-purpose="booking-wizard">
              
              {/* Section Hero Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 mb-6 border-b border-slate-100 gap-4">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Reserva tu Cita Médica</h2>
                  <p className="text-sm text-slate-500 mt-1">Completa los pasos a continuación para agendar tu cita.</p>
                </div>
              </div>

              {/* Progressive Step Progress Milestones */}
              <div className="flex flex-wrap items-center gap-2 mb-7 text-xs bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                {/* Milestone 1: Sede */}
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition ${
                    activeStep === 1
                      ? 'bg-[#A3073B] text-white shadow-xs'
                      : selectedSedeId !== null
                      ? 'bg-white text-slate-800 shadow-2xs border border-slate-200 hover:bg-slate-50'
                      : 'text-slate-400 opacity-60'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                    activeStep === 1
                      ? 'bg-white text-[#A3073B]'
                      : selectedSedeId !== null
                      ? 'bg-[#A3073B] text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {selectedSedeId !== null && activeStep > 1 ? '✓' : '1'}
                  </span>
                  <span>{currentSede ? currentSede.name.replace(/\s*\((Principal|Alterna)\)/gi, '') : 'Sede'}</span>
                </button>

                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

                {/* Milestone 2: Especialidad */}
                <button
                  type="button"
                  disabled={selectedSedeId === null}
                  onClick={() => selectedSedeId !== null && setActiveStep(2)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition ${
                    activeStep === 2
                      ? 'bg-[#A3073B] text-white shadow-xs'
                      : selectedSpecialtyId !== null
                      ? 'bg-white text-slate-800 shadow-2xs border border-slate-200 hover:bg-slate-50'
                      : 'text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                    activeStep === 2
                      ? 'bg-white text-[#A3073B]'
                      : selectedSpecialtyId !== null
                      ? 'bg-[#A3073B] text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {selectedSpecialtyId !== null && activeStep > 2 ? '✓' : '2'}
                  </span>
                  <span>{currentSpecialty ? currentSpecialty.name : 'Especialidad'}</span>
                </button>

                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

                {/* Milestone 3: Fecha */}
                <button
                  type="button"
                  disabled={selectedSpecialtyId === null}
                  onClick={() => selectedSpecialtyId !== null && setActiveStep(3)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition ${
                    activeStep === 3
                      ? 'bg-[#A3073B] text-white shadow-xs'
                      : selectedTime !== ''
                      ? 'bg-white text-slate-800 shadow-2xs border border-slate-200 hover:bg-slate-50'
                      : 'text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                    activeStep === 3
                      ? 'bg-white text-[#A3073B]'
                      : selectedTime !== ''
                      ? 'bg-[#A3073B] text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {selectedTime !== '' && activeStep > 3 ? '✓' : '3'}
                  </span>
                  <span>{selectedTime ? formatDateTimeBadge(selectedDate, selectedTime) : 'Fecha'}</span>
                </button>

                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

                {/* Milestone 4: Confirmación */}
                <button
                  type="button"
                  disabled={selectedTime === ''}
                  onClick={() => selectedTime !== '' && setActiveStep(4)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition ${
                    activeStep === 4
                      ? 'bg-[#A3073B] text-white shadow-xs'
                      : 'text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                    activeStep === 4
                      ? 'bg-white text-[#A3073B]'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    4
                  </span>
                  <span>Confirmar</span>
                </button>
              </div>

              {/* ================= PASO 1: SEDE (Único visible en Paso 1) ================= */}
              {activeStep === 1 && (
                <div className="animate-fade-in-slide space-y-6" data-purpose="step-1-sede">
                  <div>
                    <label className="text-base font-extrabold uppercase tracking-wider text-slate-800">
                      Sede de Atención
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      Selecciona la sede donde deseas recibir tu atención médica.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(locations.length > 0
                      ? locations
                      : [
                          { id: 1, code: 'ICV', name: 'Sede El Bosque', address: 'Calle 155A No. 23-58', city: 'Floridablanca', active: true },
                          { id: 2, code: 'HIC', name: 'Sede Norte', address: 'Km 7 Autopista Bucaramanga', city: 'Piedecuesta', active: true },
                        ]
                    )
                      .filter((s) => s.active !== false)
                      .map((sede) => {
                      const isSelected = selectedSedeId === sede.id;
                      const cleanName = sede.name.replace(/\s*\((Principal|Alterna)\)/gi, '');
                      return (
                        <button
                          key={sede.id}
                          type="button"
                          onClick={() => {
                            setSelectedSedeId(sede.id);
                            setSelectedTime('');
                            setSelectedSlot(null);
                            setSelectedProfessionalId(null);
                          }}
                          className={`relative flex flex-col p-5 rounded-2xl cursor-pointer text-left transition duration-200 ${
                            isSelected
                              ? 'border-2 border-[#A3073B] bg-[#FDF2F4]/50 shadow-sm ring-2 ring-[#A3073B]/20'
                              : 'border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2 w-full">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isSelected ? 'text-[#A3073B]' : 'text-slate-400'}`}>
                              {sede.id === 1 ? 'Sede Principal' : 'Sede Alterna'}
                            </span>
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${
                                isSelected ? 'bg-[#A3073B]' : 'border border-slate-300'
                              }`}
                            >
                              {isSelected && (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{cleanName}</span>
                          <span className="text-xs text-slate-500 mt-1 block">{sede.address}</span>
                          <span className="text-xs font-semibold text-slate-400 block mt-0.5">{sede.city}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-end border-t border-slate-100">
                    <button
                      type="button"
                      disabled={!isStep1Valid}
                      onClick={() => isStep1Valid && setActiveStep(2)}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                        isStep1Valid
                          ? 'bg-[#A3073B] hover:bg-[#870530] text-white shadow-sm'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Continuar a Especialidad</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ================= PASO 2: ESPECIALIDAD (Único visible en Paso 2) ================= */}
              {activeStep === 2 && (
                <div className="animate-fade-in-slide space-y-6" data-purpose="step-2-especialidad">
                  <div>
                    <label className="text-base font-extrabold uppercase tracking-wider text-slate-800">
                      Especialidad Médica
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      Elige el tipo de consulta médica que requieres.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1 custom-scroll">
                    {sortedSpecialties
                      .filter((s) => s.active !== false)
                      .map((spec) => {
                      const numericId = typeof spec.id === 'number' ? spec.id : (parseInt(String(spec.id).replace(/\D/g, ''), 10) || 1);
                      const isSelected = selectedSpecialtyId === numericId;
                      const isGeneral = spec.isGeneral || spec.id === 1 || spec.name.toLowerCase().includes('general');
                      return (
                        <button
                          key={spec.id}
                          type="button"
                          onClick={() => {
                            setSelectedSpecialtyId(numericId);
                            setSelectedTime('');
                            setSelectedSlot(null);
                            const matching = professionals.filter((p) => p.specialtyIds.includes(numericId));
                            if (matching.length > 0) {
                              setSelectedProfessionalId(matching[0].id);
                            } else {
                              setSelectedProfessionalId(null);
                            }
                          }}
                          className={`flex flex-col text-left p-4 rounded-2xl transition duration-150 ${
                            isSelected
                              ? 'bg-[#A3073B] text-white shadow-md shadow-slate-900/10 border-2 border-[#A3073B] ring-2 ring-[#A3073B]/20'
                              : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-[#FDF2F4] text-[#A3073B]'
                            }`}>
                              {getSpecialtyIcon(spec.name, isSelected ? 'w-4 h-4 text-white' : 'w-4 h-4 text-[#A3073B]')}
                            </div>
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-white text-[#A3073B] flex items-center justify-center text-[10px] font-black shrink-0 ml-1">
                                ✓
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold leading-tight">{spec.name}</span>
                          <span className={`text-[10px] font-medium mt-1 ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                            {isGeneral ? 'No requiere remisión' : 'Especializada'} • {spec.durationMinutes ?? 30}m
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      ← Volver a Sede
                    </button>
                    <button
                      type="button"
                      disabled={!isStep2Valid}
                      onClick={() => isStep2Valid && setActiveStep(3)}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                        isStep2Valid
                          ? 'bg-[#A3073B] hover:bg-[#870530] text-white shadow-sm'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Continuar a Fecha</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ================= PASO 3: PROFESIONAL, FECHA Y HORARIOS (Único visible en Paso 3) ================= */}
              {activeStep === 3 && (
                <div className="animate-fade-in-slide space-y-6" data-purpose="step-3-horarios">
                  <div>
                    <label className="text-base font-extrabold uppercase tracking-wider text-slate-800">
                      Profesional Médico, Fecha y Horario
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      Elige el profesional y la franja horaria que mejor se adapte a tu disponibilidad.
                    </p>
                  </div>

                  {/* Selectores estilizados de Médico y Fecha */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                    <div>
                      <div className="min-h-7 flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-700">
                          Profesional Médico
                        </label>
                      </div>
                      <CustomSelect
                        value={selectedProfessionalId ?? ''}
                        onChange={(val) => {
                          setSelectedProfessionalId(val ? Number(val) : null);
                          setSelectedTime('');
                          setSelectedSlot(null);
                        }}
                        placeholder="Cualquier profesional disponible"
                        options={[
                          { value: '', label: 'Cualquier profesional disponible' },
                          ...professionals
                            .filter((p) => p.specialtyIds.includes(selectedSpecialtyId || 1))
                            .map((doc) => ({
                              value: doc.id,
                              label: cleanProfessionalName(doc.name),
                            })),
                        ]}
                      />
                    </div>

                    <div>
                      <div className="min-h-7 flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-700">
                          Fecha de Consulta
                        </label>
                        <div className="flex items-center gap-1.5">
                          {getUpcomingBookingDays(3).map((chip) => (
                            <button
                              key={chip.iso}
                              type="button"
                              onClick={() => {
                                setSelectedDate(chip.iso);
                                setSelectedTime('');
                                setSelectedSlot(null);
                              }}
                              className={`h-7 px-2.5 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center justify-center ${
                                selectedDate === chip.iso
                                  ? 'bg-[#A3073B] text-white border-[#A3073B] shadow-2xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <CustomDatePicker
                        value={selectedDate}
                        min={getTodayIso()}
                        onChange={(newD) => {
                          setSelectedDate(newD);
                          setSelectedTime('');
                          setSelectedSlot(null);
                        }}
                      />
                    </div>
                  </div>

                  {/* Grid de Franjas Disponibles agrupadas por fecha */}
                  <div>
                    <div className="mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        Franjas Disponibles a partir del {formatDisplayDate(selectedDate)}
                      </span>
                    </div>

                    {isLoadingSlots ? (
                      <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center flex items-center justify-center gap-3">
                        <span className="w-5 h-5 border-2 border-[#A3073B] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-semibold text-slate-600">Consultando franjas disponibles en tiempo real...</span>
                      </div>
                    ) : liveSlots.length > 0 ? (
                      <div className="space-y-4 max-h-80 overflow-y-auto pr-1 custom-scroll">
                        {Object.entries(
                          liveSlots.reduce((acc, slot) => {
                            const dateKey = slot.startAt.split('T')[0];
                            if (!acc[dateKey]) acc[dateKey] = [];
                            acc[dateKey].push(slot);
                            return acc;
                          }, {} as Record<string, AvailableSlot[]>)
                        ).map(([dateKey, slots]) => (
                          <div key={dateKey} className="space-y-2">
                            <div className="flex items-center gap-2 pt-2 pb-1 border-b border-slate-100">
                              <Calendar className="w-3.5 h-3.5 text-[#A3073B]" />
                              <span className="text-xs font-extrabold text-slate-800">
                                {formatDateHeading(dateKey)}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 ml-auto">
                                {slots.length} {slots.length === 1 ? 'franja' : 'franjas'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                              {slots.map((slot) => {
                                const timeFormatted = formatTimeFromIso(slot.startAt);
                                const isSelected = (selectedSlot?.slotId === slot.slotId) || (selectedTime === timeFormatted && selectedDate === dateKey);
                                const isConflicting = isSlotConflicting(slot);
                                return (
                                  <button
                                    key={slot.slotId}
                                    type="button"
                                    disabled={isConflicting}
                                    title={isConflicting ? 'Ya cuentas con una cita médica programada en este horario' : undefined}
                                    onClick={() => {
                                      if (isConflicting) return;
                                      setSelectedSlot(slot);
                                      setSelectedTime(timeFormatted);
                                      setSelectedDate(dateKey);
                                      setSelectedProfessionalId(slot.professionalId);
                                    }}
                                    className={`p-3.5 rounded-2xl text-center transition group relative ${
                                      isConflicting
                                        ? 'border border-amber-200/90 bg-amber-50/70 text-slate-400 cursor-not-allowed opacity-85'
                                        : isSelected
                                        ? 'border-2 border-[#A3073B] bg-[#FDF2F4] shadow-xs ring-2 ring-[#A3073B]/20 cursor-pointer'
                                        : 'border border-slate-200 bg-white hover:border-[#A3073B]/50 hover:bg-slate-50 cursor-pointer'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center gap-1.5">
                                      <p className={`text-xs font-extrabold ${isConflicting ? 'text-amber-800 line-through decoration-amber-400' : isSelected ? 'text-[#A3073B]' : 'text-slate-800'}`}>
                                        {timeFormatted}
                                      </p>
                                      {isSelected && !isConflicting && (
                                        <span className="w-3.5 h-3.5 rounded-full bg-[#A3073B] text-white flex items-center justify-center text-[9px] font-black shrink-0">
                                          ✓
                                        </span>
                                      )}
                                    </div>
                                    {isConflicting ? (
                                      <span className="inline-block text-[9px] font-extrabold text-amber-700 bg-amber-100/90 border border-amber-200/70 px-1.5 py-0.5 rounded-md mt-1">
                                        Ya tienes cita
                                      </span>
                                    ) : (
                                      <p className={`text-[10px] font-bold mt-0.5 truncate ${isSelected ? 'text-[#A3073B]' : 'text-slate-400'}`}>
                                        {cleanProfessionalName(slot.professionalName)}
                                      </p>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                        <p className="text-xs font-bold text-slate-700">
                          No hay franjas disponibles a partir del {formatDisplayDate(selectedDate)}.
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Prueba seleccionando otra fecha mediante los botones rápidos o elige otro especialista.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      ← Volver a Especialidades
                    </button>
                    <button
                      type="button"
                      disabled={!isStep3Valid}
                      onClick={() => isStep3Valid && setActiveStep(4)}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                        isStep3Valid
                          ? 'bg-[#A3073B] hover:bg-[#870530] text-white shadow-sm'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Continuar a Confirmación</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ================= PASO 4: CONFIRMACIÓN Y DETALLES (Único visible en Paso 4) ================= */}
              {activeStep === 4 && currentSpecialty && (
                <div className="animate-fade-in-slide space-y-6" data-purpose="step-4-confirmacion">
                  <div>
                    <label className="text-base font-extrabold uppercase tracking-wider text-slate-800">
                      Detalles y Confirmación de Cita
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      Verifica la información antes de solicitar tu cita médica.
                    </p>
                  </div>

                  {/* Tarjeta de Resumen Clínico */}
                  <div className="rounded-3xl border border-[#F3C5D3] bg-gradient-to-r from-[#FDF2F4]/80 to-[#FFF7F9] shadow-soft-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A3073B] to-[#870530] text-white flex items-center justify-center shadow-xs font-bold text-base shrink-0">
                        {cleanProfessionalName(currentDoctor?.name).charAt(0) || 'P'}
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A3073B] block">
                          {currentSpecialty.name} • {currentSpecialty.isGeneral ? 'Confirmación Inmediata' : 'Cita Especializada'}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 leading-tight">
                          Profesional: {cleanProfessionalName(currentDoctor?.name) || 'Asignado'}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#A3073B] shrink-0" />
                          <span>Sede: {currentSede?.name.replace(/\s*\((Principal|Alterna)\)/gi, '')}</span>
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right bg-white p-3.5 rounded-2xl border border-[#F3C5D3]/70 shadow-2xs">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Fecha y Hora
                      </span>
                      <p className="text-sm font-extrabold text-slate-900">
                        {formatDisplayDate(selectedDate)}
                      </p>
                      <p className="text-xs font-bold text-[#A3073B]">
                        {selectedTime}
                      </p>
                    </div>
                  </div>

                  {/* Tarjeta de Autorización EPS (si es especialista) - Fondo un poco gris, sin bordes rojos */}
                  {!currentSpecialty.isGeneral && (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50/90 shadow-2xs p-5 sm:p-6">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-slate-700" />
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                              Autorización EPS / Orden Médica
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500">
                          Ingresa el código alfanumérico emitido por tu EPS o médico general para validar tu cupo especializado.
                        </p>

                        <div className="mt-1">
                          <input
                            type="text"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                            className={`w-full bg-white border-2 rounded-2xl py-3.5 px-4 text-base sm:text-xl font-mono font-black tracking-widest text-[#A3073B] focus:outline-none transition shadow-2xs ${
                              referralCode.trim().length > 0 && !isAuthCodeValid
                                ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                                : 'border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200'
                            }`}
                          />

                          {!isAuthCodeValid && (
                            <p className="text-xs text-red-600 font-semibold mt-2 flex items-center gap-1.5">
                              <span>Código obligatorio para especialista (mínimo 4 caracteres alfanuméricos).</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer con Confirmación */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      ← Volver a Fecha
                    </button>
                    
                    <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto">
                      <button
                        type="button"
                        disabled={!isStep4Valid}
                        onClick={handleConfirmDirectBooking}
                        className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-xs tracking-wide transition duration-150 ${
                          isStep4Valid
                            ? 'bg-[#A3073B] hover:bg-[#870530] text-white shadow-md shadow-slate-900/10 hover:shadow-lg'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Confirmar y agendar cita
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>
      )}

      {/* ==================== VISTA ROL MÉDICO ==================== */}
      {currentRole === 'PROFESSIONAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          <aside className="lg:col-span-4 xl:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-soft-card border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#A3073B]/10 border border-[#A3073B]/20 flex items-center justify-center text-[#A3073B] font-bold">
                    {user.name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('') || 'MD'}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A3073B]">Turno Médico</span>
                    <h2 className="text-lg font-bold text-slate-900 leading-snug">{user.name}</h2>
                    <p className="text-xs text-slate-400 font-medium">
                      {loggedDoctor?.licenseNumber ? `Registro Médico • ${loggedDoctor.licenseNumber}` : 'Profesional de la Salud'}
                    </p>
                  </div>
                </div>

                {/* Badge dinámico inteligente basado en la hora real */}
                {currentActiveConsultation ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    En Consulta
                  </span>
                ) : todayDoctorAgenda.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    En Turno Clínico
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    Sin Turno Activo
                  </span>
                )}
              </div>

              {currentActiveConsultation && (
                <div className="mb-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider block">
                    Paciente en consultorio ahora
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {currentActiveConsultation.patientName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {currentActiveConsultation.specialtyName} • {formatTimeFromIso(currentActiveConsultation.scheduledStartAt)} - {formatTimeFromIso(currentActiveConsultation.scheduledEndAt)}
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100/90 space-y-2.5">
                <div className="flex flex-col gap-1.5 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-medium">Sedes de atención habilitadas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {doctorAssignedLocations.length > 0 ? (
                      doctorAssignedLocations.map((loc) => (
                        <span
                          key={loc.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-800 border border-slate-200/80 shadow-2xs"
                        >
                          <MapPin className="w-3 h-3 text-[#A3073B]" />
                          {loc.name.replace(/\s*\((Principal|Alterna)\)/gi, '')}
                        </span>
                      ))
                    ) : (
                      <span className="font-bold text-slate-800">Sede Principal</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500">Pacientes citados hoy:</span>
                  <span className="font-bold text-[#A3073B]">{todayDoctorAgenda.length} pacientes</span>
                </div>
                <div className="flex items-center justify-between text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500">Atendidos hoy:</span>
                  <span className="font-bold text-slate-800">
                    {todayDoctorAgenda.filter((a) => a.statusCode === 'COMPLETED').length} de {todayDoctorAgenda.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500">Próximos días:</span>
                  <span className="font-bold text-slate-700">{upcomingDoctorAgenda.length} agendados</span>
                </div>
              </div>
            </div>

            {/* Tarjeta lateral de Gestión de Disponibilidad (RF-08) */}
            <div className="bg-white rounded-3xl p-6 shadow-soft-card border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#A3073B]/10 text-[#A3073B] flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                      Franjas y Cupos
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Gestión de Disponibilidad</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {doctorBlocks.length} {doctorBlocks.length === 1 ? 'bloque' : 'bloques'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Cupos totales habilitados:</span>
                  <span className="font-extrabold text-slate-900">
                    {doctorBlocks.reduce((acc, b) => acc + (b.totalSlots || 0), 0)} cupos
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Cupos ya reservados:</span>
                  <span className="font-bold text-[#A3073B]">
                    {doctorBlocks.reduce((acc, b) => acc + (b.bookedSlots || 0), 0)} citas
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Cupos disponibles libres:</span>
                  <span className="font-bold text-emerald-700">
                    {doctorBlocks.reduce((acc, b) => acc + Math.max(0, (b.totalSlots || 0) - (b.bookedSlots || 0)), 0)} libres
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreateBlockModalOpen(true)}
                  className="w-full py-2.5 px-4 bg-[#A3073B] hover:bg-[#870530] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Publicar Franja Horaria</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDoctorActiveTab(doctorActiveTab === 'agenda' ? 'availability' : 'agenda')}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {doctorActiveTab === 'agenda' ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Ver Mis Franjas Publicadas</span>
                    </>
                  ) : (
                    <>
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Volver a Agenda de Pacientes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8 xl:col-span-8">
            <div className="bg-white rounded-3xl p-7 lg:p-9 shadow-soft-card border border-slate-100">
              
              {/* Segmented Tab Switcher for Doctor: Agenda vs Availability */}
              <div className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/50 mb-6 w-fit" data-purpose="doctor-tab-switcher">
                <button
                  type="button"
                  onClick={() => setDoctorActiveTab('agenda')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    doctorActiveTab === 'agenda'
                      ? 'text-white bg-[#A3073B] shadow-sm shadow-slate-900/10'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Agenda de Pacientes</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    doctorActiveTab === 'agenda' ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                  }`}>
                    {todayDoctorAgenda.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDoctorActiveTab('availability')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    doctorActiveTab === 'availability'
                      ? 'text-white bg-[#A3073B] shadow-sm shadow-slate-900/10'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Gestión de Disponibilidad</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    doctorActiveTab === 'availability' ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                  }`}>
                    {doctorBlocks.length}
                  </span>
                </button>
              </div>

              {/* VISTA 1: AGENDA DE PACIENTES */}
              {doctorActiveTab === 'agenda' && (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-4">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#A3073B]">Agenda de Atención</span>
                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Pacientes Citados</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {doctorLocationFilter === 'all'
                          ? 'Todas las Sedes • Agenda Asistencial Integrada'
                          : `${locations.find((l) => l.id === doctorLocationFilter)?.name || 'Sede Seleccionada'} • Consultorio Asignado`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={loadDoctorAgenda}
                      className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full border border-slate-200 transition cursor-pointer"
                    >
                      Actualizar Agenda
                    </button>
                  </div>

                  {/* Barra de Filtros Avanzados (HU-033) */}
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 mb-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Buscador de Paciente */}
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={doctorSearchQuery}
                          onChange={(e) => setDoctorSearchQuery(e.target.value)}
                          placeholder="Buscar paciente, documento, EPS o motivo..."
                          className="w-full pl-9 pr-7 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#A3073B]/20 focus:border-[#A3073B] transition"
                        />
                        {doctorSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setDoctorSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Selector de Sede */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold shrink-0">
                          <Building2 className="w-4 h-4 text-[#A3073B]" />
                          <span>Sede:</span>
                        </div>
                        <div className="w-48">
                          <CustomSelect
                            value={doctorLocationFilter}
                            onChange={(val) => setDoctorLocationFilter(val === 'all' ? 'all' : Number(val))}
                            placeholder="Todas las Sedes"
                            options={[
                              { value: 'all', label: 'Todas las Sedes' },
                              ...locations.map((loc) => ({ value: loc.id, label: loc.name })),
                            ]}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Filtros de Fecha y Selector Específico */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setDoctorDateTab('today'); setDoctorCustomDate(''); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            doctorDateTab === 'today'
                              ? 'bg-[#A3073B] text-white shadow-xs'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                          }`}
                        >
                          <span>Citas de Hoy ({getUpcomingBookingDays(1)[0]?.label || 'Hoy'})</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                            doctorDateTab === 'today' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {todayDoctorAgenda.length}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setDoctorDateTab('upcoming'); setDoctorCustomDate(''); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            doctorDateTab === 'upcoming'
                              ? 'bg-[#A3073B] text-white shadow-xs'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                          }`}
                        >
                          <span>Próximos Días</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                            doctorDateTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {upcomingDoctorAgenda.length}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setDoctorDateTab('past'); setDoctorCustomDate(''); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            doctorDateTab === 'past'
                              ? 'bg-[#A3073B] text-white shadow-xs'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                          }`}
                        >
                          <span>Historial / Pasadas</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                            doctorDateTab === 'past' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {pastDoctorAgenda.length}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setDoctorDateTab('all'); setDoctorCustomDate(''); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            doctorDateTab === 'all'
                              ? 'bg-[#A3073B] text-white shadow-xs'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                          }`}
                        >
                          <span>Todas ({doctorAgenda.length})</span>
                        </button>

                        {/* Input de Fecha Específica */}
                        <div className="w-52">
                          <CustomDatePicker
                            value={doctorCustomDate}
                            placeholder="Fecha específica..."
                            onChange={(val) => {
                              setDoctorCustomDate(val);
                              setDoctorDateTab('custom');
                            }}
                          />
                        </div>
                      </div>

                      {/* Botón Restablecer Filtros si hay alguno activo */}
                      {(doctorLocationFilter !== 'all' || doctorSearchQuery || doctorDateTab !== 'today') && (
                        <button
                          type="button"
                          onClick={() => {
                            setDoctorLocationFilter('all');
                            setDoctorSearchQuery('');
                            setDoctorDateTab('today');
                            setDoctorCustomDate('');
                          }}
                          className="text-[11px] font-bold text-[#A3073B] hover:text-[#870530] flex items-center gap-1 transition cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restablecer filtros</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isLoadingDoctorAgenda ? (
                    <div className="p-8 text-center text-slate-400 font-medium text-xs">
                      Cargando agenda médica...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(() => {
                        const currentList = doctorDateTab === 'today'
                          ? todayDoctorAgenda
                          : doctorDateTab === 'upcoming'
                          ? upcomingDoctorAgenda
                          : doctorDateTab === 'past'
                          ? pastDoctorAgenda
                          : doctorDateTab === 'custom' && doctorCustomDate
                          ? doctorAgenda.filter((a) => a.scheduledStartAt.startsWith(doctorCustomDate))
                          : doctorAgenda;

                        const locationFiltered = doctorLocationFilter === 'all'
                          ? currentList
                          : currentList.filter((a) => a.locationId === Number(doctorLocationFilter));

                        const filteredList = doctorSearchQuery.trim()
                          ? locationFiltered.filter((a) => {
                              const q = doctorSearchQuery.toLowerCase().trim();
                              return (
                                a.patientName.toLowerCase().includes(q) ||
                                (a.patientDocumentNumber && a.patientDocumentNumber.includes(q)) ||
                                (a.epsName && a.epsName.toLowerCase().includes(q)) ||
                                (a.reason && a.reason.toLowerCase().includes(q))
                              );
                            })
                          : locationFiltered;

                        if (filteredList.length === 0) {
                          return (
                            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                              <p className="text-xs font-bold text-slate-700">
                                {doctorSearchQuery || doctorLocationFilter !== 'all' || doctorDateTab === 'custom'
                                  ? 'No se encontraron citas con los filtros seleccionados'
                                  : doctorDateTab === 'today'
                                  ? 'No hay citas programadas para el día de hoy'
                                  : doctorDateTab === 'upcoming'
                                  ? 'No hay citas agendadas para los próximos días'
                                  : doctorDateTab === 'past'
                                  ? 'No hay citas en el historial de días anteriores'
                                  : 'No hay citas registradas en la agenda'}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {doctorSearchQuery || doctorLocationFilter !== 'all' || doctorDateTab === 'custom'
                                  ? 'Prueba modificando la sede, la fecha o el texto de búsqueda.'
                                  : 'Las citas agendadas o confirmadas se sincronizan automáticamente con este panel.'}
                              </p>
                            </div>
                          );
                        }

                        return filteredList.map((apt) => {
                          const timeStr = formatTimeFromIso(apt.scheduledStartAt);
                          const dateStr = apt.scheduledStartAt.split('T')[0];
                          const isPending = apt.statusCode === 'APPROVED';
                          const isCompleted = apt.statusCode === 'COMPLETED';
                          const isNoShow = apt.statusCode === 'NO_SHOW';
                          const phase = getAppointmentPhase(apt.scheduledStartAt, apt.scheduledEndAt, apt.statusCode);

                          return (
                            <div
                              key={apt.id}
                              className={`p-5 rounded-2xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                                phase.phase === 'in_consultation'
                                  ? 'border-2 border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-400/20'
                                  : phase.phase === 'overdue_today'
                                  ? 'border-2 border-amber-300 bg-amber-50/40 shadow-xs'
                                  : isPending
                                  ? 'border-[#A3073B]/30 bg-slate-50/50 shadow-2xs'
                                  : isCompleted
                                  ? 'border-slate-300/80 bg-slate-50/60 shadow-2xs'
                                  : 'border-slate-200 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-extrabold text-xs shrink-0 ${
                                    phase.phase === 'in_consultation'
                                      ? 'bg-emerald-600 text-white shadow-xs animate-pulse'
                                      : isPending
                                      ? 'bg-[#A3073B] text-white shadow-xs'
                                      : isCompleted
                                      ? 'bg-slate-900 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}
                                >
                                  <span>{timeStr.split(' ')[0]}</span>
                                  <span className="text-[9px] font-bold opacity-80">{timeStr.split(' ')[1]}</span>
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-sm font-bold text-slate-900">{apt.patientName}</h4>
                                    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${phase.badgeClass}`}>
                                      {phase.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {apt.patientDocumentType} {apt.patientDocumentNumber} • {apt.epsName} • {apt.specialtyName}
                                    {doctorDateTab !== 'today' && (
                                      <span className="font-bold text-slate-700 ml-1">
                                        • {formatDisplayDate(dateStr)}
                                      </span>
                                    )}
                                  </p>
                                  {apt.reason && (
                                    <p className="text-[11px] text-slate-400 mt-1 italic">
                                      Motivo: {apt.reason}
                                    </p>
                                  )}
                                  {apt.referralCode && (
                                    <p className="text-[10px] font-mono font-bold text-slate-600 mt-0.5">
                                      Orden EPS: {apt.referralCode}
                                    </p>
                                  )}
                                  {phase.phase === 'overdue_today' && (
                                    <p className="text-[10px] text-amber-800 font-semibold mt-1">
                                      El tiempo programado de esta cita ha culminado. Por favor marca el cierre médico o la inasistencia.
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                                {isPending && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCompletingApt(apt);
                                        setCompleteNotes('');
                                      }}
                                      className="px-4 py-2 bg-[#A3073B] hover:bg-[#870530] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                                    >
                                      Terminar Atención
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleNoShowAppointment(apt)}
                                      className="px-3 py-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-medium text-xs rounded-xl transition cursor-pointer"
                                    >
                                      No asistió
                                    </button>
                                  </>
                                )}

                                {isCompleted && (
                                  <span className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-300 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-800" />
                                    Consulta Finalizada
                                  </span>
                                )}

                                {isNoShow && (
                                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                                    Inasistencia Registrada
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </>
              )}

              {/* VISTA 2: GESTIÓN DE DISPONIBILIDAD Y FRANJAS (RF-08) */}
              {doctorActiveTab === 'availability' && (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-4">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#A3073B]">
                        Gestión de Disponibilidad
                      </span>
                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                        Franjas de Atención y Cupos
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Turnos clínicos habilitados para agendamiento directo de pacientes afiliados.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreateBlockModalOpen(true)}
                        className="text-xs font-bold text-white bg-[#A3073B] hover:bg-[#870530] px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Publicar Franja Horaria</span>
                      </button>
                      <button
                        type="button"
                        onClick={loadDoctorBlocks}
                        className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl border border-slate-200 transition cursor-pointer"
                      >
                        Actualizar
                      </button>
                    </div>
                  </div>

                  {isLoadingDoctorBlocks ? (
                    <div className="p-8 text-center text-slate-400 font-medium text-xs">
                      Cargando franjas de disponibilidad...
                    </div>
                  ) : doctorBlocks.length === 0 ? (
                    <div className="p-12 rounded-3xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-white text-[#A3073B] border border-slate-200 mx-auto flex items-center justify-center shadow-xs">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">No tienes franjas de disponibilidad registradas</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                          Al publicar un turno en una de tus sedes asignadas, se generarán automáticamente los cupos continuos de 30 minutos disponibles para los pacientes.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCreateBlockModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A3073B] hover:bg-[#870530] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Publicar Mi Primera Franja</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {doctorBlocks.map((block) => {
                        const occupancyPercent = block.totalSlots > 0 ? Math.round((block.bookedSlots / block.totalSlots) * 100) : 0;
                        const freeSlots = Math.max(0, block.totalSlots - block.bookedSlots);
                        const formattedDate = formatDateHeading(block.availableDate);

                        return (
                          <div
                            key={block.id}
                            className="p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-soft-card transition space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="flex items-start gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-[#A3073B]/10 border border-[#A3073B]/20 flex flex-col items-center justify-center text-[#A3073B] shrink-0 font-extrabold text-xs">
                                  <Calendar className="w-4 h-4 mb-0.5" />
                                  <span className="text-[10px] font-mono leading-none">{block.availableDate.split('-')[2]}</span>
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-sm font-bold text-slate-900">{formattedDate}</h4>
                                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                      {block.locationName}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="font-semibold text-slate-800">
                                      {block.startTime.substring(0, 5)} a {block.endTime.substring(0, 5)}
                                    </span>
                                    <span>• {block.locationAddress}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Action Button */}
                              <div className="self-end sm:self-center shrink-0">
                                {block.canDelete ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBlock(block)}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                                    title="Eliminar franja sin reservas"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Eliminar Franja</span>
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-bold text-slate-600">
                                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{block.bookedSlots} cita(s) agendada(s) (Protegida)</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Breakdown Metrics */}
                            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cupos Generados</span>
                                <span className="font-bold text-slate-800">{block.totalSlots} cupos de 30 min</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Citas Reservadas</span>
                                <span className="font-bold text-[#A3073B]">{block.bookedSlots} paciente(s)</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cupos Disponibles</span>
                                <span className="font-bold text-emerald-700">{freeSlots} libres para agendar</span>
                              </div>
                            </div>

                            {/* Occupancy bar */}
                            <div>
                              <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
                                <span>Ocupación de la jornada</span>
                                <span className="font-bold text-slate-700">{occupancyPercent}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-[#A3073B] h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${occupancyPercent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      )}

      {/* ==================== VISTA ROL ADMINISTRADOR ==================== */}
      {currentRole === 'ADMIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          <aside className="lg:col-span-4 xl:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-soft-card border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#A3073B]/10 border border-[#A3073B]/20 flex items-center justify-center text-[#A3073B] font-bold">
                    {user.name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('') || 'AD'}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A3073B]">Administración</span>
                    <h2 className="text-lg font-bold text-slate-900 leading-snug">Centro de Operaciones</h2>
                    <p className="text-xs text-slate-400 font-medium">Control de sedes y autorizaciones</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {locationsOccupancy.length > 0 ? `${locationsOccupancy.length} Sedes Activas` : 'Red Asistencial'}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100/90 space-y-4">
                {isLoadingOccupancy ? (
                  <p className="text-xs text-slate-400 text-center py-2">Consultando métricas de sedes en tiempo real...</p>
                ) : locationsOccupancy.length > 0 ? (
                  locationsOccupancy.map((loc) => {
                    const pct = loc.occupancyPercentMonth;
                    return (
                      <div key={loc.locationId} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-800">{loc.locationName}</span>
                          <span className={pct > 0 ? 'text-[#A3073B] font-extrabold' : 'text-slate-500 font-semibold'}>
                            {pct}% Ocupación
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#A3073B] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(pct > 0 ? 4 : 0, pct))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                          <span>
                            {loc.bookedSlotsMonth} de {loc.totalSlotsMonth} cupos agendados
                          </span>
                          <span>
                            {loc.activeProfessionalsCount} {loc.activeProfessionalsCount === 1 ? 'médico' : 'médicos'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">Sin sedes activas registradas.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-soft-card border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Por Autorizar EPS</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#A3073B] text-white">
                  {adminRequests.length} {adminRequests.length === 1 ? 'caso' : 'casos'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Citas con especialistas que requieren validación de código de autorización antes de confirmar cupo.
              </p>
            </div>
          </aside>

          <main className="lg:col-span-8 xl:col-span-8 space-y-6">
            {/* Pestañas de Navegación del Panel de Administración */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 max-w-fit">
              <button
                type="button"
                onClick={() => setAdminActiveTab('requests')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition duration-150 ${
                  adminActiveTab === 'requests'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Autorizaciones Médicas</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    adminActiveTab === 'requests'
                      ? 'bg-[#A3073B] text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {adminRequests.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAdminActiveTab('professionals')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition duration-150 ${
                  adminActiveTab === 'professionals'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Profesionales de Salud</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    adminActiveTab === 'professionals'
                      ? 'bg-[#A3073B] text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {professionals.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAdminActiveTab('catalogs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition duration-150 ${
                  adminActiveTab === 'catalogs'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Catálogos y Sedes</span>
              </button>
            </div>

            {/* TAB 1: AUTORIZACIONES MÉDICAS PENDIENTES */}
            {adminActiveTab === 'requests' && (
              <div className="bg-white rounded-3xl p-7 lg:p-9 shadow-soft-card border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-7 border-b border-slate-100 gap-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#A3073B]">Gestión de Solicitudes</span>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Autorizaciones Médicas Pendientes</h2>
                    <p className="text-sm text-slate-500 mt-1">Revisa el soporte de EPS y aprueba o rechaza la solicitud del afiliado.</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadAdminRequests}
                    className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full border border-slate-200 transition"
                  >
                    Actualizar Solicitudes
                  </button>
                </div>

                {isLoadingAdminRequests ? (
                  <div className="p-8 text-center text-slate-400 font-medium text-xs">
                    Cargando solicitudes pendientes...
                  </div>
                ) : adminRequests.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-700">No hay autorizaciones pendientes</p>
                    <p className="text-[11px] text-slate-400">
                      Todas las solicitudes de citas especializadas han sido procesadas oportunamente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adminRequests.map((req) => {
                      const timeFormatted = formatTimeFromIso(req.scheduledStartAt);
                      const dateFormatted = req.scheduledStartAt.split('T')[0];

                      return (
                        <div
                          key={req.id}
                          className="p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-soft-card transition space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-extrabold text-[#A3073B] uppercase tracking-wider">
                                {req.specialtyName}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900">
                                {req.patientName} ({req.patientDocument})
                              </h4>
                              <p className="text-xs text-slate-500">
                                {req.professionalName} • {req.locationName} • {formatDisplayDate(dateFormatted)} {timeFormatted}
                              </p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 self-start sm:self-auto">
                              Requiere Autorización EPS
                            </span>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <span className="text-slate-600 font-medium">
                              {req.epsName} {req.referralCode ? `• Orden Médica N° ${req.referralCode}` : '• Sin código adjunto'}
                            </span>
                            {req.reason && (
                              <span className="text-slate-500 italic">
                                Motivo: {req.reason}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleApproveAdminRequest(req)}
                              className="px-4 py-2 bg-[#A3073B] hover:bg-[#870530] text-white font-bold text-xs rounded-xl shadow-xs transition"
                            >
                              Aprobar y Confirmar Cupo
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingApt(req);
                                setRejectReason('');
                                setRejectError(null);
                              }}
                              className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-semibold text-xs rounded-xl transition"
                            >
                              Rechazar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GESTIÓN DE PROFESIONALES DE SALUD */}
            {adminActiveTab === 'professionals' && (
              <div className="bg-white rounded-3xl p-7 lg:p-9 shadow-soft-card border border-slate-100 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#A3073B]">
                      Cuerpo Asistencial
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                      Directorio de Profesionales Médicos
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Habilita o suspende la atención médica de los doctores y registra nuevos profesionales en la red.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateDoctorModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#A3073B] hover:bg-[#870530] text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Registrar Nuevo Médico</span>
                  </button>
                </div>

                {/* Filtros de Búsqueda de Profesionales */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o tarjeta profesional..."
                      value={adminDoctorSearch}
                      onChange={(e) => setAdminDoctorSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#A3073B] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <CustomSelect
                      value={adminDoctorFilterSede}
                      onChange={(val) => setAdminDoctorFilterSede(val === 'all' ? 'all' : Number(val))}
                      placeholder="Todas las Sedes"
                      options={[
                        { value: 'all', label: 'Todas las Sedes' },
                        ...locations.map((loc) => ({ value: loc.id, label: loc.name })),
                      ]}
                    />
                  </div>

                  <div>
                    <CustomSelect
                      value={adminDoctorFilterSpecialty}
                      onChange={(val) => setAdminDoctorFilterSpecialty(val === 'all' ? 'all' : Number(val))}
                      placeholder="Todas las Especialidades"
                      options={[
                        { value: 'all', label: 'Todas las Especialidades' },
                        ...specialties.map((spec) => ({ value: spec.id, label: spec.name })),
                      ]}
                    />
                  </div>
                </div>

                {/* Listado de Médicos */}
                {(() => {
                  const filteredDoctors = professionals.filter((doc) => {
                    const q = adminDoctorSearch.trim().toLowerCase();
                    const matchesSearch =
                      !q ||
                      doc.name.toLowerCase().includes(q) ||
                      (doc.licenseNumber && doc.licenseNumber.toLowerCase().includes(q)) ||
                      (doc.professionalCode && doc.professionalCode.toLowerCase().includes(q));

                    const matchesSede =
                      adminDoctorFilterSede === 'all' ||
                      (doc.locationIds && doc.locationIds.includes(Number(adminDoctorFilterSede)));

                    const matchesSpecialty =
                      adminDoctorFilterSpecialty === 'all' ||
                      (doc.specialtyIds && doc.specialtyIds.includes(Number(adminDoctorFilterSpecialty)));

                    return matchesSearch && matchesSede && matchesSpecialty;
                  });

                  if (filteredDoctors.length === 0) {
                    return (
                      <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                        <p className="text-xs font-bold text-slate-700">No se encontraron profesionales</p>
                        <p className="text-[11px] text-slate-400">
                          Ajusta los términos de búsqueda o los filtros de sede y especialidad.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredDoctors.map((doc) => {
                        const isDoctorActive = doc.active !== false;
                        const isToggling = togglingDoctorId === doc.id;

                        // Extraer iniciales limpias
                        const cleanName = cleanProfessionalName(doc.name);
                        const initials = cleanName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase();

                        return (
                          <div
                            key={doc.id}
                            className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
                              isDoctorActive
                                ? 'border-slate-200 bg-white hover:border-[#A3073B]/40 hover:shadow-soft-card'
                                : 'border-slate-200 bg-slate-50/70 opacity-75'
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Cabecera del Doctor */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs ${
                                      isDoctorActive
                                        ? 'bg-[#FDF2F4] text-[#A3073B] border border-wine-100'
                                        : 'bg-slate-200 text-slate-500'
                                    }`}
                                  >
                                    {initials || 'MD'}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                      {cleanName}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                      <span className="text-[11px] font-mono text-slate-500 font-medium">
                                        RM: {doc.licenseNumber || 'Sin registro'}
                                      </span>
                                      <span className="text-slate-300">•</span>
                                      <span className="text-[11px] font-mono text-slate-400">
                                        {doc.professionalCode}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                    isDoctorActive
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-200 text-slate-600 border border-slate-300'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isDoctorActive ? 'bg-emerald-500' : 'bg-slate-400'
                                    }`}
                                  />
                                  {isDoctorActive ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>

                              {/* Especialidades */}
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Especialidades
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {doc.specialtyIds?.map((sid) => {
                                    const spec = specialties.find((s) => s.id === sid);
                                    return (
                                      <span
                                        key={sid}
                                        className="px-2 py-0.5 text-[10px] font-semibold bg-wine-50 text-[#870530] rounded-md border border-wine-100"
                                      >
                                        {spec?.name || `Especialidad #${sid}`}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Sedes Asignadas */}
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Sedes Habilitadas
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {doc.locationIds?.map((lid) => {
                                    const loc = locations.find((l) => l.id === lid);
                                    return (
                                      <span
                                        key={lid}
                                        className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200"
                                      >
                                        {loc?.name || `Sede #${lid}`}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Barra de Acciones del Profesional */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[11px] text-slate-400">
                                {isDoctorActive ? 'Habilitado para citas' : 'Atención deshabilitada'}
                              </span>
                              <button
                                type="button"
                                disabled={isToggling}
                                onClick={() => handleToggleDoctorStatus(doc)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition duration-150 disabled:opacity-50 ${
                                  isDoctorActive
                                    ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700 border border-slate-200'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                              >
                                {isToggling ? (
                                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Power className="w-3.5 h-3.5" />
                                )}
                                <span>{isDoctorActive ? 'Desactivar' : 'Activar Médico'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB 3: CATÁLOGOS MAESTROS Y SEDES */}
            {adminActiveTab === 'catalogs' && (
              <div className="space-y-6">
                {/* Sección 1: Sedes Institucionales */}
                <div className="bg-white rounded-3xl p-7 shadow-soft-card border border-slate-100 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-wine-50 text-[#A3073B] flex items-center justify-center border border-wine-100">
                        <Building2 className="w-5 h-5 text-[#A3073B]" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Sedes de Atención Médica</h3>
                        <p className="text-xs text-slate-500">Puntos de atención habilitados para consulta presencial</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreateLocationModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#A3073B] hover:bg-[#870530] text-white font-bold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar Sede</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {locations.map((loc) => {
                      const occ = locationsOccupancy.find((o) => o.locationId === loc.id);
                      const isLocActive = loc.active !== false;
                      const isToggling = togglingLocationId === loc.id;
                      return (
                        <div
                          key={loc.id}
                          className={`p-4 rounded-2xl border transition space-y-3 flex flex-col justify-between ${
                            isLocActive
                              ? 'border-slate-200 bg-white hover:border-[#A3073B]/40 hover:shadow-soft-card'
                              : 'border-slate-200 bg-slate-50/70 opacity-75'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-xs font-bold text-slate-900 block leading-snug">{loc.name}</span>
                                <span className="text-[10px] font-mono text-slate-400">{loc.code}</span>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                  isLocActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-200 text-slate-600 border border-slate-300'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isLocActive ? 'bg-emerald-500' : 'bg-slate-400'
                                  }`}
                                />
                                {isLocActive ? 'Habilitada' : 'Inhabilitada'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500">{loc.address}</p>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                              <span>Ciudad: {loc.city}</span>
                              {occ && (
                                <span className="font-bold text-[#A3073B]">
                                  {occ.occupancyPercentMonth}% Ocupación
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              {isLocActive ? 'Visible para citas' : 'Oculta en agendamiento'}
                            </span>
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleToggleLocationStatus(loc)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition duration-150 disabled:opacity-50 ${
                                isLocActive
                                  ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700 border border-slate-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {isToggling ? (
                                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Power className="w-3.5 h-3.5" />
                              )}
                              <span>{isLocActive ? 'Inhabilitar Sede' : 'Habilitar Sede'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sección 2: Especialidades Médicas */}
                <div className="bg-white rounded-3xl p-7 shadow-soft-card border border-slate-100 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-wine-50 text-[#A3073B] flex items-center justify-center border border-wine-100">
                        <Stethoscope className="w-5 h-5 text-[#A3073B]" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Portafolio de Especialidades Médicas</h3>
                        <p className="text-xs text-slate-500">
                          Duración de consulta y requisitos de autorización administrativa
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreateSpecialtyModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#A3073B] hover:bg-[#870530] text-white font-bold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar Especialidad</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {specialties.map((spec) => {
                      const isSpecActive = spec.active !== false;
                      const isToggling = togglingSpecialtyId === spec.id;
                      return (
                        <div
                          key={spec.id}
                          className={`p-3.5 rounded-2xl border transition space-y-2.5 flex flex-col justify-between ${
                            isSpecActive
                              ? 'border-slate-200 bg-white hover:shadow-xs'
                              : 'border-slate-200 bg-slate-50/70 opacity-75'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <span className="text-xs font-bold text-slate-900 leading-snug block">{spec.name}</span>
                                <span className="text-[10px] font-mono text-slate-400">{spec.code}</span>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                                  isSpecActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-200 text-slate-600 border border-slate-300'
                                }`}
                              >
                                {isSpecActive ? 'Habilitada' : 'Inhabilitada'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {spec.durationMinutes} min
                              </span>
                              {spec.requiresAdminApproval ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Requiere Autorización EPS
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Agendamiento Directo
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              {isSpecActive ? 'En catálogo' : 'Suspendida'}
                            </span>
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleToggleSpecialtyStatus(spec)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition disabled:opacity-50 ${
                                isSpecActive
                                  ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700 border border-slate-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {isToggling ? (
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Power className="w-3 h-3" />
                              )}
                              <span>{isSpecActive ? 'Inhabilitar' : 'Habilitar'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sección 3: Aseguradoras EPS Vinculadas */}
                <div className="bg-white rounded-3xl p-7 shadow-soft-card border border-slate-100 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-wine-50 text-[#A3073B] flex items-center justify-center border border-wine-100">
                        <ShieldCheck className="w-5 h-5 text-[#A3073B]" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Aseguradoras EPS con Convenio</h3>
                        <p className="text-xs text-slate-500">
                          Entidades habilitadas para validación de afiliación y soporte de autorización
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreateEpsModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#A3073B] hover:bg-[#870530] text-white font-bold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar EPS</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {epsList.map((eps) => {
                      const isEpsActive = eps.active !== false;
                      const isToggling = togglingEpsId === eps.id;
                      return (
                        <div
                          key={eps.id}
                          className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                            isEpsActive
                              ? 'border-slate-200 bg-slate-50/40 hover:bg-white'
                              : 'border-slate-200 bg-slate-100/60 opacity-70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">{eps.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">{eps.code}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                                isEpsActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-200 text-slate-600 border border-slate-300'
                              }`}
                            >
                              {isEpsActive ? 'Convenio Activo' : 'Suspendido'}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              {isEpsActive ? 'Afiliaciones aceptadas' : 'Convenio pausado'}
                            </span>
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleToggleEpsStatus(eps)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition disabled:opacity-50 ${
                                isEpsActive
                                  ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700 border border-slate-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {isToggling ? (
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Power className="w-3 h-3" />
                              )}
                              <span>{isEpsActive ? 'Desactivar' : 'Activar'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      </div>

      {/* ==================== TOAST NOTIFICACIÓN GLOBAL ==================== */}
      {actionSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold">{actionSuccessToast}</span>
            <button
              type="button"
              onClick={() => setActionSuccessToast(null)}
              className="text-slate-400 hover:text-white text-xs ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL MÉDICO: FINALIZAR ATENCIÓN ==================== */}
      {completingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A3073B]">
                  Cierre de Consulta Médica
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  Finalizar Atención del Paciente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCompletingApt(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
              <p className="font-bold text-slate-900">{completingApt.patientName}</p>
              <p className="text-slate-500">
                {completingApt.patientDocumentType} {completingApt.patientDocumentNumber} • {completingApt.epsName}
              </p>
              <p className="text-[#A3073B] font-semibold">{completingApt.specialtyName}</p>
            </div>

            <form onSubmit={handleCompleteAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Indicaciones u observaciones de egreso
                </label>
                <textarea
                  rows={3}
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="Ej: Paciente asiste a control. Se prescribe manejo farmacológico y se ordena laboratorio de control en 3 meses."
                  className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#A3073B] focus:ring-1 focus:ring-[#A3073B]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingApt(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingComplete}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#A3073B] hover:bg-[#870530] shadow-sm transition disabled:opacity-50"
                >
                  {isSubmittingComplete ? 'Guardando...' : 'Confirmar y Cerrar Consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL ADMIN: RECHAZAR SOLICITUD ==================== */}
      {rejectingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">
                  Rechazo de Solicitud
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  Rechazar Autorización Médica
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingApt(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-100 text-xs space-y-1">
              <p className="font-bold text-slate-900">{rejectingApt.patientName}</p>
              <p className="text-slate-500">
                {rejectingApt.patientDocument} • {rejectingApt.epsName}
              </p>
              <p className="text-rose-700 font-semibold">{rejectingApt.specialtyName}</p>
              <p className="text-[11px] text-slate-500 pt-1">
                Al rechazar la solicitud, el cupo quedará liberado automáticamente para otros pacientes.
              </p>
            </div>

            <form onSubmit={handleRejectAdminRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Motivo obligatorio del rechazo *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (rejectError) setRejectError(null);
                  }}
                  placeholder="Ej: Orden médica vencida / Falta código de autorización emitido por la EPS."
                  className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/20"
                />
                {rejectError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1.5">
                    {rejectError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingApt(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReject}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition disabled:opacity-50"
                >
                  {isSubmittingReject ? 'Procesando...' : 'Confirmar Rechazo y Liberar Cupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver todas las citas pendientes del paciente */}
      <PendingAppointmentsModal
        key={pendingModalFilter}
        isOpen={isAllPendingModalOpen}
        onClose={() => setIsAllPendingModalOpen(false)}
        appointments={appointments}
        onOpenDetail={onOpenDetail}
        onCancelAppointment={onCancelAppointment}
        initialFilter={pendingModalFilter}
      />

      {/* Modal para editar datos de contacto del paciente */}
      {isEditProfileOpen && (
        <EditProfileModal
          user={user}
          onClose={() => setIsEditProfileOpen(false)}
          onSuccess={(updatedUser) => {
            setIsEditProfileOpen(false);
            onUpdateUser?.(updatedUser);
            setActionSuccessToast('Tus datos de contacto han sido actualizados exitosamente');
          }}
        />
      )}

      {/* Modal para publicar franjas de disponibilidad del profesional */}
      {isCreateBlockModalOpen && (
        <CreateAvailabilityBlockModal
          locations={locations}
          professionalId={1}
          onClose={() => setIsCreateBlockModalOpen(false)}
          onSuccess={(newBlock) => {
            setIsCreateBlockModalOpen(false);
            setActionSuccessToast(
              `Franja horaria publicada para el ${formatDisplayDate(newBlock.availableDate)} (${newBlock.startTime.substring(0, 5)} - ${newBlock.endTime.substring(0, 5)}). Se habilitaron ${newBlock.totalSlots} cupos.`
            );
            loadDoctorBlocks();
          }}
        />
      )}

      {/* Modal para registrar nuevo médico (Admin) */}
      {isCreateDoctorModalOpen && (
        <CreateProfessionalModal
          locations={locations}
          specialties={specialties}
          onClose={() => setIsCreateDoctorModalOpen(false)}
          onSuccess={handleDoctorCreated}
        />
      )}

      {/* Modal para registrar nueva sede (Admin) */}
      {isCreateLocationModalOpen && (
        <CreateLocationModal
          onClose={() => setIsCreateLocationModalOpen(false)}
          onSuccess={handleLocationCreated}
        />
      )}

      {/* Modal para registrar nueva especialidad (Admin) */}
      {isCreateSpecialtyModalOpen && (
        <CreateSpecialtyModal
          onClose={() => setIsCreateSpecialtyModalOpen(false)}
          onSuccess={handleSpecialtyCreated}
        />
      )}

      {/* Modal para registrar nueva EPS (Admin) */}
      {isCreateEpsModalOpen && (
        <CreateEpsModal
          onClose={() => setIsCreateEpsModalOpen(false)}
          onSuccess={handleEpsCreated}
        />
      )}
    </div>
  );
};

