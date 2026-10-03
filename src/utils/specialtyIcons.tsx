import React from 'react';
import {
  Stethoscope,
  HeartPulse,
  Baby,
  Brain,
  Bone,
  Bandage,
  Eye,
  Ear,
  ClipboardCheck,
  HeartHandshake,
} from 'lucide-react';

/**
 * Icono de Pulmones (Neumología) diseñado en estilo Lucide (stroke 2, 24x24).
 */
export const LungsIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 2v6" />
    <path d="M10 4h4" />
    <path d="M10 7h4" />
    <path d="M12 8l-3 3" />
    <path d="M12 8l3 3" />
    <path d="M9 11c-2.8 0-5 2-5 5.5C4 19.5 6 21 8.5 21c2 0 3-1 3.5-2.5V11z" />
    <path d="M15 11c2.8 0 5 2 5 5.5c0 3-2 4.5-4.5 4.5c-2 0-3-1-3.5-2.5V11z" />
  </svg>
);

/**
 * Icono de Estómago / Sistema Digestivo (Gastroenterología) en estilo Lucide.
 */
export const StomachIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M11 2v4c0 1-.8 2-1.5 3" />
    <path d="M9 9C6.5 10.5 5 13 5.5 16c.8 4 5 5 8.5 5c3.8 0 6-2.5 6-6c0-3.5-2.5-5.5-4.5-5.5c-1.2 0-2.2.5-3 1.2" />
    <path d="M16 19.5l2.5 2" />
  </svg>
);

/**
 * Icono de Riñón / Función Renal (Nefrología) en estilo Lucide.
 */
export const KidneyIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 3C7.5 3 4.5 6.5 4.5 12c0 5 3 9 7.5 9c3.5 0 5.5-2 6.5-4.5c.8-2 .5-4.5-.8-6c-1.2-1.4-1.2-3.6 0-5C18.8 4 16 3 12 3z" />
    <path d="M15 12c-1.5.5-2.5-.5-3.5-1" />
    <path d="M13 14c.5 2 1.5 4 3 6" />
  </svg>
);

/**
 * Icono de Vejiga y Vías Urinarias (Urología) en estilo Lucide.
 */
export const BladderIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M7 3c1 3 2 5 2 7" />
    <path d="M17 3c-1 3-2 5-2 7" />
    <path d="M9 10c-3 1-4.5 3.5-4 6.5c.8 4 4.5 5 7 5s6.2-1 7-5c.5-3-1-5.5-4-6.5" />
    <path d="M12 21.5v1.5" />
  </svg>
);

/**
 * Icono de Glándula Tiroides / Sistema Hormonal (Endocrinología) en estilo Lucide.
 */
export const ThyroidIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 3v18" />
    <path d="M9 5h6" />
    <path d="M9 9h6" />
    <path d="M9 13h6" />
    <path d="M9 9C6.5 8 4 9.5 4 13c0 3 2 5.5 5 4.5V9z" />
    <path d="M15 9c2.5-1 5 .5 5 4c0 3-2 5.5-5 4.5V9z" />
  </svg>
);

/**
 * Retorna el icono SVG clínico correspondiente a la especialidad médica
 * con alta fidelidad anatómica y médica para MediHealth Plus.
 */
export function getSpecialtyIcon(specialty: string = '', className: string = 'w-6 h-6'): React.ReactElement {
  const norm = (specialty || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // 1. Ortopedia y Traumatología (hueso, articulaciones)
  if (norm.includes('orto') || norm.includes('trauma') || norm.includes('hueso')) {
    return <Bone className={className} />;
  }

  // 2. Cardiología
  if (norm.includes('cardio')) {
    return <HeartPulse className={className} />;
  }

  // 3. Pediatría (excluye ortopedia)
  if ((norm.includes('pediat') || norm.includes('nino') || norm.includes('infan')) && !norm.includes('orto')) {
    return <Baby className={className} />;
  }

  // 4. Neurología y Psiquiatría
  if (norm.includes('neuro') || norm.includes('psiqui') || norm.includes('mente')) {
    return <Brain className={className} />;
  }

  // 5. Neumología (Pulmones)
  if (norm.includes('neumo') || norm.includes('pulmon') || norm.includes('respira')) {
    return <LungsIcon className={className} />;
  }

  // 6. Gastroenterología (Estómago y digestivo)
  if (norm.includes('gastro') || norm.includes('digest') || norm.includes('estomago')) {
    return <StomachIcon className={className} />;
  }

  // 7. Nefrología (Riñón y función renal)
  if (norm.includes('nefro') || norm.includes('renal') || norm.includes('rinon')) {
    return <KidneyIcon className={className} />;
  }

  // 8. Urología (Vías urinarias y vejiga)
  if (norm.includes('uro') || norm.includes('vejiga')) {
    return <BladderIcon className={className} />;
  }

  // 9. Endocrinología (Tiroides, hormonas, diabetes)
  if (norm.includes('endocrin') || norm.includes('tiroide') || norm.includes('hormon') || norm.includes('diabet')) {
    return <ThyroidIcon className={className} />;
  }

  // 10. Dermatología (Cuidado y apósito dérmico clínico)
  if (norm.includes('derma') || norm.includes('piel')) {
    return <Bandage className={className} />;
  }

  // 11. Oftalmología (Visión y ojos)
  if (norm.includes('oftal') || norm.includes('ojo') || norm.includes('vision')) {
    return <Eye className={className} />;
  }

  // 12. Otorrinolaringología (Oído, nariz y garganta)
  if (norm.includes('otorrino') || norm.includes('oido') || norm.includes('laringe')) {
    return <Ear className={className} />;
  }

  // 13. Ginecología y Obstetricia
  if (norm.includes('gineco') || norm.includes('obste') || norm.includes('materno')) {
    return <HeartHandshake className={className} />;
  }

  // 14. Medicina Interna (Evaluación y diagnóstico clínico integral)
  if (norm.includes('interna')) {
    return <ClipboardCheck className={className} />;
  }

  // 15. Medicina General y Consulta Externa (Estetoscopio clínico)
  return <Stethoscope className={className} />;
}
