import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cancelAppointment, closeProfessionalAppointment, getAvailability, getMyAppointments, reserveAppointment } from './schedulingApi';

describe('scheduling API', () => {
  beforeEach(() => { vi.restoreAllMocks(); });
  it('consulta disponibilidad con los filtros del contrato', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 7, status: 'CANCELLED' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await getAvailability(1, 11, '2030-01-02', 9);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/availability?locationId=1&specialtyId=11&date=2030-01-02&professionalId=9');
    expect(fetchMock.mock.calls[0][1].credentials).toBe('include');
  });
  it('envía una reserva REST sin persistir el token en el cliente', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1, status: 'APPROVED' }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    await reserveAppointment({ professionalId: 3, locationId: 1, specialtyId: 1, startAt: '2030-01-02T08:00:00' });
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/appointments');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ professionalId: 3, specialtyId: 1 });
  });
  it('consulta y cancela las citas propias por REST', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 7, status: 'CANCELLED' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await getMyAppointments('APPROVED', '2030-01-02');
    await cancelAppointment(7);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/appointments?status=APPROVED&date=2030-01-02');
    expect(fetchMock.mock.calls[1][0]).toContain('/api/v1/appointments/7/cancel');
    expect(fetchMock.mock.calls[1][1].method).toBe('POST');
  });
  it('cierra una cita profesional con un resultado permitido', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 3, status: 'COMPLETED' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await closeProfessionalAppointment(3, 'COMPLETED');
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/professional/appointments/3/close');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ outcome: 'COMPLETED' });
  });
});
