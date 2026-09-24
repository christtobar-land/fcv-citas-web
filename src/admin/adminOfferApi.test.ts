import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('adminOfferApi', () => {
  beforeEach(() => { vi.resetModules(); vi.restoreAllMocks(); });

  it('consulta especialidades por el contrato ADMIN', async () => {
    const specialties = [{ id: 1, code: 'MEDICINA_GENERAL', name: 'Medicina General', appointmentDurationMinutes: 30, general: true, requiresAdminApproval: false, active: true }];
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(specialties), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const api = await import('./adminOfferApi');

    await expect(api.listSpecialties()).resolves.toEqual(specialties);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/api/v1/admin/specialties', expect.objectContaining({
      credentials: 'include',
      headers: expect.objectContaining({ 'X-Requested-With': 'XMLHttpRequest' }),
    }));
  });

  it('envía asignaciones por PUT y estado por PATCH', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const api = await import('./adminOfferApi');

    await api.assignProfessionalSpecialties(8, [1, 11], 11);
    await api.assignProfessionalLocations(8, [1, 2]);
    await api.setProfessionalActive(8, false);

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
      ['http://localhost:8080/api/v1/admin/professionals/8/specialties', 'PUT'],
      ['http://localhost:8080/api/v1/admin/professionals/8/locations', 'PUT'],
      ['http://localhost:8080/api/v1/admin/professionals/8/active', 'PATCH'],
    ]);
  });
});
