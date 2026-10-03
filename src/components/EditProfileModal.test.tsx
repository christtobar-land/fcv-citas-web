import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditProfileModal } from './EditProfileModal';
import * as userApi from '../services/userApi';
import type { User } from '../types';

vi.mock('../services/userApi');

const mockUser: User = {
  id: '1',
  name: 'Carlos Andrés Méndez',
  email: 'carlos.mendez@ejemplo.com',
  phone: '3001234567',
  documentType: 'CC',
  documentNumber: '92000100',
  insuranceName: 'EPS Sanitas',
  insuranceId: 'AF-COL-92000100',
  roles: ['USER'],
};

describe('EditProfileModal - Edición de Datos de Contacto (RF-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('muestra la información de identidad verificada y los campos de contacto prellenados', () => {
    render(<EditProfileModal user={mockUser} onClose={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByText('Actualizar Datos de Contacto')).toBeInTheDocument();
    expect(screen.getByText('Carlos Andrés Méndez')).toBeInTheDocument();
    expect(screen.getByText(/CC • 92000100/i)).toBeInTheDocument();
    expect(screen.getByText('EPS Sanitas')).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText('ejemplo@correo.com') as HTMLInputElement;
    const phoneInput = screen.getByPlaceholderText('3001234567') as HTMLInputElement;

    expect(emailInput.value).toBe('carlos.mendez@ejemplo.com');
    expect(phoneInput.value).toBe('3001234567');
  });

  it('valida que el teléfono móvil sea de 10 dígitos iniciando con 3 y el correo sea válido', async () => {
    render(<EditProfileModal user={mockUser} onClose={vi.fn()} onSuccess={vi.fn()} />);

    const emailInput = screen.getByPlaceholderText('ejemplo@correo.com');
    const phoneInput = screen.getByPlaceholderText('3001234567');
    const submitBtn = screen.getByRole('button', { name: /Guardar Cambios/i });

    // Ingrese teléfono inválido (menos de 10 dígitos o que no empiece con 3)
    fireEvent.change(phoneInput, { target: { value: '12345' } });
    fireEvent.change(emailInput, { target: { value: 'correo-invalido' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Debe ser un número celular colombiano válido de 10 dígitos/i)).toBeInTheDocument();
    expect(await screen.findByText(/Ingresa un formato de correo electrónico válido/i)).toBeInTheDocument();
  });

  it('envía la actualización al API y ejecuta onSuccess con los datos actualizados', async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    vi.mocked(userApi.updateUserProfile).mockResolvedValueOnce({
      id: 1,
      firstName: 'Carlos Andrés',
      lastName: 'Méndez',
      fullName: 'Carlos Andrés Méndez',
      documentType: 'CC',
      documentNumber: '92000100',
      email: 'carlos.nuevo@ejemplo.com',
      phone: '3109876543',
      roles: ['USER'],
      affiliation: {
        epsId: 1,
        epsName: 'EPS Sanitas',
        planId: 1,
        planName: 'Plan Complementario',
        regimeId: 1,
        regimeName: 'Contributivo',
        membershipNumber: 'AF-COL-92000100',
      },
    });

    render(<EditProfileModal user={mockUser} onClose={handleClose} onSuccess={handleSuccess} />);

    const emailInput = screen.getByPlaceholderText('ejemplo@correo.com');
    const phoneInput = screen.getByPlaceholderText('3001234567');
    const submitBtn = screen.getByRole('button', { name: /Guardar Cambios/i });

    fireEvent.change(emailInput, { target: { value: 'carlos.nuevo@ejemplo.com' } });
    fireEvent.change(phoneInput, { target: { value: '3109876543' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(userApi.updateUserProfile).toHaveBeenCalledWith({
        email: 'carlos.nuevo@ejemplo.com',
        phone: '3109876543',
      });
      expect(handleSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'carlos.nuevo@ejemplo.com',
          phone: '3109876543',
        })
      );
    });
  });

  it('muestra un mensaje de error si el correo ya pertenece a otro usuario registrado', async () => {
    vi.mocked(userApi.updateUserProfile).mockRejectedValueOnce(
      new Error('Email o documento ya registrado')
    );

    render(<EditProfileModal user={mockUser} onClose={vi.fn()} onSuccess={vi.fn()} />);

    const submitBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('El correo electrónico ya se encuentra registrado por otro usuario.')
    ).toBeInTheDocument();
  });
});
