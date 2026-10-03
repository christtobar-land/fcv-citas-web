import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardScreen } from './DashboardScreen';
import * as appointmentApi from '../services/appointmentApi';
import { User, Appointment } from '../types';

describe('Doctor and Admin Views in DashboardScreen (RF-16, RF-17, RF-18)', () => {
  const mockDoctorUser: User = {
    id: '10',
    name: 'Alejandro Morales',
    email: 'alejandro.morales@medihealth.invalid',
    roles: ['PROFESSIONAL'],
    documentType: 'CC',
    documentNumber: '910000010',
  };

  const mockAdminUser: User = {
    id: '99',
    name: 'Coordinación Médica',
    email: 'admin@medihealth.invalid',
    roles: ['ADMIN'],
    documentType: 'CC',
    documentNumber: '80000001',
  };

  const mockAppointments: Appointment[] = [];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(appointmentApi, 'fetchLocations').mockResolvedValue([]);
    vi.spyOn(appointmentApi, 'fetchSpecialties').mockResolvedValue([]);
    vi.spyOn(appointmentApi, 'fetchProfessionals').mockResolvedValue([]);
    vi.spyOn(appointmentApi, 'fetchProfessionalBlocks').mockResolvedValue([]);
    vi.spyOn(appointmentApi, 'fetchAdminLocationsOccupancy').mockResolvedValue([
      {
        locationId: 1,
        locationName: 'Sede El Bosque',
        locationAddress: 'Calle 155A No. 23-58',
        totalSlotsMonth: 1488,
        bookedSlotsMonth: 0,
        occupancyPercentMonth: 0,
        totalSlotsToday: 48,
        bookedSlotsToday: 0,
        occupancyPercentToday: 0,
        activeProfessionalsCount: 6,
        pendingApprovalCount: 0,
      },
      {
        locationId: 2,
        locationName: 'Sede Norte',
        locationAddress: 'Autopista Floridablanca Km 5',
        totalSlotsMonth: 1488,
        bookedSlotsMonth: 0,
        occupancyPercentMonth: 0,
        totalSlotsToday: 48,
        bookedSlotsToday: 0,
        occupancyPercentToday: 0,
        activeProfessionalsCount: 6,
        pendingApprovalCount: 0,
      },
    ]);
    vi.spyOn(appointmentApi, 'fetchMyAffiliation').mockResolvedValue({
      id: 1,
      epsName: 'EPS Salud Total',
      planName: 'Plan Contributivo',
      membershipNumber: 'AF-92000100',
      isCurrent: true,
    });
  });

  const testToday = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');

  it('permite cambiar al rol Médico y visualizar la agenda médica con acciones de egreso (RF-16, RF-17)', async () => {
    const mockAgenda: appointmentApi.ProfessionalAppointmentItem[] = [
      {
        id: 101,
        patientId: 1,
        patientName: 'Mariana Restrepo Gómez',
        patientDocumentType: 'CC',
        patientDocumentNumber: '63450210',
        patientPhone: '3109998877',
        patientEmail: 'mariana@ejemplo.com',
        epsName: 'EPS Sura',
        professionalId: 1,
        professionalName: 'Alejandro Morales',
        locationId: 1,
        locationName: 'Sede El Bosque',
        locationAddress: 'Calle 155A No. 23-58',
        specialtyId: 1,
        specialtyName: 'Medicina General',
        status: 'Confirmada',
        statusCode: 'APPROVED',
        scheduledStartAt: `${testToday}T08:30:00`,
        scheduledEndAt: `${testToday}T09:00:00`,
        durationMinutes: 30,
        reason: 'Control anual',
        isTerminal: false,
      },
    ];

    vi.spyOn(appointmentApi, 'fetchProfessionalAgenda').mockResolvedValue(mockAgenda);
    const completeSpy = vi.spyOn(appointmentApi, 'completeProfessionalAppointment').mockResolvedValue({
      success: true,
      message: 'Atención médica finalizada exitosamente',
    });

    render(
      <DashboardScreen
        user={mockDoctorUser}
        appointments={mockAppointments}
        onOpenBooking={vi.fn()}
        onOpenDetail={vi.fn()}
        onOpenHistory={vi.fn()}
        onDirectBook={vi.fn()}
        onCancelAppointment={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    // Verificar que se llame y renderice la agenda
    await waitFor(() => {
      expect(screen.getByText('Mariana Restrepo Gómez')).toBeInTheDocument();
      expect(screen.getByText(/63450210/)).toBeInTheDocument();
    });

    // Abrir modal de Terminar Atención
    const completeBtn = screen.getByRole('button', { name: /Terminar Atención/i });
    await userEvent.click(completeBtn);

    expect(screen.getByText(/Cierre de Consulta Médica/i)).toBeInTheDocument();

    // Confirmar egreso
    const confirmEgresoBtn = screen.getByRole('button', { name: /Confirmar y Cerrar Consulta/i });
    await userEvent.click(confirmEgresoBtn);

    expect(completeSpy).toHaveBeenCalledWith(101, expect.any(String));
  }, 15000);

  it('permite cambiar al rol Administrador y gestionar solicitudes de autorización (RF-12, RF-18)', async () => {
    const mockRequests: appointmentApi.AdminAppointmentItem[] = [
      {
        id: 202,
        patientId: 2,
        patientName: 'Beatriz Helena Pardo',
        patientDocument: 'CC 37890114',
        patientPhone: '3201112233',
        patientEmail: 'beatriz@ejemplo.com',
        epsName: 'EPS Sura',
        professionalId: 3,
        professionalName: 'Dra. Sofía Valenzuela',
        professionalLicense: 'MP-COL-1012',
        locationId: 1,
        locationName: 'Sede El Bosque',
        locationAddress: 'Calle 155A No. 23-58',
        specialtyId: 2,
        specialtyName: 'Cardiología Adulto',
        status: 'Solicitada / en validación EPS',
        statusCode: 'REQUESTED',
        scheduledStartAt: '2026-10-06T09:30:00',
        scheduledEndAt: '2026-10-06T10:00:00',
        durationMinutes: 30,
        referralCode: 'ORD-44910',
        createdAt: '2026-10-01T10:00:00',
      },
    ];

    vi.spyOn(appointmentApi, 'fetchAdminPendingRequests').mockResolvedValue(mockRequests);
    const approveSpy = vi.spyOn(appointmentApi, 'approveAdminAppointment').mockResolvedValue({
      success: true,
      message: 'Aprobada',
    });

    render(
      <DashboardScreen
        user={mockAdminUser}
        appointments={mockAppointments}
        onOpenBooking={vi.fn()}
        onOpenDetail={vi.fn()}
        onOpenHistory={vi.fn()}
        onDirectBook={vi.fn()}
        onCancelAppointment={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    // Verificar solicitud pendiente en pantalla
    await waitFor(() => {
      expect(screen.getByText(/Beatriz Helena Pardo/)).toBeInTheDocument();
      expect(screen.getByText(/Cardiología Adulto/)).toBeInTheDocument();
    });

    // Aprobar solicitud
    const approveBtn = screen.getByRole('button', { name: /Aprobar y Confirmar Cupo/i });
    await userEvent.click(approveBtn);

    expect(approveSpy).toHaveBeenCalledWith(202);
  });

  it('permite al médico aplicar filtros avanzados por sede, fecha y buscador de paciente (HU-033)', async () => {
    const mockAgenda: appointmentApi.ProfessionalAppointmentItem[] = [
      {
        id: 101,
        patientId: 1,
        patientName: 'Mariana Restrepo Gómez',
        patientDocumentType: 'CC',
        patientDocumentNumber: '63450210',
        patientPhone: '3109998877',
        patientEmail: 'mariana@ejemplo.com',
        epsName: 'EPS Sura',
        professionalId: 1,
        professionalName: 'Alejandro Morales',
        locationId: 1,
        locationName: 'Sede El Bosque',
        locationAddress: 'Calle 155A No. 23-58',
        specialtyId: 1,
        specialtyName: 'Medicina General',
        status: 'Confirmada',
        statusCode: 'APPROVED',
        scheduledStartAt: `${testToday}T08:30:00`,
        scheduledEndAt: `${testToday}T09:00:00`,
        durationMinutes: 30,
        reason: 'Control anual',
        isTerminal: false,
      },
      {
        id: 102,
        patientId: 2,
        patientName: 'Gonzalo Duque Ruiz',
        patientDocumentType: 'CC',
        patientDocumentNumber: '1098223344',
        patientPhone: '3157776655',
        patientEmail: 'gonzalo@ejemplo.com',
        epsName: 'EPS Sanitas',
        professionalId: 1,
        professionalName: 'Alejandro Morales',
        locationId: 2,
        locationName: 'Sede Floridablanca',
        locationAddress: 'Autopista Floridablanca Km 5',
        specialtyId: 1,
        specialtyName: 'Medicina General',
        status: 'Confirmada',
        statusCode: 'APPROVED',
        scheduledStartAt: `${testToday}T10:00:00`,
        scheduledEndAt: `${testToday}T10:30:00`,
        durationMinutes: 30,
        reason: 'Hipertensión',
        isTerminal: false,
      },
    ];

    vi.spyOn(appointmentApi, 'fetchProfessionalAgenda').mockResolvedValue(mockAgenda);
    vi.spyOn(appointmentApi, 'fetchLocations').mockResolvedValue([
      { id: 1, code: 'BOSQUE', name: 'Sede El Bosque', address: 'Calle 155A', city: 'Bucaramanga' },
      { id: 2, code: 'FLORIDA', name: 'Sede Floridablanca', address: 'Autopista', city: 'Floridablanca' },
    ]);

    render(
      <DashboardScreen
        user={mockDoctorUser}
        appointments={mockAppointments}
        onOpenBooking={vi.fn()}
        onOpenDetail={vi.fn()}
        onOpenHistory={vi.fn()}
        onDirectBook={vi.fn()}
        onCancelAppointment={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    // Ambas citas de hoy deben aparecer inicialmente
    await waitFor(() => {
      expect(screen.getByText('Mariana Restrepo Gómez')).toBeInTheDocument();
      expect(screen.getByText('Gonzalo Duque Ruiz')).toBeInTheDocument();
    });

    // 1. Filtrar por Sede El Bosque (id 1)
    const sedeSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(sedeSelect, '1');

    expect(screen.getByText('Mariana Restrepo Gómez')).toBeInTheDocument();
    expect(screen.queryByText('Gonzalo Duque Ruiz')).not.toBeInTheDocument();

    // 2. Filtrar por búsqueda de paciente
    const searchInput = screen.getByPlaceholderText(/buscar paciente/i);
    await userEvent.type(searchInput, '63450210');
    expect(screen.getByText('Mariana Restrepo Gómez')).toBeInTheDocument();

    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'inexistente');
    expect(screen.queryByText('Mariana Restrepo Gómez')).not.toBeInTheDocument();
    expect(screen.getByText(/no se encontraron citas con los filtros seleccionados/i)).toBeInTheDocument();

    // 3. Restablecer filtros
    const resetBtn = screen.getByRole('button', { name: /restablecer filtros/i });
    await userEvent.click(resetBtn);

    expect(screen.getByText('Mariana Restrepo Gómez')).toBeInTheDocument();
    expect(screen.getByText('Gonzalo Duque Ruiz')).toBeInTheDocument();
  });

  it('permite al administrador gestionar profesionales de salud y alternar su estado activo', async () => {
    const mockDoctors: appointmentApi.ProfessionalItem[] = [
      {
        id: 1,
        name: 'Alejandro Morales',
        licenseNumber: 'MP-COL-1010',
        professionalCode: 'MED-001',
        specialtyIds: [1],
        locationIds: [1],
        active: true,
      },
    ];

    vi.spyOn(appointmentApi, 'fetchProfessionals').mockResolvedValue(mockDoctors);
    vi.spyOn(appointmentApi, 'fetchLocations').mockResolvedValue([
      { id: 1, code: 'BOSQUE', name: 'Sede El Bosque', address: 'Calle 155A', city: 'Bucaramanga' },
    ]);
    vi.spyOn(appointmentApi, 'fetchSpecialties').mockResolvedValue([
      { id: 1, code: 'MG', name: 'Medicina General', durationMinutes: 30, isGeneral: true, requiresAdminApproval: false },
    ]);
    const toggleSpy = vi.spyOn(appointmentApi, 'toggleAdminProfessionalStatus').mockResolvedValue({
      success: true,
      active: false,
      message: 'Profesional desactivado exitosamente',
    });

    render(
      <DashboardScreen
        user={mockAdminUser}
        appointments={mockAppointments}
        onOpenBooking={vi.fn()}
        onOpenDetail={vi.fn()}
        onOpenHistory={vi.fn()}
        onDirectBook={vi.fn()}
        onCancelAppointment={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    // Navegar a la pestaña de Profesionales de Salud
    const profTabBtn = screen.getByRole('button', { name: /Profesionales de Salud/i });
    await userEvent.click(profTabBtn);

    // Debe mostrarse el profesional
    await waitFor(() => {
      expect(screen.getByText('Alejandro Morales')).toBeInTheDocument();
      expect(screen.getByText(/MP-COL-1010/)).toBeInTheDocument();
    });

    // Alternar estado a inactivo
    const toggleBtn = screen.getByRole('button', { name: /Desactivar/i });
    await userEvent.click(toggleBtn);

    expect(toggleSpy).toHaveBeenCalledWith(1);

    // Navegar a la pestaña de Catálogos y Sedes
    const catTabBtn = screen.getByRole('button', { name: /Catálogos y Sedes/i });
    await userEvent.click(catTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Sedes de Atención Médica/i)).toBeInTheDocument();
      expect(screen.getByText(/Portafolio de Especialidades Médicas/i)).toBeInTheDocument();
    });
  });
});
