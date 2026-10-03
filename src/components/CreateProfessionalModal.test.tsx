import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateProfessionalModal } from './CreateProfessionalModal';
import * as appointmentApi from '../services/appointmentApi';

describe('CreateProfessionalModal - Registro de Médicos', () => {
  const mockLocations: appointmentApi.LocationItem[] = [
    { id: 1, code: 'ICV', name: 'Sede El Bosque', address: 'Calle 155A', city: 'Floridablanca' },
    { id: 2, code: 'HIC', name: 'Sede Norte', address: 'Km 7 Autopista', city: 'Piedecuesta' },
  ];

  const mockSpecialties: appointmentApi.SpecialtyItem[] = [
    { id: 1, code: 'MG', name: 'Medicina General', durationMinutes: 30, isGeneral: true, requiresAdminApproval: false },
    { id: 2, code: 'CARD', name: 'Cardiología Adulto', durationMinutes: 30, isGeneral: false, requiresAdminApproval: true },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('valida campos obligatorios antes de enviar', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <CreateProfessionalModal
        locations={mockLocations}
        specialties={mockSpecialties}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    // Intentar registrar sin datos
    const submitBtn = screen.getByRole('button', { name: /Registrar Profesional/i });
    await userEvent.click(submitBtn);

    // Debe mostrar error de nombres
    expect(screen.getByText(/El nombre del profesional es obligatorio/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('permite completar el formulario y registra un nuevo profesional exitosamente', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    const mockCreated: appointmentApi.ProfessionalItem = {
      id: 7,
      name: 'Dr(a). Andrés Moreno',
      licenseNumber: 'RM-778899',
      professionalCode: 'MED-007',
      specialtyIds: [1],
      locationIds: [1],
      active: true,
    };

    const createSpy = vi.spyOn(appointmentApi, 'createAdminProfessional').mockResolvedValue(mockCreated);

    render(
      <CreateProfessionalModal
        locations={mockLocations}
        specialties={mockSpecialties}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    // Llenar campos
    fireEvent.change(screen.getByPlaceholderText(/Ej. Carlos Eduardo/i), { target: { value: 'Andrés' } });
    fireEvent.change(screen.getByPlaceholderText(/Ej. Gómez Silva/i), { target: { value: 'Moreno' } });
    fireEvent.change(screen.getByPlaceholderText(/Ej. 1098765432/i), { target: { value: '1098112233' } });
    fireEvent.change(screen.getByPlaceholderText(/doctor@medihealth.com/i), { target: { value: 'andres.moreno@medihealth.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Ej. RM-99482-COL/i), { target: { value: 'RM-778899' } });

    // Seleccionar especialidad Medicina General
    const specBtn = screen.getByRole('button', { name: /Medicina General/i });
    await userEvent.click(specBtn);

    // Seleccionar Sede El Bosque
    const sedeBtn = screen.getByRole('button', { name: /Sede El Bosque/i });
    await userEvent.click(sedeBtn);

    // Enviar
    const submitBtn = screen.getByRole('button', { name: /Registrar Profesional/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Andrés',
          lastName: 'Moreno',
          documentNumber: '1098112233',
          email: 'andres.moreno@medihealth.com',
          licenseNumber: 'RM-778899',
          specialtyIds: [1],
          locationIds: [1],
        })
      );
      expect(onSuccess).toHaveBeenCalledWith(mockCreated);
    });
  }, 15000);
});
