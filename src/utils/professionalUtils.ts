/**
 * Utility functions for professional / doctor names across MediHealth.
 * Suppresses formal titles like Dr., Dra., Dr(a)., Doctor, Doctora to display only the clean full name.
 */
export const cleanProfessionalName = (name?: string | null): string => {
  if (!name) return '';
  return name
    .replace(/^(Dr\(a\)\.?|Dra\.?|Dr\.?|Doctora|Doctor)\s*/i, '')
    .trim();
};
