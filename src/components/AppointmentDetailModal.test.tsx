import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentDetailModal } from './AppointmentDetailModal';
import { Appointment } from '../types';

describe('AppointmentDetailModal - Expediente de Cita', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCompletedAppointment: Appointment = {
    id: '12',
    doctorId: '1',
    doctorName: 'Alejandro Morales',
    doctorSpecialty: 'Medicina General',
    doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
    patientId: '1',
    patientName: 'Carlos Méndez',
    date: '2026-10-01',
    time: '11:30 AM',
    location: 'Sede El Bosque (Principal)',
    room: 'Consultorio 204',
    type: 'presencial',
    status: 'completada',
    reason: 'Control médico general',
    prescription: {
      diagnosis: 'Control preventivo satisfactorio',
      medicines: [
        {
          name: 'Loratadina 10mg',
          dose: '1 tableta',
          frequency: 'Cada 24 horas',
          duration: '10 días',
        },
      ],
      notes: 'Seguimiento en 6 meses.',
    },
  };

  it('muestra título del modal y datos del expediente sin campos de Motivo u Observaciones de admisión', () => {
    render(
      <AppointmentDetailModal
        isOpen={true}
        appointment={mockCompletedAppointment}
        onClose={vi.fn()}
      />
    );

    // Título explícito del modal
    expect(screen.getByRole('heading', { name: /detalle de consulta médica/i })).toBeInTheDocument();
    expect(screen.getByText(/alejandro morales/i)).toBeInTheDocument();
    expect(screen.getByText(/medicina general/i)).toBeInTheDocument();

    // Diagnóstico y prescripción
    expect(screen.getByText(/diagnóstico e indicaciones médicas/i)).toBeInTheDocument();
    expect(screen.getByText(/control preventivo satisfactorio/i)).toBeInTheDocument();
    expect(screen.getByText(/loratadina 10mg/i)).toBeInTheDocument();

    // No debe mostrar Motivo de Consulta ni Observaciones de Admisión
    expect(screen.queryByText(/motivo de consulta/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/observaciones de admisión/i)).not.toBeInTheDocument();
  });

  it('permite descargar la constancia de atención médica', async () => {
    const user = userEvent.setup();

    render(
      <AppointmentDetailModal
        isOpen={true}
        appointment={mockCompletedAppointment}
        onClose={vi.fn()}
      />
    );

    const downloadBtn = screen.getByRole('button', { name: /constancia asistencia/i });
    expect(downloadBtn).toBeInTheDocument();
    await user.click(downloadBtn);
  });

  it('muestra la línea de tiempo y trazabilidad inmutable de estados de la cita (HU-032)', async () => {
    const historyData = [
      {
        id: 1,
        appointmentId: 12,
        statusCode: 'REQUESTED',
        statusName: 'En revisión EPS',
        changeSource: 'USER',
        changedByName: 'Carlos Méndez',
        reason: 'Creación inicial de la cita',
        changedAt: '2026-10-01T08:00:00',
      },
      {
        id: 2,
        appointmentId: 12,
        statusCode: 'APPROVED',
        statusName: 'Confirmada',
        changeSource: 'ADMIN',
        changedByName: 'Administración Médica',
        reason: 'Aprobación y confirmación de cupo especializado',
        changedAt: '2026-10-01T09:15:00',
      },
      {
        id: 3,
        appointmentId: 12,
        statusCode: 'COMPLETED',
        statusName: 'Atendida',
        changeSource: 'USER',
        changedByName: 'Alejandro Morales',
        reason: 'Atención médica finalizada con éxito',
        changedAt: '2026-10-01T12:00:00',
      },
    ];

    const fetchSpy = vi.spyOn(await import('../services/appointmentApi'), 'fetchAppointmentHistory')
      .mockResolvedValue(historyData);

    render(
      <AppointmentDetailModal
        isOpen={true}
        appointment={mockCompletedAppointment}
        onClose={vi.fn()}
      />
    );

    // Encabezado de la línea de tiempo
    expect(screen.getByText(/línea de tiempo y auditoría de estados/i)).toBeInTheDocument();
    expect(screen.getByText(/registro inmutable/i)).toBeInTheDocument();

    // Esperar a que se carguen los eventos del historial
    expect(await screen.findByText(/creación inicial de la cita/i)).toBeInTheDocument();
    expect(screen.getByText(/aprobación y confirmación de cupo especializado/i)).toBeInTheDocument();
    expect(screen.getByText(/atención médica finalizada con éxito/i)).toBeInTheDocument();

    // Actores
    expect(screen.getByText('Carlos Méndez')).toBeInTheDocument();
    expect(screen.getByText('Administración Médica')).toBeInTheDocument();
    expect(screen.getAllByText('Alejandro Morales').length).toBeGreaterThanOrEqual(2);

    fetchSpy.mockRestore();
  });
});
