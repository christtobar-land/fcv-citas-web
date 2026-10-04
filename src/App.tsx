import React, { useState, useEffect } from 'react';
import { ScreenType, User, Appointment, AppointmentStatus } from './types';
import { INITIAL_APPOINTMENTS } from './data/mockData';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { BookAppointmentModal } from './components/BookAppointmentModal';
import { AppointmentDetailModal } from './components/AppointmentDetailModal';
import { AppointmentHistoryModal } from './components/AppointmentHistoryModal';
import { RescheduleAppointmentModal } from './components/RescheduleAppointmentModal';
import { CancelAppointmentModal } from './components/CancelAppointmentModal';
import { CheckCircle2 } from 'lucide-react';
import { logout, restoreSession } from './auth/authApi';
import { fetchUserProfile } from './services/userApi';
import {
  fetchMyAppointments,
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
  type AppointmentItem,
} from './services/appointmentApi';

function mapApiToUi(item: AppointmentItem, userName: string): Appointment {
  const [datePart, timePart] = item.scheduledStartAt.split('T');
  const [hours, minutes] = (timePart || '08:00').split(':');
  const hNum = parseInt(hours, 10);
  const ampm = hNum >= 12 ? 'PM' : 'AM';
  const h12 = hNum % 12 || 12;
  const timeFormatted = `${String(h12).padStart(2, '0')}:${minutes} ${ampm}`;

  let uiStatus: AppointmentStatus = 'confirmada';
  if (item.statusCode === 'APPROVED') uiStatus = 'confirmada';
  else if (item.statusCode === 'REQUESTED') uiStatus = 'pendiente';
  else if (item.statusCode === 'CANCELLED') uiStatus = 'cancelada';
  else if (item.statusCode === 'REJECTED') uiStatus = 'rechazada';
  else if (item.statusCode === 'COMPLETED') uiStatus = 'completada';
  else if (item.statusCode === 'NO_SHOW') uiStatus = 'no_asistio';

  return {
    id: String(item.id),
    doctorId: String(item.professionalId),
    doctorName: item.professionalName,
    doctorSpecialty: item.specialtyName,
    doctorAvatar: undefined,
    patientId: 'usr-current',
    patientName: userName,
    patientDocument: 'CC 92.000.100',
    date: datePart,
    time: timeFormatted,
    location: item.locationName,
    room: 'Consultorio 204',
    type: 'presencial',
    status: uiStatus,
    reason: item.reason || `Consulta de ${item.specialtyName}`,
    notes: item.statusCode === 'NO_SHOW'
      ? 'Inasistencia registrada por el profesional de salud. Consulta cerrada sin asistencia del paciente.'
      : item.statusCode === 'APPROVED'
      ? 'Confirmada automáticamente. Asistir con 15 minutos de antelación.'
      : item.statusCode === 'COMPLETED'
      ? 'Atención médica completada con registro clínico digital.'
      : item.statusCode === 'REJECTED'
      ? 'Solicitud no autorizada por EPS. Requiere orden médica vigente.'
      : 'En validación EPS. Se verificará orden médica.',
    locationId: item.locationId,
    specialtyId: item.specialtyId,
    professionalId: item.professionalId,
    scheduledStartAt: item.scheduledStartAt,
  };
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('portal_citas_appointments');
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [rescheduleAppointmentData, setRescheduleAppointmentData] = useState<Appointment | null>(null);
  const [cancelAppointmentData, setCancelAppointmentData] = useState<Appointment | null>(null);
  const [detailAppointmentData, setDetailAppointmentData] = useState<Appointment | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('portal_citas_appointments', JSON.stringify(appointments));
  }, [appointments]);

  const loadLiveAppointments = async (user: User) => {
    try {
      const apiAppts = await fetchMyAppointments();
      if (Array.isArray(apiAppts)) {
        const mapped = apiAppts.map((a) => mapApiToUi(a, user.name));
        setAppointments(mapped);
      }
    } catch (err) {
      console.warn('Usando citas en caché local:', err);
    }
  };

  const syncUserProfile = async () => {
    try {
      const profile = await fetchUserProfile();
      if (profile) {
        setCurrentUser((prev) => {
          if (!prev) return prev;
          const updated: User = {
            ...prev,
            name: profile.fullName || prev.name,
            email: profile.email || prev.email,
            phone: profile.phone || prev.phone,
            documentType: profile.documentType || prev.documentType,
            documentNumber: profile.documentNumber || prev.documentNumber,
            insuranceName: profile.affiliation?.epsName || prev.insuranceName,
            insuranceId: profile.affiliation?.membershipNumber || prev.insuranceId,
          };
          const saved = localStorage.getItem('portal_citas_user') || sessionStorage.getItem('portal_citas_user');
          if (saved) {
            const storage = localStorage.getItem('portal_citas_user') ? localStorage : sessionStorage;
            storage.setItem('portal_citas_user', JSON.stringify(updated));
          }
          return updated;
        });
      }
    } catch {
      // Usar datos locales si el backend no responde o en pruebas offline
    }
  };

  useEffect(() => {
    let active = true;
    restoreSession().then((user) => {
      if (!active) return;
      if (user) {
        setCurrentUser(user);
        setCurrentScreen('dashboard');
        loadLiveAppointments(user);
        syncUserProfile();
      } else {
        setCurrentUser(null);
        setCurrentScreen('login');
      }
      setIsRestoringSession(false);
    });
    return () => { active = false; };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentScreen('dashboard');
    loadLiveAppointments(user);
    syncUserProfile();
    showToast(`¡Bienvenido/a de nuevo a MediHealth, ${user.name}!`);
  };

  const handleRegisterSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentScreen('dashboard');
    loadLiveAppointments(user);
    syncUserProfile();
    showToast(`¡Cuenta creada exitosamente! Bienvenido, ${user.name}.`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setCurrentScreen('login');
      showToast('Has cerrado sesión correctamente.');
    } catch {
      setCurrentUser(null);
      setCurrentScreen('login');
      showToast('Sesión cerrada.');
    }
  };

  const handleBookAppointment = async (newApt: Appointment) => {
    try {
      const locationId = newApt.locationId || (newApt.location.includes('Norte') ? 2 : 1);
      const specialtyId = newApt.specialtyId || 1;
      const professionalId = newApt.professionalId ?? (parseInt(newApt.doctorId.replace(/\D/g, ''), 10) || 1);

      let isoDateTime = newApt.scheduledStartAt;
      if (!isoDateTime) {
        let hour = parseInt(newApt.time.substring(0, 2), 10);
        const isPm = newApt.time.toUpperCase().includes('PM');
        if (isPm && hour < 12) hour += 12;
        if (!isPm && hour === 12) hour = 0;
        const min = newApt.time.substring(3, 5);
        isoDateTime = `${newApt.date}T${String(hour).padStart(2, '0')}:${min}:00`;
      }

      const apiRes = await bookAppointment({
        locationId,
        specialtyId,
        professionalId,
        scheduledStartAt: isoDateTime,
        reason: newApt.reason,
        referralCode: newApt.referralCode,
      });

      const mapped = mapApiToUi(apiRes, currentUser?.name ?? newApt.patientName);
      setAppointments((prev) => [mapped, ...prev.filter((p) => p.id !== mapped.id)]);
      showToast(`¡Cita agendada con éxito para el ${mapped.date} a las ${mapped.time}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al agendar cita';
      console.error('Fallo reserva en backend:', msg);
      showToast(`No fue posible agendar la cita: ${msg}`);
    }
  };

  const handleCancelAppointment = async (id: string, reason?: string) => {
    try {
      const numId = parseInt(id.replace(/\D/g, ''), 10);
      if (!isNaN(numId) && numId > 0) {
        await cancelAppointment(numId, reason);
      }
    } catch (err) {
      console.warn('Cancelación API en segundo plano:', err);
    }
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: 'cancelada' } : apt))
    );
    showToast('Cita médica cancelada. El cupo ha sido liberado.');
  };

  const handleRescheduleAppointment = async (
    id: string,
    newDate: string,
    newTime: string,
    reason?: string,
    isoDateTimeParam?: string,
    professionalId?: number
  ) => {
    try {
      const numId = parseInt(id.replace(/\D/g, ''), 10);
      if (!isNaN(numId) && numId > 0) {
        let isoDateTime = isoDateTimeParam;
        if (!isoDateTime) {
          let hour = parseInt(newTime.substring(0, 2), 10);
          const isPm = newTime.toUpperCase().includes('PM');
          if (isPm && hour < 12) hour += 12;
          if (!isPm && hour === 12) hour = 0;
          const min = newTime.substring(3, 5);
          isoDateTime = `${newDate}T${String(hour).padStart(2, '0')}:${min}:00`;
        }

        const updated = await rescheduleAppointment(numId, isoDateTime, reason, professionalId);
        const mapped = mapApiToUi(updated, currentUser?.name ?? 'Usuario');
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === id ? mapped : apt))
        );
        showToast(`¡Cita reprogramada con éxito para el ${mapped.date} a las ${mapped.time}!`);
        return;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reprogramar cita';
      console.error('Fallo reprogramación API:', msg);
      showToast(`No fue posible reprogramar la cita: ${msg}`);
      throw err;
    }
  };

  const handleUpdateAppointmentStatus = (id: string, newStatus: AppointmentStatus, notes?: string) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id
          ? {
              ...apt,
              status: newStatus,
              notes: notes || apt.notes,
            }
          : apt
      )
    );
  };

  const handleRefreshMyAppointments = () => {
    if (currentUser) {
      loadLiveAppointments(currentUser);
    }
  };

  if (isRestoringSession) {
    return (
      <main className="min-h-screen bg-[#F6F7FB] flex items-center justify-center font-sans" aria-live="polite">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 bg-white px-6 py-4 rounded-2xl shadow-soft-card border border-slate-100">
          <span className="w-5 h-5 border-2 border-[#A3073B] border-t-transparent rounded-full animate-spin" />
          Conectando con MediHealth Plus...
        </div>
      </main>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#F6F7FB] text-slate-800 flex flex-col items-center justify-start font-sans selection:bg-[#FDF2F4] selection:text-[#A3073B] ${
        currentScreen === 'login' || currentScreen === 'dashboard' ? 'p-0' : 'p-3 sm:p-6 md:p-8'
      }`}
      id="portal-citas-app-root"
    >
      {/* Toast notification banner */}
      {toastMessage && (
        <div
          id="portal-toast"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs sm:text-sm font-bold animate-bounce"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Render */}
      {currentScreen === 'login' && (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onNavigateRegister={() => setCurrentScreen('register')}
        />
      )}

      {currentScreen === 'register' && (
        <RegisterScreen
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateLogin={() => setCurrentScreen('login')}
        />
      )}

      {currentScreen === 'dashboard' && currentUser && (
        <DashboardScreen
          user={currentUser}
          appointments={appointments}
          onOpenBooking={() => setIsBookingOpen(true)}
          onOpenDetail={(apt, mode = 'detail') => {
            if (mode === 'reschedule') {
              setRescheduleAppointmentData(apt);
            } else {
              setDetailAppointmentData(apt);
            }
          }}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onDirectBook={handleBookAppointment}
          onCancelAppointment={(id) => {
            const apt = appointments.find((a) => a.id === id);
            if (apt) {
              setCancelAppointmentData(apt);
            } else {
              handleCancelAppointment(id);
            }
          }}
          onLogout={handleLogout}
          onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
          onRefreshMyAppointments={handleRefreshMyAppointments}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            showToast('Tus datos de contacto han sido actualizados.');
          }}
        />
      )}

      {/* Booking Quick Modal */}
      <BookAppointmentModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onAppointmentBooked={handleBookAppointment}
        patientName={currentUser?.name ?? ''}
        patientId={currentUser?.id ?? ''}
        existingAppointments={appointments}
      />

      {/* Reschedule Dedicated Modal */}
      <RescheduleAppointmentModal
        isOpen={Boolean(rescheduleAppointmentData)}
        appointment={rescheduleAppointmentData}
        existingAppointments={appointments}
        onClose={() => setRescheduleAppointmentData(null)}
        onRescheduleAppointment={handleRescheduleAppointment}
      />

      {/* Cancel Confirmation Dedicated Modal */}
      <CancelAppointmentModal
        isOpen={Boolean(cancelAppointmentData)}
        appointment={cancelAppointmentData}
        onClose={() => setCancelAppointmentData(null)}
        onConfirmCancel={handleCancelAppointment}
      />

      {/* Past History Record Detail & Proof Modal */}
      <AppointmentDetailModal
        isOpen={Boolean(detailAppointmentData)}
        appointment={detailAppointmentData}
        onClose={() => setDetailAppointmentData(null)}
        onOpenReschedule={(apt) => {
          setDetailAppointmentData(null);
          setRescheduleAppointmentData(apt);
        }}
      />

      {/* Past History Modal */}
      <AppointmentHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        appointments={appointments}
        onSelectAppointment={(apt) => {
          setDetailAppointmentData(apt);
        }}
      />

    </div>
  );
}
