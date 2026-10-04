import { jsPDF } from 'jspdf';
import { Appointment } from '../types';
import { formatDisplayDate } from './dateUtils';
import { cleanProfessionalName } from './professionalUtils';

export const generateAppointmentPdf = (appointment: Appointment): void => {
  const isCompleted = appointment.status === 'completada';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors: Brand Wine (#A3073B), Dark Slate (#0F172A), Muted (#64748B), Soft Tint (#FDF2F4)
  const winePrimary = [163, 7, 59];
  const slateDark = [15, 23, 42];
  const slateText = [51, 65, 85];
  const slateMuted = [100, 116, 139];
  const borderLight = [226, 232, 240];

  // 1. Decorative Header Bar
  doc.setFillColor(winePrimary[0], winePrimary[1], winePrimary[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand Name & Shield Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MEDIHEALTH PLUS', 18, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Sistema Hospitalario y Gestión Inteligente de Citas', 18, 20);

  // Document Type Ribbon in Header
  const ribbonText = isCompleted ? 'CONSTANCIA ASISTENCIAL' : 'COMPROBANTE OFICIAL';
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - 75, 8, 57, 12, 2, 2, 'F');
  doc.setTextColor(winePrimary[0], winePrimary[1], winePrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(ribbonText, pageWidth - 46.5, 15.5, { align: 'center' });

  // 2. Document Title & Intro
  let y = 42;
  const mainTitle = isCompleted
    ? 'CONSTANCIA DE ASISTENCIA Y ATENCIÓN MÉDICA'
    : 'COMPROBANTE DE ASIGNACIÓN DE CITA MÉDICA';

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(mainTitle, 18, y);

  y += 6;
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `Expediente Digital No: MH-${appointment.id.padStart(6, '0')}  |  Fecha de expedición: ${formatDisplayDate(new Date().toISOString().split('T')[0])}`,
    18,
    y
  );

  // 3. Section: Patient & Appointment Status Cards
  y += 10;
  // Patient Card Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(18, y, pageWidth - 36, 26, 3, 3, 'FD');

  doc.setTextColor(winePrimary[0], winePrimary[1], winePrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DATOS DEL PACIENTE AFILIADO', 24, y + 7);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(appointment.patientName, 24, y + 14);

  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Identificación: ${appointment.patientDocument || 'Documento no registrado'}`, 24, y + 20);

  // Status Badge on the right
  const statusLabel = isCompleted ? 'ATENDIDA / CUMPLIDA' : 'RESERVA CONFIRMADA';
  doc.setFillColor(isCompleted ? 236 : 241, isCompleted ? 253 : 245, isCompleted ? 245 : 249);
  doc.setDrawColor(isCompleted ? 167 : 203, isCompleted ? 243 : 213, isCompleted ? 208 : 225);
  doc.roundedRect(pageWidth - 80, y + 6, 56, 14, 2, 2, 'FD');
  doc.setTextColor(isCompleted ? 22 : 15, isCompleted ? 101 : 23, isCompleted ? 52 : 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(statusLabel, pageWidth - 52, y + 15, { align: 'center' });

  // 4. Section: Consultation Details Table
  y += 34;
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('INFORMACIÓN DE LA CONSULTA MÉDICA', 18, y);

  y += 4;
  // Details Grid Container
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(18, y, pageWidth - 36, 48, 3, 3, 'FD');

  const col1X = 24;
  const col2X = pageWidth / 2 + 6;

  // Row 1
  y += 9;
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('MÉDICO TRATANTE', col1X, y);
  doc.text('ESPECIALIDAD MÉDICA', col2X, y);

  y += 5;
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(cleanProfessionalName(appointment.doctorName), col1X, y);
  doc.text(appointment.doctorSpecialty, col2X, y);

  // Row 2
  y += 10;
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('FECHA Y HORA PROGRAMADA', col1X, y);
  doc.text('SEDE Y CONSULTORIO', col2X, y);

  y += 5;
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`${formatDisplayDate(appointment.date)} - ${appointment.time}`, col1X, y);
  doc.text(`${appointment.location || 'Sede Principal MediHealth'} (${appointment.room || 'Consultorio General'})`, col2X, y);

  // Row 3
  y += 10;
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('MODALIDAD DE ATENCIÓN', col1X, y);
  doc.text('MOTIVO / ASUNTO', col2X, y);

  y += 5;
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(appointment.type === 'virtual' ? 'Teleconsulta / Virtual' : 'Presencial Institucional', col1X, y);
  doc.text(appointment.reason || 'Consulta Médica Asistencial', col2X, y);

  // 5. Clinical Prescription & Findings (if completed) OR Instructions (if upcoming)
  y += 16;
  if (isCompleted && appointment.prescription) {
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('REGISTRO CLÍNICO Y DIAGNÓSTICO', 18, y);

    y += 4;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(18, y, pageWidth - 36, 38, 3, 3, 'FD');

    y += 8;
    doc.setTextColor(winePrimary[0], winePrimary[1], winePrimary[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DIAGNÓSTICO MÉDICO:', col1X, y);

    y += 5;
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(appointment.prescription.diagnosis || 'Atención médica culminada sin anomalías.', col1X, y);

    y += 8;
    doc.setTextColor(winePrimary[0], winePrimary[1], winePrimary[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('INDICACIONES Y CONDUCTA:', col1X, y);

    y += 5;
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(appointment.prescription.notes || 'Seguimiento según evolución del paciente.', col1X, y);

    y += 14;
  } else {
    // Instructions for upcoming appointment
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 205, 211);
    doc.roundedRect(18, y, pageWidth - 36, 28, 3, 3, 'FD');

    y += 7;
    doc.setTextColor(winePrimary[0], winePrimary[1], winePrimary[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('INDICACIONES IMPORTANTES PARA EL PACIENTE:', col1X, y);

    y += 5;
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('• Presentarse 15 minutos antes de la hora acordada en la sede médica.', col1X, y);
    y += 4.5;
    doc.text('• Presentar documento de identidad original y carné de afiliación o constancia digital.', col1X, y);
    y += 4.5;
    doc.text('• Si requiere reprogramar, hágalo con al menos 2 horas de anticipación desde el portal.', col1X, y);

    y += 12;
  }

  // 6. Signatures and Security Verification
  y = Math.max(y, 195);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(col1X, y + 20, col1X + 60, y + 20);
  doc.line(col2X, y + 20, col2X + 60, y + 20);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(cleanProfessionalName(appointment.doctorName), col1X, y + 25);
  doc.text('MediHealth Plus IPS', col2X, y + 25);

  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Firma y Registro Médico Digital', col1X, y + 29);
  doc.text('Validación y Certificación Institucional', col2X, y + 29);

  // 7. Footer Decorative Bar
  doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.rect(0, pageHeight - 16, pageWidth, 16, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('MediHealth Plus IPS • Documento electrónico expedido con validez asistencial y legal.', pageWidth / 2, pageHeight - 9, { align: 'center' });
  doc.text('Línea de atención nacional: 01 8000 900 100 • www.medihealthplus.com', pageWidth / 2, pageHeight - 5, { align: 'center' });

  // Save PDF
  const filename = isCompleted
    ? `constancia-asistencia-${appointment.id}.pdf`
    : `comprobante-cita-${appointment.id}.pdf`;

  doc.save(filename);
};
