import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PendingAppointmentsModal } from './PendingAppointmentsModal';
import { Appointment } from '../types';

describe('PendingAppointmentsModal - Agenda y Expediente de Citas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAppointments: Appointment[] = [
    {
      id: 'apt-1',
      doctorId: '1',
      doctorName: 'Alejandro Morales',
      doctorSpecialty: 'Medicina General',
      patientId: '1',
      patientName: 'Carlos Méndez',
      date: '2026-10-02',
      time: '08:00 AM',
      scheduledStartAt: '2026-10-02T08:00:00',
      location: 'Sede El Bosque',
      room: 'Cons. 101',
      type: 'presencial',
      status: 'confirmada',
      reason: 'Revisión periódica',
    },
    {
      id: 'apt-2',
      doctorId: '2',
      doctorName: 'María Paula Gómez',
      doctorSpecialty: 'Cardiología Adultos',
      patientId: '1',
      patientName: 'Carlos Méndez',
      date: '2026-10-01',
      time: '10:00 AM',
      scheduledStartAt: '2026-10-01T10:00:00',
      location: 'Sede Norte',
      room: 'Cons. 302',
      type: 'presencial',
      status: 'confirmada',
      reason: 'Control cardiológico',
    },
    {
      id: 'apt-3',
      doctorId: '3',
      doctorName: 'Camilo Torres',
      doctorSpecialty: 'Pediatría',
      patientId: '1',
      patientName: 'Carlos Méndez',
      date: '2026-09-20',
      time: '09:00 AM',
      scheduledStartAt: '2026-09-20T09:00:00',
      location: 'Sede El Bosque',
      type: 'presencial',
      status: 'completada',
      reason: 'Chequeo anterior',
    },
    {
      id: 'apt-4',
      doctorId: '4',
      doctorName: 'Luis Rincón',
      doctorSpecialty: 'Ortopedia y Traumatología',
      patientId: '1',
      patientName: 'Carlos Méndez',
      date: '2026-09-15',
      time: '11:00 AM',
      scheduledStartAt: '2026-09-15T11:00:00',
      location: 'Sede El Bosque',
      type: 'presencial',
      status: 'cancelada',
      reason: 'Inconveniente laboral',
    },
    {
      id: 'apt-5',
      doctorId: '5',
      doctorName: 'Roberto Carrión',
      doctorSpecialty: 'Ortopedia y Traumatología',
      patientId: '1',
      patientName: 'Carlos Méndez',
      date: '2026-09-10',
      time: '09:30 AM',
      scheduledStartAt: '2026-09-10T09:30:00',
      location: 'Sede Norte',
      type: 'presencial',
      status: 'no_asistio',
      reason: 'Control articular',
      notes: 'Inasistencia registrada por el profesional de salud. Cupo liberado.',
    },
  ];

  it('muestra todas las citas organizadas cronológicamente incluyendo cumplidas, canceladas e inasistencias', () => {
    render(
      <PendingAppointmentsModal
        isOpen={true}
        onClose={vi.fn()}
        appointments={mockAppointments}
        onOpenDetail={vi.fn()}
        onCancelAppointment={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /mis citas médicas e historial/i })).toBeInTheDocument();
    expect(screen.getByText(/5 registros en total/i)).toBeInTheDocument();

    // Las citas deben estar presentes
    expect(screen.getByText(/maría paula gómez/i)).toBeInTheDocument();
    expect(screen.getByText(/alejandro morales/i)).toBeInTheDocument();
    expect(screen.getByText(/camilo torres/i)).toBeInTheDocument();
    expect(screen.getByText(/luis rincón/i)).toBeInTheDocument();
    expect(screen.getByText(/roberto carrión/i)).toBeInTheDocument();

    // Badges de estado en tarjeta
    expect(screen.getByText(/^cumplida$/i)).toBeInTheDocument();
    expect(screen.getByText(/^cancelada$/i)).toBeInTheDocument();
    expect(screen.getByText(/^inasistida$/i)).toBeInTheDocument();
  });

  it('permite accionar Reprogramar, Cancelar y Ver Constancia según el estado de la cita', async () => {
    const user = userEvent.setup();
    const mockOnOpenDetail = vi.fn();
    const mockOnCancel = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <PendingAppointmentsModal
        isOpen={true}
        onClose={mockOnClose}
        appointments={mockAppointments}
        onOpenDetail={mockOnOpenDetail}
        onCancelAppointment={mockOnCancel}
      />
    );

    // Reprogramar en cita pendiente
    const reprogramarButtons = screen.getAllByRole('button', { name: /reprogramar/i });
    expect(reprogramarButtons.length).toBe(2);
    await user.click(reprogramarButtons[0]);
    expect(mockOnOpenDetail).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'apt-2' }),
      'reschedule'
    );
    expect(mockOnClose).toHaveBeenCalled();

    // Cancelar cita pendiente
    const cancelarButtons = screen.getAllByRole('button', { name: /cancelar cita/i });
    await user.click(cancelarButtons[1]);
    expect(mockOnCancel).toHaveBeenCalledWith('apt-1');

    // Ver constancia en cita cumplida
    const constanciaButton = screen.getByRole('button', { name: /ver constancia e indicaciones/i });
    await user.click(constanciaButton);
    expect(mockOnOpenDetail).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'apt-3' }),
      'detail'
    );
  });

  it('filtra por pestañas (Todas, Próximas, Cumplidas, Canceladas, Inasistencias)', async () => {
    const user = userEvent.setup();
    const mockOnOpenDetail = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <PendingAppointmentsModal
        isOpen={true}
        onClose={mockOnClose}
        appointments={mockAppointments}
        onOpenDetail={mockOnOpenDetail}
        onCancelAppointment={vi.fn()}
      />
    );

    // Filtrar inasistencias
    const inasistenciasTab = screen.getByRole('button', { name: /inasistencias \(1\)/i });
    await user.click(inasistenciasTab);

    expect(screen.getByText(/roberto carrión/i)).toBeInTheDocument();
    expect(screen.getByText(/inasistida/i)).toBeInTheDocument();
    expect(screen.getByText(/inasistencia registrada por el profesional • consulta no asistida/i)).toBeInTheDocument();
    expect(screen.queryByText(/maría paula gómez/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/camilo torres/i)).not.toBeInTheDocument();

    // Botón de agendar de nuevo para inasistencia
    const agendarDeNuevoBtn = screen.getByRole('button', { name: /agendar de nuevo/i });
    await user.click(agendarDeNuevoBtn);
    expect(mockOnOpenDetail).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'apt-5' }),
      'reschedule'
    );
    expect(mockOnClose).toHaveBeenCalled();
  });
});
