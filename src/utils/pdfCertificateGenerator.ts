import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Appointment } from '../types';
import { formatDisplayDate } from './dateUtils';
import { cleanProfessionalName } from './professionalUtils';

export const generateAppointmentPdf = async (appointment: Appointment): Promise<void> => {
  const isCompleted = appointment.status === 'completada';
  const doc = await PDFDocument.create();

  // A4 dimensions: 595.28 x 841.89 points
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = doc.addPage([pageWidth, pageHeight]);

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  // Colors
  const winePrimary = rgb(163 / 255, 7 / 255, 59 / 255); // #A3073B
  const slateDark = rgb(15 / 255, 23 / 255, 42 / 255);   // #0F172A
  const slateText = rgb(51 / 255, 65 / 255, 85 / 255);   // #334155
  const slateMuted = rgb(100 / 255, 116 / 255, 139 / 255); // #64748B
  const bgLight = rgb(248 / 255, 250 / 255, 252 / 255);   // #F8FAFC
  const borderLight = rgb(226 / 255, 232 / 255, 240 / 255); // #E2E8F0
  const white = rgb(1, 1, 1);
  const emeraldBg = rgb(236 / 255, 253 / 255, 245 / 255);
  const emeraldText = rgb(6 / 255, 95 / 255, 70 / 255);
  const emeraldBorder = rgb(167 / 255, 243 / 255, 208 / 255);
  const roseBg = rgb(255 / 255, 241 / 255, 242 / 255);
  const roseBorder = rgb(255 / 255, 228 / 255, 230 / 255);

  // 1. Top Decorative Brand Banner
  const bannerHeight = 72;
  page.drawRectangle({
    x: 0,
    y: pageHeight - bannerHeight,
    width: pageWidth,
    height: bannerHeight,
    color: winePrimary,
  });

  let logoDrawn = false;
  try {
    const logoResponse = await fetch('/logo.png');
    if (logoResponse.ok) {
      const logoBytes = await logoResponse.arrayBuffer();
      const logoImage = await doc.embedPng(logoBytes);
      
      // Fondo contenedor blanco para resaltar el logo
      page.drawRectangle({
        x: 40,
        y: pageHeight - bannerHeight + 12,
        width: 48,
        height: 48,
        color: white,
      });

      page.drawImage(logoImage, {
        x: 44,
        y: pageHeight - bannerHeight + 16,
        width: 40,
        height: 40,
      });
      logoDrawn = true;
    }
  } catch (err) {
    console.warn('No se pudo cargar el logo para el PDF, continuando con layout texto:', err);
  }

  const textStartX = logoDrawn ? 100 : 40;

  page.drawText('MEDIHEALTH PLUS', {
    x: textStartX,
    y: pageHeight - 38,
    size: 20,
    font: fontBold,
    color: white,
  });

  page.drawText('Sistema Hospitalario y Gestión Inteligente de Citas Médicas', {
    x: textStartX,
    y: pageHeight - 54,
    size: 9.5,
    font: fontRegular,
    color: white,
  });

  // Header Ribbon Badge
  const ribbonText = isCompleted ? 'CONSTANCIA ASISTENCIAL' : 'COMPROBANTE OFICIAL';
  const ribbonWidth = 145;
  const ribbonHeight = 24;
  page.drawRectangle({
    x: pageWidth - 40 - ribbonWidth,
    y: pageHeight - 50,
    width: ribbonWidth,
    height: ribbonHeight,
    color: white,
  });

  page.drawText(ribbonText, {
    x: pageWidth - 40 - ribbonWidth + 12,
    y: pageHeight - 42,
    size: 8.5,
    font: fontBold,
    color: winePrimary,
  });

  // 2. Document Title & Subtitle
  const mainTitle = isCompleted
    ? 'CONSTANCIA DE ASISTENCIA Y ATENCIÓN MÉDICA'
    : 'COMPROBANTE DE ASIGNACIÓN DE CITA MÉDICA';

  page.drawText(mainTitle, {
    x: 40,
    y: pageHeight - 105,
    size: 14,
    font: fontBold,
    color: slateDark,
  });

  const subMeta = `Expediente Digital No: MH-${String(appointment.id).padStart(6, '0')}  |  Fecha de expedición: ${formatDisplayDate(new Date().toISOString().split('T')[0])}`;
  page.drawText(subMeta, {
    x: 40,
    y: pageHeight - 120,
    size: 8.5,
    font: fontRegular,
    color: slateMuted,
  });

  // 3. Patient Information Card
  const patientCardY = pageHeight - 188;
  const cardWidth = pageWidth - 80;
  page.drawRectangle({
    x: 40,
    y: patientCardY,
    width: cardWidth,
    height: 56,
    color: bgLight,
    borderColor: borderLight,
    borderWidth: 1,
  });

  page.drawText('DATOS DEL PACIENTE AFILIADO', {
    x: 55,
    y: patientCardY + 40,
    size: 8,
    font: fontBold,
    color: winePrimary,
  });

  page.drawText(appointment.patientName, {
    x: 55,
    y: patientCardY + 24,
    size: 12,
    font: fontBold,
    color: slateDark,
  });

  page.drawText(`Identificación: ${appointment.patientDocument || 'Afiliado activo institucional'}`, {
    x: 55,
    y: patientCardY + 11,
    size: 9,
    font: fontRegular,
    color: slateText,
  });

  // Status Badge inside patient card
  const badgeWidth = 140;
  const badgeHeight = 24;
  page.drawRectangle({
    x: pageWidth - 40 - badgeWidth - 15,
    y: patientCardY + 16,
    width: badgeWidth,
    height: badgeHeight,
    color: isCompleted ? emeraldBg : bgLight,
    borderColor: isCompleted ? emeraldBorder : borderLight,
    borderWidth: 1,
  });

  page.drawText(isCompleted ? 'ATENDIDA / CUMPLIDA' : 'RESERVA CONFIRMADA', {
    x: pageWidth - 40 - badgeWidth - 3,
    y: patientCardY + 24,
    size: 8,
    font: fontBold,
    color: isCompleted ? emeraldText : slateDark,
  });

  // 4. Consultation Details Section
  page.drawText('INFORMACIÓN DE LA CONSULTA MÉDICA', {
    x: 40,
    y: pageHeight - 212,
    size: 10.5,
    font: fontBold,
    color: slateDark,
  });

  const detailsY = pageHeight - 335;
  page.drawRectangle({
    x: 40,
    y: detailsY,
    width: cardWidth,
    height: 110,
    color: white,
    borderColor: borderLight,
    borderWidth: 1,
  });

  const col1X = 55;
  const col2X = 310;

  // Row 1
  page.drawText('MÉDICO TRATANTE', { x: col1X, y: detailsY + 92, size: 7.5, font: fontBold, color: slateMuted });
  page.drawText(cleanProfessionalName(appointment.doctorName), { x: col1X, y: detailsY + 78, size: 10, font: fontBold, color: slateDark });

  page.drawText('ESPECIALIDAD MÉDICA', { x: col2X, y: detailsY + 92, size: 7.5, font: fontBold, color: slateMuted });
  page.drawText(appointment.doctorSpecialty, { x: col2X, y: detailsY + 78, size: 10, font: fontBold, color: slateDark });

  // Row 2
  page.drawText('FECHA Y HORA PROGRAMADA', { x: col1X, y: detailsY + 56, size: 7.5, font: fontBold, color: slateMuted });
  page.drawText(`${formatDisplayDate(appointment.date)} a las ${appointment.time}`, { x: col1X, y: detailsY + 42, size: 9.5, font: fontBold, color: slateDark });

  page.drawText('SEDE DE ATENCIÓN Y CONSULTORIO', { x: col2X, y: detailsY + 56, size: 7.5, font: fontBold, color: slateMuted });
  page.drawText(`${appointment.location || 'Sede Principal'} (${appointment.room || 'Consultorio General'})`, { x: col2X, y: detailsY + 42, size: 9, font: fontBold, color: slateDark });

  // Row 3
  page.drawText('MODALIDAD DE ATENCIÓN', { x: col1X, y: detailsY + 20, size: 7.5, font: fontBold, color: slateMuted });
  page.drawText(appointment.type === 'virtual' ? 'Teleconsulta Virtual' : 'Presencial Institucional', { x: col1X, y: detailsY + 8, size: 9, font: fontBold, color: slateDark });

  page.drawText('MOTIVO / ASUNTO REGISTRADO', { x: col2X, y: detailsY + 20, size: 7.5, font: fontBold, color: slateMuted });
  page.drawText(appointment.reason || 'Consulta médica asistencial', { x: col2X, y: detailsY + 8, size: 9, font: fontBold, color: slateDark });

  // 5. Clinical Findings / Indications
  if (isCompleted && appointment.prescription) {
    page.drawText('REGISTRO CLÍNICO Y DIAGNÓSTICO', {
      x: 40,
      y: pageHeight - 358,
      size: 10.5,
      font: fontBold,
      color: slateDark,
    });

    const clinicY = pageHeight - 450;
    page.drawRectangle({
      x: 40,
      y: clinicY,
      width: cardWidth,
      height: 80,
      color: bgLight,
      borderColor: borderLight,
      borderWidth: 1,
    });

    page.drawText('DIAGNÓSTICO MÉDICO:', { x: col1X, y: clinicY + 62, size: 8, font: fontBold, color: winePrimary });
    page.drawText(appointment.prescription.diagnosis || 'Atención completada con normalidad.', { x: col1X, y: clinicY + 48, size: 9.5, font: fontBold, color: slateDark });

    page.drawText('INDICACIONES Y CONDUCTA MÉDICA:', { x: col1X, y: clinicY + 30, size: 8, font: fontBold, color: winePrimary });
    page.drawText(appointment.prescription.notes || 'Seguimiento según evolución del paciente.', { x: col1X, y: clinicY + 16, size: 9, font: fontRegular, color: slateText });
  } else {
    page.drawText('INDICACIONES IMPORTANTES PARA EL PACIENTE', {
      x: 40,
      y: pageHeight - 358,
      size: 10.5,
      font: fontBold,
      color: slateDark,
    });

    const instructY = pageHeight - 435;
    page.drawRectangle({
      x: 40,
      y: instructY,
      width: cardWidth,
      height: 65,
      color: roseBg,
      borderColor: roseBorder,
      borderWidth: 1,
    });

    page.drawText('• Presentarse 15 minutos antes de la hora programada en la sede.', { x: col1X, y: instructY + 44, size: 8.5, font: fontRegular, color: slateText });
    page.drawText('• Portar su documento de identidad original para el ingreso.', { x: col1X, y: instructY + 28, size: 8.5, font: fontRegular, color: slateText });
    page.drawText('• Puede reprogramar o cancelar su cita con anticipación desde el portal.', { x: col1X, y: instructY + 12, size: 8.5, font: fontRegular, color: slateText });
  }

  // 6. Signatures and Verification
  const sigY = pageHeight - 510;
  page.drawLine({ start: { x: 55, y: sigY }, end: { x: 230, y: sigY }, color: borderLight, thickness: 1 });
  page.drawLine({ start: { x: 360, y: sigY }, end: { x: 535, y: sigY }, color: borderLight, thickness: 1 });

  page.drawText(cleanProfessionalName(appointment.doctorName), { x: 55, y: sigY - 14, size: 9, font: fontBold, color: slateDark });
  page.drawText('Firma y Registro Médico Digital', { x: 55, y: sigY - 26, size: 8, font: fontRegular, color: slateMuted });

  page.drawText('MediHealth Plus IPS', { x: 360, y: sigY - 14, size: 9, font: fontBold, color: slateDark });
  page.drawText('Certificación y Validación Digital', { x: 360, y: sigY - 26, size: 8, font: fontRegular, color: slateMuted });

  // 7. Footer Bar
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: 38,
    color: slateDark,
  });

  page.drawText('MediHealth Plus IPS • Documento electrónico expedido con firma y registro asistencial digital.', {
    x: 65,
    y: 22,
    size: 7.5,
    font: fontRegular,
    color: white,
  });

  page.drawText('Línea nacional gratuita: 01 8000 900 100 • www.medihealthplus.com', {
    x: 155,
    y: 11,
    size: 7.5,
    font: fontRegular,
    color: white,
  });

  // Direct Browser Download via Blob (No new windows, no popups, no print dialogs!)
  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const filename = isCompleted
    ? `constancia-asistencia-${appointment.id}.pdf`
    : `comprobante-cita-${appointment.id}.pdf`;

  if (typeof window !== 'undefined' && typeof window.URL?.createObjectURL === 'function') {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof window.URL?.revokeObjectURL === 'function') {
      window.URL.revokeObjectURL(url);
    }
  }
};
