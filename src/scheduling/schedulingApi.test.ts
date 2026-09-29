import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAvailability, reserveAppointment } from './schedulingApi';

describe('scheduling API', () => {
  beforeEach(() => { vi.restoreAllMocks(); });
  it('consulta disponibilidad con los filtros del contrato', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
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
});
