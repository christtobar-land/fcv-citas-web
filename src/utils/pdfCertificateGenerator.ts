import { Appointment } from '../types';
import { formatDisplayDate } from './dateUtils';
import { cleanProfessionalName } from './professionalUtils';

export const generateAppointmentPdf = (appointment: Appointment): void => {
  const isCompleted = appointment.status === 'completada';
  const docTitle = isCompleted
    ? 'CONSTANCIA DE ASISTENCIA Y ATENCIÓN MÉDICA'
    : 'COMPROBANTE DE ASIGNACIÓN DE CITA MÉDICA';
  const badgeLabel = isCompleted ? 'ATENDIDA / CUMPLIDA' : 'RESERVA CONFIRMADA';
  const badgeBg = isCompleted ? '#ECFDF5' : '#F1F5F9';
  const badgeColor = isCompleted ? '#065F46' : '#1E293B';
  const badgeBorder = isCompleted ? '#A7F3D0' : '#CBD5E1';

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${docTitle} - MH-${appointment.id}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background: #FFFFFF;
      color: #0F172A;
      font-size: 13px;
      line-height: 1.45;
      padding: 20px;
    }
    .header-banner {
      background: linear-gradient(135deg, #870530 0%, #A3073B 100%);
      color: #FFFFFF;
      padding: 20px 24px;
      border-radius: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(163, 7, 59, 0.15);
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 3px;
    }
    .header-badge {
      background: #FFFFFF;
      color: #A3073B;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .doc-meta {
      margin-bottom: 20px;
    }
    .doc-title {
      font-size: 16px;
      font-weight: 800;
      color: #0F172A;
    }
    .doc-subtitle {
      font-size: 11px;
      color: #64748B;
      margin-top: 4px;
    }
    .patient-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .patient-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #A3073B;
    }
    .patient-name {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 2px;
    }
    .patient-doc {
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
    }
    .status-badge {
      background: ${badgeBg};
      color: ${badgeColor};
      border: 1px solid ${badgeBorder};
      padding: 6px 16px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      text-align: center;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #334155;
      margin-bottom: 10px;
    }
    .details-grid {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 18px 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px 24px;
      margin-bottom: 20px;
    }
    .item-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748B;
    }
    .item-value {
      font-size: 13px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 2px;
    }
    .clinical-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 20px;
    }
    .instructions-box {
      background: #FFF1F2;
      border: 1px solid #FFE4E6;
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 45px;
      padding: 0 20px;
    }
    .signature-block {
      text-align: center;
      width: 200px;
    }
    .sig-line {
      border-top: 1px solid #CBD5E1;
      margin-bottom: 8px;
    }
    .sig-name {
      font-size: 11px;
      font-weight: 700;
      color: #0F172A;
    }
    .sig-role {
      font-size: 10px;
      color: #64748B;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 10px;
      color: #94A3B8;
      border-top: 1px solid #F1F5F9;
      padding-top: 12px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header-banner">
    <div>
      <div class="brand-title">MEDIHEALTH PLUS</div>
      <div class="brand-sub">Sistema Hospitalario y Gestión Inteligente de Citas Médicas</div>
    </div>
    <div class="header-badge">${isCompleted ? 'Constancia Oficial' : 'Comprobante Oficial'}</div>
  </div>

  <div class="doc-meta">
    <div class="doc-title">${docTitle}</div>
    <div class="doc-subtitle">Expediente No: MH-${String(appointment.id).padStart(6, '0')} • Expedido el: ${formatDisplayDate(new Date().toISOString().split('T')[0])}</div>
  </div>

  <div class="patient-card">
    <div>
      <div class="patient-label">Paciente Afiliado</div>
      <div class="patient-name">${appointment.patientName}</div>
      <div class="patient-doc">Identificación: ${appointment.patientDocument || 'Afiliado activo institucional'}</div>
    </div>
    <div class="status-badge">${badgeLabel}</div>
  </div>

  <div class="section-title">Detalles de la Consulta Médica</div>
  <div class="details-grid">
    <div>
      <div class="item-label">Profesional Tratante</div>
      <div class="item-value">${cleanProfessionalName(appointment.doctorName)}</div>
    </div>
    <div>
      <div class="item-label">Especialidad</div>
      <div class="item-value">${appointment.doctorSpecialty}</div>
    </div>
    <div>
      <div class="item-label">Fecha y Horario</div>
      <div class="item-value">${formatDisplayDate(appointment.date)} a las ${appointment.time}</div>
    </div>
    <div>
      <div class="item-label">Sede y Ubicación</div>
      <div class="item-value">${appointment.location || 'Sede Principal'} (${appointment.room || 'Consultorio General'})</div>
    </div>
    <div>
      <div class="item-label">Modalidad</div>
      <div class="item-value">${appointment.type === 'virtual' ? 'Teleconsulta Virtual' : 'Presencial Institucional'}</div>
    </div>
    <div>
      <div class="item-label">Motivo Registrado</div>
      <div class="item-value">${appointment.reason || 'Consulta médica general'}</div>
    </div>
  </div>

  ${
    isCompleted && appointment.prescription
      ? `
  <div class="section-title">Registro Clínico y Diagnóstico</div>
  <div class="clinical-box">
    <div class="item-label" style="color: #A3073B;">Diagnóstico Médico</div>
    <div style="font-size: 13px; color: #0F172A; margin: 4px 0 10px 0;">${appointment.prescription.diagnosis || 'Atención completada con normalidad.'}</div>
    <div class="item-label" style="color: #A3073B;">Indicaciones y Conducta Médica</div>
    <div style="font-size: 12px; color: #334155; margin-top: 4px;">${appointment.prescription.notes || 'Seguimiento según evolución del paciente.'}</div>
  </div>
  `
      : `
  <div class="instructions-box">
    <div style="font-size: 11px; font-weight: 800; color: #A3073B; text-transform: uppercase; margin-bottom: 6px;">Indicaciones Importantes para el Paciente</div>
    <ul style="padding-left: 18px; font-size: 11px; color: #475569; line-height: 1.6;">
      <li>Presentarse con 15 minutos de anticipación al horario asignado.</li>
      <li>Portar su documento de identidad original para el ingreso institucional.</li>
      <li>Puede reprogramar o cancelar su cita desde el portal con anticipación.</li>
    </ul>
  </div>
  `
  }

  <div class="signatures">
    <div class="signature-block">
      <div class="sig-line"></div>
      <div class="sig-name">${cleanProfessionalName(appointment.doctorName)}</div>
      <div class="sig-role">Firma y Registro Médico Digital</div>
    </div>
    <div class="signature-block">
      <div class="sig-line"></div>
      <div class="sig-name">MediHealth Plus IPS</div>
      <div class="sig-role">Certificación y Validación Digital</div>
    </div>
  </div>

  <div class="footer">
    MediHealth Plus IPS • Documento electrónico expedido con firma y registro asistencial digital.<br />
    Línea nacional gratuita: 01 8000 900 100 • www.medihealthplus.com
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
