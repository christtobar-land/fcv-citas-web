import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('catalogsApi', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('carga únicamente el catálogo REST de planes activos', async () => {
    const plans = [{ id: 1, epsId: 1, epsCode: 'EPS_DEMO_A', epsName: 'EPS Demo Salud', regimeId: 1,
      regimeCode: 'CONTRIBUTIVO', regimeName: 'Contributivo', code: 'A-CONTRIB', name: 'Plan Contributivo Demo' }];
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(plans), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const catalogs = await import('./catalogsApi');

    await expect(catalogs.getInsurancePlans()).resolves.toEqual(plans);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/api/v1/catalogs/insurance-plans', expect.objectContaining({
      method: 'GET', credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' },
    }));
  });

  it('expone el error HTTP sin ocultar el estado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'No disponible' }), { status: 503 })));
    const catalogs = await import('./catalogsApi');

    await expect(catalogs.getInsurancePlans()).rejects.toMatchObject({ status: 503 });
  });
});
