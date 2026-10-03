import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import * as authApi from '../auth/authApi';

vi.mock('../auth/authApi', async () => {
  const actual = await vi.importActual('../auth/authApi');
  return {
    ...actual,
    requestForgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  };
});

describe('ForgotPasswordModal - Recuperación de Contraseña (RF-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <ForgotPasswordModal isOpen={false} onClose={vi.fn()} onSuccessReset={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el formulario inicial para solicitar código de verificación', () => {
    render(
      <ForgotPasswordModal isOpen={true} initialEmail="carlos.mendez@ejemplo.com" onClose={vi.fn()} onSuccessReset={vi.fn()} />
    );

    expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Electrónico/i)).toHaveValue('carlos.mendez@ejemplo.com');
    expect(screen.getByRole('button', { name: /Continuar/i })).toBeInTheDocument();
  });

  it('solicita el código al API y avanza al paso de restablecimiento con el código precargado', async () => {
    vi.mocked(authApi.requestForgotPassword).mockResolvedValueOnce({
      message: 'Código enviado',
      devToken: '654321',
    });

    render(
      <ForgotPasswordModal isOpen={true} initialEmail="carlos.mendez@ejemplo.com" onClose={vi.fn()} onSuccessReset={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));

    await waitFor(() => {
      expect(authApi.requestForgotPassword).toHaveBeenCalledWith('carlos.mendez@ejemplo.com');
      expect(screen.getByText('Simulación de Entrega Segura')).toBeInTheDocument();
      expect(screen.getByText('654321')).toBeInTheDocument();
      expect(screen.getByLabelText(/Código de Verificación/i)).toHaveValue('654321');
    });
  });

  it('valida que las contraseñas coincidan y tengan mínimo 6 caracteres', async () => {
    vi.mocked(authApi.requestForgotPassword).mockResolvedValueOnce({
      message: 'Código enviado',
      devToken: '654321',
    });

    render(
      <ForgotPasswordModal isOpen={true} initialEmail="carlos.mendez@ejemplo.com" onClose={vi.fn()} onSuccessReset={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^Nueva Contraseña/i)).toBeInTheDocument();
    });

    const newPass = screen.getByLabelText(/^Nueva Contraseña/i);
    const confirmPass = screen.getByLabelText(/Confirmar Nueva Contraseña/i);
    const resetBtn = screen.getByRole('button', { name: /Restablecer Contraseña/i });

    // Contraseña demasiado corta
    fireEvent.change(newPass, { target: { value: '123' } });
    fireEvent.change(confirmPass, { target: { value: '123' } });
    fireEvent.click(resetBtn);

    expect(await screen.findByText(/La nueva contraseña debe tener al menos 6 caracteres/i)).toBeInTheDocument();

    // Contraseñas no coinciden
    fireEvent.change(newPass, { target: { value: 'Password123' } });
    fireEvent.change(confirmPass, { target: { value: 'DifferentPassword123' } });
    fireEvent.click(resetBtn);

    expect(await screen.findByText(/Las contraseñas no coinciden/i)).toBeInTheDocument();
  });

  it('envía el restablecimiento al API y muestra pantalla de éxito', async () => {
    vi.mocked(authApi.requestForgotPassword).mockResolvedValueOnce({
      message: 'Código enviado',
      devToken: '654321',
    });
    vi.mocked(authApi.resetPassword).mockResolvedValueOnce({
      message: 'Contraseña actualizada',
    });

    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <ForgotPasswordModal isOpen={true} initialEmail="carlos.mendez@ejemplo.com" onClose={handleClose} onSuccessReset={handleSuccess} />
    );

    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^Nueva Contraseña/i)).toBeInTheDocument();
    });

    const newPass = screen.getByLabelText(/^Nueva Contraseña/i);
    const confirmPass = screen.getByLabelText(/Confirmar Nueva Contraseña/i);
    const resetBtn = screen.getByRole('button', { name: /Restablecer Contraseña/i });

    fireEvent.change(newPass, { target: { value: 'NewSecurePassword123' } });
    fireEvent.change(confirmPass, { target: { value: 'NewSecurePassword123' } });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(authApi.resetPassword).toHaveBeenCalledWith('654321', 'NewSecurePassword123');
      expect(screen.getByText('¡Contraseña Actualizada!')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión Ahora/i }));

    expect(handleSuccess).toHaveBeenCalledWith('carlos.mendez@ejemplo.com');
    expect(handleClose).toHaveBeenCalled();
  });
});
