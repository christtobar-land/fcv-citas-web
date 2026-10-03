import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RescheduleAppointmentModal } from './RescheduleAppointmentModal';
import { Appointment } from '../types';
import * as appointmentApi from '../services/appointmentApi';

vi.mock('../services/appointmentApi', async (original) => {
  const actual = await original<typeof import('../services/appointmentApi')>();
  return {
    ...actual,
    fetchAvailableSlots: vi.fn(),
  };
});

describe('RescheduleAppointmentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAppointment: Appointment = {
    id: '6',
    doctorId: '3',
    doctorName: 'Dr(a). Alejandro Morales',
    doctorSpecialty: 'Medicina General',
    patientId: '1',
    patientName: 'Carlos Méndez',
    date: '2026-10-01',
    time: '11:30 AM',
    location: 'Sede El Bosque (Principal)',
    room: 'Consultorio 204',
    type: 'presencial',
    status: 'confirmada',
    reason: 'Control semestral de cardiología',
    locationId: 1,
    specialtyId: 1,
    professionalId: 3,
    scheduledStartAt: '2026-10-01T11:30:00',
  };

  it('muestra título claro del modal y datos del especialista sin prefijo Dr(a). y con horario actual a la derecha', () => {
    vi.mocked(appointmentApi.fetchAvailableSlots).mockResolvedValue([]);

    render(
      <RescheduleAppointmentModal
        isOpen={true}
        appointment={mockAppointment}
        onClose={vi.fn()}
        onRescheduleAppointment={vi.fn()}
      />
    );

    // Título explícito del modal
    expect(screen.getByRole('heading', { name: /reprogramar cita médica/i })).toBeInTheDocument();

    // Nombre del especialista sin Dr(a).
    expect(screen.getByRole('heading', { level: 3, name: /especialista alejandro morales/i })).toBeInTheDocument();
    expect(screen.getAllByText(/medicina general/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/sede el bosque \(principal\)/i)).toBeInTheDocument();

    // Detalle del horario actual alineado a la derecha
    expect(screen.getByText(/horario actual:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/1 OCT 2026/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/11:30 AM/i)).toBeInTheDocument();
    expect(screen.getByText(/cita por reprogramar/i)).toBeInTheDocument();
  });

  it('permite cambiar de sede de atención dinámicamente', async () => {
    const user = userEvent.setup();
    vi.mocked(appointmentApi.fetchAvailableSlots).mockResolvedValue([]);

    render(
      <RescheduleAppointmentModal
        isOpen={true}
        appointment={mockAppointment}
        onClose={vi.fn()}
        onRescheduleAppointment={vi.fn()}
      />
    );

    // Consulta inicial en Sede El Bosque (locationId: 1)
    expect(appointmentApi.fetchAvailableSlots).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: 1,
        specialtyId: 1,
      })
    );

    // Cambia a Sede Norte
    const sedeNorteBtn = screen.getByRole('button', { name: /sede norte/i });
    await user.click(sedeNorteBtn);

    // Consulta en Sede Norte (locationId: 2)
    expect(appointmentApi.fetchAvailableSlots).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: 2,
        specialtyId: 1,
      })
    );
  });

  it('permite alternar entre el mismo especialista y cualquier especialista disponible dentro de la especialidad', async () => {
    const user = userEvent.setup();
    vi.mocked(appointmentApi.fetchAvailableSlots).mockResolvedValue([
      {
        slotId: 101,
        professionalId: 4,
        professionalName: 'Dr(a). Valentina Gómez',
        licenseNumber: 'MP-COL-5544',
        locationId: 1,
        locationName: 'Sede El Bosque (Principal)',
        startAt: '2026-10-01T14:00:00',
        endAt: '2026-10-01T14:30:00',
      },
    ]);

    render(
      <RescheduleAppointmentModal
        isOpen={true}
        appointment={mockAppointment}
        onClose={vi.fn()}
        onRescheduleAppointment={vi.fn()}
      />
    );

    // Inicialmente consulta solo con el doctor actual (professionalId: 3)
    expect(appointmentApi.fetchAvailableSlots).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: 1,
        specialtyId: 1,
        professionalId: 3,
        date: '2026-10-01',
      })
    );

    // Hace clic en "Cualquier especialista disponible"
    const allDoctorsBtn = screen.getByRole('button', { name: /cualquier especialista disponible/i });
    await user.click(allDoctorsBtn);

    // Debe volver a consultar sin professionalId para traer todos los cupos dentro de la misma especialidad
    expect(appointmentApi.fetchAvailableSlots).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: 1,
        specialtyId: 1,
        professionalId: undefined,
        date: '2026-10-01',
      })
    );

    // Debe mostrar la franja de la otra especialista en formato 12h (02:00 PM)
    expect(await screen.findByRole('button', { name: /02:00 PM/i })).toBeInTheDocument();
    expect(screen.getByText(/valentina gómez/i)).toBeInTheDocument();
  });

  it('ejecuta la reprogramación con persistencia y nuevo profesional al seleccionar cupo', async () => {
    const user = userEvent.setup();
    const onReschedule = vi.fn();

    vi.mocked(appointmentApi.fetchAvailableSlots).mockResolvedValue([
      {
        slotId: 202,
        professionalId: 4,
        professionalName: 'Dr(a). Valentina Gómez',
        licenseNumber: 'MP-COL-5544',
        locationId: 1,
        locationName: 'Sede El Bosque (Principal)',
        startAt: '2026-10-01T15:00:00',
        endAt: '2026-10-01T15:30:00',
      },
    ]);

    render(
      <RescheduleAppointmentModal
        isOpen={true}
        appointment={mockAppointment}
        onClose={vi.fn()}
        onRescheduleAppointment={onReschedule}
      />
    );

    // Cambia a cualquier especialista
    await user.click(screen.getByRole('button', { name: /cualquier especialista disponible/i }));

    const slotBtn = await screen.findByRole('button', { name: /03:00 PM/i });
    await user.click(slotBtn);

    const submitBtn = screen.getByRole('button', { name: /confirmar reprogramación/i });
    expect(submitBtn).not.toBeDisabled();
    await user.click(submitBtn);

    expect(onReschedule).toHaveBeenCalledWith(
      '6',
      '2026-10-01',
      '03:00 PM',
      expect.any(String),
      '2026-10-01T15:00:00',
      4
    );
  });
});
