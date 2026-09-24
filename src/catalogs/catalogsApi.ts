const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export interface InsurancePlan {
  id: number;
  epsId: number;
  epsCode: string;
  epsName: string;
  regimeId: number;
  regimeCode: string;
  regimeName: string;
  code: string;
  name: string;
}

export class CatalogApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'CatalogApiError';
  }
}

export async function getInsurancePlans(): Promise<InsurancePlan[]> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/v1/catalogs/insurance-plans`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
  } catch {
    throw new CatalogApiError(0, 'No fue posible cargar los planes disponibles.');
  }
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as { detail?: string } | null;
    throw new CatalogApiError(response.status, problem?.detail ?? 'No fue posible cargar los planes disponibles.');
  }
  return response.json() as Promise<InsurancePlan[]>;
}
