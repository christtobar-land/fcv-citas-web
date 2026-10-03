import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateAvailabilityBlockModal } from './CreateAvailabilityBlockModal';
import * as appointmentApi from '../services/appointmentApi';

describe('Doctor Availability Management (RF-08)', () => {
  const mockLocations: appointmentApi.LocationItem[] = [
    {
      id: 1,
      code: 'ICV',
      name: 'Sede El Bosque (Principal)',
      address: 'Calle 155A No. 23-58',
      city: 'Floridablanca',
    },
    {
      id: 2,
      code: 'HIC',
      name: 'Sede Norte (Alterna)',
      address: 'Km 7 Autopista Bucaramanga - Piedecuesta',
      city: 'Piedecuesta',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with location options and presets, calculating 8 slots for morning shift', () => {
    render(
      <CreateAvailabilityBlockModal
        locations={mockLocations}
        professionalId={1}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Publicar Franja de Disponibilidad')).toBeInTheDocument();
    expect(screen.getAllByText('Sede El Bosque (Principal)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Sede Norte (Alterna)')).toBeInTheDocument();

    // Default preset is morning (08:00 - 12:00 -> 4 hours -> 8 slots of 30 mins)
    expect(screen.getByText('8 cupos')).toBeInTheDocument();
  });

  it('updates slot calculation dynamically when switching to afternoon preset', () => {
    render(
      <CreateAvailabilityBlockModal
        locations={mockLocations}
        professionalId={1}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    // Click Tarde (14:00 - 18:00 -> 4 hours -> 8 slots)
    const afternoonBtn = screen.getByRole('button', { name: /Tarde/i });
    fireEvent.click(afternoonBtn);

    expect(screen.getByText('14:00 a 18:00')).toBeInTheDocument();
    expect(screen.getByText('8 cupos')).toBeInTheDocument();
  });

  it('submits new availability block to API and calls onSuccess', async () => {
    const mockCreatedBlock: appointmentApi.AvailabilityBlockItem = {
      id: 101,
      professionalId: 1,
      professionalName: 'Dr. Alejandro Morales',
      locationId: 1,
      locationName: 'Sede El Bosque (Principal)',
      locationAddress: 'Calle 155A No. 23-58',
      availableDate: '2026-10-05',
      startTime: '08:00:00',
      endTime: '12:00:00',
      active: true,
      totalSlots: 8,
      bookedSlots: 0,
      canDelete: true,
    };

    const createSpy = vi.spyOn(appointmentApi, 'createAvailabilityBlock').mockResolvedValue(mockCreatedBlock);
    const onSuccessMock = vi.fn();

    render(
      <CreateAvailabilityBlockModal
        locations={mockLocations}
        professionalId={1}
        initialDate="2026-10-02"
        onClose={vi.fn()}
        onSuccess={onSuccessMock}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Publicar Disponibilidad/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        professionalId: 1,
        locationId: 1,
        availableDate: '2026-10-02',
        startTime: '08:00:00',
        endTime: '12:00:00',
      });
      expect(onSuccessMock).toHaveBeenCalledWith(mockCreatedBlock);
    });
  });

  it('displays error feedback when API rejects block creation', async () => {
    vi.spyOn(appointmentApi, 'createAvailabilityBlock').mockRejectedValue(
      new Error('Ya existe una franja horaria activa para este profesional que se cruza con el horario seleccionado.')
    );

    render(
      <CreateAvailabilityBlockModal
        locations={mockLocations}
        professionalId={1}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Publicar Disponibilidad/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Ya existe una franja horaria activa para este profesional que se cruza con el horario seleccionado.')
      ).toBeInTheDocument();
    });
  });
});
