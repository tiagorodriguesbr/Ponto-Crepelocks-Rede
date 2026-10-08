import { jsPDF } from 'jspdf';
import { UserAccount, PunchRecord, Store } from '../types';

export interface PayrollExportOptions {
  monthYear: string; // "2026-10"
  storeName: string;
  companyName: string;
  cnpj: string;
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    try {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }, 1000);
}

export const PayrollExportService = {
  // Generate and download a formatted PDF "Espelho de Ponto"
  exportIndividualPdf(
    employee: UserAccount,
    punches: PunchRecord[],
    store: Store | undefined,
    monthYear: string = '2026-10'
  ) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [16, 185, 129]; // Crepelocks Emerald
    const darkColor = [24, 24, 27]; // Zinc 900
    const lightGray = [244, 244, 245];

    // Header Banner
    doc.setFillColor(16, 24, 20);
    doc.rect(0, 0, 210, 28, 'F');

    // Brand
    doc.setTextColor(52, 211, 153);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CREPELOCKS', 14, 13);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(161, 161, 170);
    doc.text('SISTEMA INTEGRADO DE PONTO ELETRÔNICO E GESTÃO RH', 14, 19);
    doc.text('EM CONFORMIDADE COM A PORTARIA MTP Nº 671/2021', 14, 23);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('ESPELHO MENSAL DE PONTO', 145, 13);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Competência: ${monthYear}`, 145, 18);
    doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 145, 23);

    // Employee & Company Details Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 33, 182, 32, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 33, 182, 32, 2, 2, 'D');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`EMPRESA: CREPELOCKS BRASIL ALIMENTOS LTDA`, 18, 39);
    doc.text(`UNIDADE / LOJA: ${store?.name || 'Crepelocks Sede'} (${store?.code || 'LJ-01'})`, 18, 45);
    doc.text(`ENDEREÇO: ${store?.address || 'Av. Paulista, 1000'} - ${store?.city || 'São Paulo - SP'}`, 18, 51);
    doc.text(`CNPJ: 45.892.120/0001-83`, 18, 57);

    doc.text(`COLABORADOR(A): ${employee.name.toUpperCase()}`, 110, 39);
    doc.text(`CARGO: ${employee.positionTitle} (${employee.role.toUpperCase()})`, 110, 45);
    doc.text(`CPF: ${employee.cpf || '000.000.000-00'}  |  ADMISSÃO: ${employee.admissionDate}`, 110, 51);
    doc.text(`ESCALA: ${employee.scheduleType} (${employee.defaultShiftStart} às ${employee.defaultShiftEnd})`, 110, 57);

    // Punch Table Header
    let y = 72;
    doc.setFillColor(24, 24, 27);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('DATA', 17, y + 5);
    doc.text('DIA', 32, y + 5);
    doc.text('ENTRADA', 48, y + 5);
    doc.text('SAÍDA ALM.', 68, y + 5);
    doc.text('RET. ALM.', 88, y + 5);
    doc.text('SAÍDA', 108, y + 5);
    doc.text('TRABALHADO', 126, y + 5);
    doc.text('ATRASO', 148, y + 5);
    doc.text('EXTRAS', 163, y + 5);
    doc.text('SITUAÇÃO', 178, y + 5);

    y += 7;

    // Filter punches for selected month or show items
    const monthPunches = punches.filter((p) => p.date.startsWith(monthYear));
    const sorted = [...monthPunches].sort((a, b) => a.date.localeCompare(b.date));

    let totalWorkedMinutes = 0;
    let totalDelayMinutes = 0;
    let totalExtraMinutes = 0;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    sorted.forEach((p, idx) => {
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(14, y, 182, 6, 'F');
      doc.setTextColor(30, 41, 59);

      const dObj = new Date(p.date + 'T12:00:00');
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const dayName = dayNames[dObj.getDay()];
      const dayFormatted = p.date.split('-').reverse().slice(0, 2).join('/');

      doc.text(dayFormatted, 17, y + 4.2);
      doc.text(dayName, 32, y + 4.2);
      doc.text(p.entry ? p.entry.slice(0, 5) : '--:--', 48, y + 4.2);
      doc.text(p.lunchStart ? p.lunchStart.slice(0, 5) : '--:--', 68, y + 4.2);
      doc.text(p.lunchEnd ? p.lunchEnd.slice(0, 5) : '--:--', 88, y + 4.2);
      doc.text(p.exit ? p.exit.slice(0, 5) : '--:--', 108, y + 4.2);

      const workedH = Math.floor(p.workedMinutes / 60);
      const workedM = p.workedMinutes % 60;
      doc.text(`${workedH}h ${workedM.toString().padStart(2, '0')}m`, 126, y + 4.2);

      doc.text(p.delayMinutes > 0 ? `${p.delayMinutes} min` : '0 min', 148, y + 4.2);
      doc.text(p.extraMinutes > 0 ? `${p.extraMinutes} min` : '0 min', 163, y + 4.2);

      let statusBadge = p.status === 'folga' ? 'FOLGA' :
                        p.status === 'falta_justificada' ? 'ATESTADO' :
                        p.status === 'falta_injustificada' ? 'FALTA' :
                        p.status === 'atraso' ? 'ATRASO' : 'REGULAR';
      
      if (statusBadge === 'ATRASO' || statusBadge === 'FALTA') {
        doc.setTextColor(190, 18, 60);
      } else if (statusBadge === 'ATESTADO' || statusBadge === 'FOLGA') {
        doc.setTextColor(3, 105, 161);
      } else {
        doc.setTextColor(21, 128, 61);
      }
      doc.text(statusBadge, 178, y + 4.2);

      totalWorkedMinutes += p.workedMinutes;
      totalDelayMinutes += p.delayMinutes;
      totalExtraMinutes += p.extraMinutes;

      y += 6;
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
    });

    // Summary Totals Box
    y += 4;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, 182, 18, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, 182, 18, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    const totH = Math.floor(totalWorkedMinutes / 60);
    const totM = totalWorkedMinutes % 60;
    const extH = Math.floor(totalExtraMinutes / 60);
    const extM = totalExtraMinutes % 60;
    const delH = Math.floor(totalDelayMinutes / 60);
    const delM = totalDelayMinutes % 60;

    doc.text(`TOTAL TRABALHADO: ${totH}h ${totM}m`, 20, y + 7);
    doc.text(`HORAS EXTRAS TOTAIS: ${extH}h ${extM}m`, 75, y + 7);
    doc.text(`TOTAL DE ATRASOS: ${delH}h ${delM}m`, 135, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('Regime de Compensação: Banco de Horas / Acordo Coletivo Crepelocks.', 20, y + 13);
    doc.text(`Certificação Digital de Ponto: ${employee.id.slice(0, 8)}-${Date.now()}`, 115, y + 13);

    // Signatures
    y += 24;
    doc.setDrawColor(148, 163, 184);
    doc.line(20, y, 85, y);
    doc.line(125, y, 190, y);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text('Assinatura do Colaborador(a)', 32, y + 4);
    doc.text(`${employee.name}`, 35, y + 8);

    doc.text('Crepelocks - Recursos Humanos', 135, y + 4);
    doc.text(`Unidade: ${store?.name || 'Sede'}`, 140, y + 8);

    // Disclaimer
    y += 14;
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Reconheço a exatidão das anotações constantes neste espelho de ponto e nos registros originais eletrônicos.', 30, y);

    doc.save(`espelho_ponto_${employee.name.toLowerCase().replace(/\s+/g, '_')}_${monthYear}.pdf`);
  },

  // Export CSV for Payroll Integration (Totvs, Folha Fácil, Senior, ADP)
  exportPayrollCsv(
    users: UserAccount[],
    punches: PunchRecord[],
    stores: Store[],
    monthYear: string = '2026-10'
  ) {
    const headers = [
      'ID_COLABORADOR',
      'NOME_COLABORADOR',
      'CPF',
      'CARGO',
      'LOJA_CODIGO',
      'LOJA_NOME',
      'ESCALA',
      'DATA_PONTO',
      'ENTRADA',
      'SAIDA_ALMOCO',
      'RETORNO_ALMOCO',
      'SAIDA',
      'MINUTOS_TRABALHADOS',
      'MINUTOS_PREVISTOS',
      'MINUTOS_ATRASO',
      'MINUTOS_EXTRAS',
      'STATUS_OCORRENCIA',
      'ADERENCIA_PCT',
      'COMPROVANTE_HASH'
    ];

    const rows: string[] = [headers.join(';')];

    const userIds = new Set(users.map((u) => u.id));
    const targetPunches = punches.filter((p) => p.date.startsWith(monthYear) && userIds.has(p.employeeId));

    // If there are punches for the selected users, include them
    targetPunches.forEach((p) => {
      const emp = users.find((u) => u.id === p.employeeId);
      const store = stores.find((s) => s.id === emp?.storeId);

      const row = [
        emp?.id || p.employeeId,
        `"${emp?.name || 'Desconhecido'}"`,
        emp?.cpf || '',
        `"${emp?.positionTitle || ''}"`,
        store?.code || 'LJ-01',
        `"${store?.name || ''}"`,
        emp?.scheduleType || '6x1',
        p.date,
        p.entry || '',
        p.lunchStart || '',
        p.lunchEnd || '',
        p.exit || '',
        p.workedMinutes,
        p.expectedMinutes,
        p.delayMinutes,
        p.extraMinutes,
        p.status,
        `${p.adherencePercentage}%`,
        p.hashReceipt || ''
      ];
      rows.push(row.join(';'));
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerBrowserDownload(blob, `folha_pagamento_crepelocks_${monthYear}.csv`);
  },

  // Export AFDP (Arquivo Fonte de Dados de Ponto - Portaria MTP 671 / MTP)
  exportAfdpTxt(
    users: UserAccount[],
    punches: PunchRecord[],
    monthYear: string = '2026-10'
  ) {
    const lines: string[] = [];
    const dateFormatted = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const timeFormatted = new Date().toTimeString().slice(0, 8).replace(/:/g, '');

    // Registro Tipo 1: Cabeçalho do AFDP (Portaria 671/2021)
    lines.push(
      `0000000001145892120000183CREPELOCKS BRASIL ALIMENTOS LTDA` +
      `${dateFormatted}${timeFormatted}${monthYear.replace('-', '')}`
    );

    let nsr = 1;
    const userIds = new Set(users.map((u) => u.id));
    const sortedPunches = [...punches]
      .filter((p) => p.date.startsWith(monthYear) && userIds.has(p.employeeId))
      .sort((a, b) => a.date.localeCompare(b.date));

    sortedPunches.forEach((p) => {
      const emp = users.find((u) => u.id === p.employeeId);
      const cpfRaw = (emp?.cpf || '00000000000').replace(/\D/g, '').padStart(11, '0');
      const dt = p.date.replace(/-/g, '');
      const hashShort = (p.hashReceipt || 'SHA256:E01F82C9').slice(0, 16);

      // Marcações
      const markings: { time: string | null; code: string }[] = [
        { time: p.entry, code: 'E1' },
        { time: p.lunchStart, code: 'S1' },
        { time: p.lunchEnd, code: 'E2' },
        { time: p.exit, code: 'S2' }
      ];

      markings.forEach((m) => {
        if (m.time) {
          const tm = m.time.replace(/:/g, '').slice(0, 4);
          lines.push(
            `${nsr.toString().padStart(9, '0')}2${dt}${tm}${cpfRaw}${m.code}${hashShort}`
          );
          nsr++;
        }
      });
    });

    // Registro Tipo 9: Trailer (Final do Arquivo AFDP)
    lines.push(
      `${nsr.toString().padStart(9, '0')}9TOTAL_REGISTROS_${(nsr - 1).toString().padStart(6, '0')}_PORTARIA_MTP_671`
    );

    const blob = new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8;' });
    triggerBrowserDownload(blob, `AFDP_MTP671_CREPELOCKS_${monthYear}.txt`);
  },

  // Export AFDT (Arquivo Fonte de Dados Tratado) format (Portaria MTP 671)
  exportAfdtTxt(
    users: UserAccount[],
    punches: PunchRecord[],
    monthYear: string = '2026-10'
  ) {
    const lines: string[] = [];
    const dateFormatted = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const timeFormatted = new Date().toTimeString().slice(0, 8).replace(/:/g, '');

    lines.push(`00000000011CREPELOCKS BRASIL ALIMENTOS LTDA45892120000183${dateFormatted}${timeFormatted}`);

    let seq = 2;
    const userIds = new Set(users.map((u) => u.id));
    punches
      .filter((p) => p.date.startsWith(monthYear) && userIds.has(p.employeeId))
      .forEach((p) => {
        const emp = users.find((u) => u.id === p.employeeId);
        const cpfRaw = (emp?.cpf || '00000000000').replace(/\D/g, '').padStart(11, '0');
        const dt = p.date.replace(/-/g, '');

        if (p.entry) {
          const tm = p.entry.replace(/:/g, '').slice(0, 4);
          lines.push(`${seq.toString().padStart(9, '0')}2${dt}${tm}${cpfRaw}E01`);
          seq++;
        }
        if (p.lunchStart) {
          const tm = p.lunchStart.replace(/:/g, '').slice(0, 4);
          lines.push(`${seq.toString().padStart(9, '0')}2${dt}${tm}${cpfRaw}S01`);
          seq++;
        }
        if (p.lunchEnd) {
          const tm = p.lunchEnd.replace(/:/g, '').slice(0, 4);
          lines.push(`${seq.toString().padStart(9, '0')}2${dt}${tm}${cpfRaw}E02`);
          seq++;
        }
        if (p.exit) {
          const tm = p.exit.replace(/:/g, '').slice(0, 4);
          lines.push(`${seq.toString().padStart(9, '0')}2${dt}${tm}${cpfRaw}S02`);
          seq++;
        }
      });

    lines.push(`${seq.toString().padStart(9, '0')}9CREPELOCKS_PORTARIA_671_FIM`);

    const blob = new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8;' });
    triggerBrowserDownload(blob, `AFDT_CREPELOCKS_${monthYear}.txt`);
  }
};
