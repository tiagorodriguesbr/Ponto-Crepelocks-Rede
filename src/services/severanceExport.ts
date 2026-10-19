import jsPDF from 'jspdf';
import { DismissedEmployee, Store } from '../types';
import { StorageService } from './storage';

/**
 * Serviço de Geração de PDF Oficial: Termo de Rescisão do Contrato de Trabalho (TRCT)
 * Emite documento oficial compatível com os artigos 443, 477, 479 e 480 da CLT.
 */
export const SeveranceExportService = {
  generateSeverancePdf(rescisao: DismissedEmployee, store?: Store): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const allStores = StorageService.getStores();
    const resolvedStore =
      store ||
      allStores.find(
        (s) =>
          s.id === rescisao.storeId ||
          s.id === rescisao.payrollStoreId ||
          s.name.toLowerCase().trim() === rescisao.storeName?.toLowerCase().trim()
      ) ||
      allStores[0];

    const storeDisplayName = resolvedStore?.name || rescisao.storeName || 'Loja Crepelocks';
    const storeCityState = resolvedStore?.city || 'Rio de Janeiro / RJ';
    const storeAddress = resolvedStore?.address || 'Endereço da Unidade';
    const storeCnpj = resolvedStore?.cnpj || '45.892.120/0001-83';
    const storeCode = resolvedStore?.code || 'UNID';

    const storeRazaoSocial = resolvedStore?.razaoSocial || resolvedStore?.name || storeDisplayName;

    // 1. Cabeçalho Institucional
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(14, 10, 182, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${storeDisplayName.toUpperCase()}`, 18, 18);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text('TERMO DE RESCISÃO DO CONTRATO DE TRABALHO (TRCT) • COMPLIANCE CLT ART. 477 / ART. 479', 18, 26);

    // 2. Dados do Empregador e Empregado
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 35, 182, 34, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, 35, 182, 34, 'D');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DA EMPRESA / ESTABELECIMENTO EMPREGADOR:', 18, 41);
    doc.setFont('helvetica', 'normal');
    doc.text(`Estabelecimento / Loja: ${storeDisplayName} (${storeCode})`, 18, 47);
    doc.text(`CNPJ: ${storeCnpj}`, 120, 47);
    doc.text(`Razão Social: ${storeRazaoSocial}`, 18, 53);
    doc.text(`Endereço: ${storeAddress} - ${storeCityState}`, 120, 53);

    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO COLABORADOR TRABALHADOR:', 18, 61);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${rescisao.employeeName.toUpperCase()}`, 18, 66);
    doc.text(`CPF: ${rescisao.cpf}`, 120, 66);

    // 3. Dados do Contrato de Trabalho & Rescisão
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 72, 182, 28, 'F');
    doc.rect(14, 72, 182, 28, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DADOS DO CONTRATO E MODALIDADE DE RESCISÃO:', 18, 77);

    doc.setFont('helvetica', 'normal');
    doc.text(`Cargo / Função: ${rescisao.positionTitle} (${rescisao.role.toUpperCase()})`, 18, 83);
    doc.text(`Salário Base Contratual: R$ ${rescisao.baseSalary.toFixed(2)}`, 120, 83);

    doc.text(`Data de Admissão: ${rescisao.admissionDate}`, 18, 89);
    doc.text(`Data de Afastamento: ${rescisao.dismissalDate} (${rescisao.daysWorkedTotal} dias trabalhados)`, 120, 89);

    const contractTypeLabel = rescisao.contractType === 'experiencia'
      ? `Contrato de Experiência (${rescisao.probationDaysInitial || 45}d${rescisao.probationExtended ? ` + ${rescisao.probationDaysExtension || 45}d` : ''} = ${rescisao.probationTotalDays || 90}d total)`
      : 'Contrato de Trabalho por Prazo Indeterminado';
    doc.text(`Tipo de Contrato: ${contractTypeLabel}`, 18, 95);

    doc.setFont('helvetica', 'bold');
    doc.text(`Motivo: ${rescisao.reasonLabel}`, 120, 95);

    // 4. Enquadramento Legal e Artigo da CLT
    if (rescisao.cltArticle) {
      doc.setFillColor(254, 243, 199); // Amber-100
      doc.rect(14, 102, 182, 8, 'F');
      doc.setDrawColor(245, 158, 11);
      doc.rect(14, 102, 182, 8, 'D');
      doc.setTextColor(146, 64, 14);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Enquadramento Legal: ${rescisao.cltArticle}`, 18, 107.5);
    }

    // 5. Tabela de Rubricas e Verbas Rescisórias
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(14, 112, 182, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('CÓD', 18, 117);
    doc.text('DESCRIÇÃO DA VERBA RESCISÓRIA', 32, 117);
    doc.text('REFERÊNCIA / DIAS', 105, 117);
    doc.text('PROVENTOS (R$)', 132, 117);
    doc.text('DESCONTOS (R$)', 165, 117);

    // Linhas de Rubricas
    interface SeveranceItem {
      cod: string;
      desc: string;
      ref: string;
      prov: number;
      descVal: number;
    }

    const items: SeveranceItem[] = [
      {
        cod: '001',
        desc: 'SALDO DE SALÁRIO',
        ref: `${rescisao.saldoSalarioDias} dias`,
        prov: rescisao.saldoSalarioValor,
        descVal: 0
      }
    ];

    if (rescisao.decimoTerceiroValor > 0) {
      items.push({
        cod: '012',
        desc: '13º SALÁRIO PROPORCIONAL',
        ref: `${rescisao.decimoTerceiroProporcionalMeses}/12 avos`,
        prov: rescisao.decimoTerceiroValor,
        descVal: 0
      });
    }

    if (rescisao.feriasProporcionaisValor > 0) {
      items.push({
        cod: '020',
        desc: 'FÉRIAS PROPORCIONAIS',
        ref: `${rescisao.feriasProporcionaisMeses}/12 avos`,
        prov: rescisao.feriasProporcionaisValor,
        descVal: 0
      });
      items.push({
        cod: '021',
        desc: '1/3 CONSTITUCIONAL DE FÉRIAS',
        ref: 'Art. 7º, XVII CF',
        prov: rescisao.tercoConstitucionalFerias,
        descVal: 0
      });
    }

    // Indenização Artigo 479 da CLT (50% dos dias faltantes)
    if (rescisao.artigo479IndenizacaoValor && rescisao.artigo479IndenizacaoValor > 0) {
      items.push({
        cod: '050',
        desc: `INDENIZAÇÃO ART. 479 CLT (50% Salários Restantes Experiência)`,
        ref: `${rescisao.artigo479IndenizacaoDias} dias faltantes`,
        prov: rescisao.artigo479IndenizacaoValor,
        descVal: 0
      });
    }

    // Aviso Prévio Indenizado (Contrato indeterminado)
    if (rescisao.avisoPrevioIndenizadoValor && rescisao.avisoPrevioIndenizadoValor > 0) {
      items.push({
        cod: '055',
        desc: 'AVISO PRÉVIO INDENIZADO',
        ref: '30 dias',
        prov: rescisao.avisoPrevioIndenizadoValor,
        descVal: 0
      });
    }

    // Descontos Legais
    if (rescisao.descontoInssSaldoSalario > 0) {
      items.push({
        cod: '101',
        desc: 'PREVIDÊNCIA SOCIAL (INSS) S/ SALDO SALÁRIO',
        ref: 'Tabela CLT',
        prov: 0,
        descVal: rescisao.descontoInssSaldoSalario
      });
    }

    if (rescisao.descontoInssDecimoTerceiro > 0) {
      items.push({
        cod: '102',
        desc: 'PREVIDÊNCIA SOCIAL (INSS) S/ 13º SALÁRIO',
        ref: 'Tabela CLT',
        prov: 0,
        descVal: rescisao.descontoInssDecimoTerceiro
      });
    }

    if (rescisao.descontoIrpf > 0) {
      items.push({
        cod: '105',
        desc: 'IMPOSTO DE RENDA RETIDO NA FONTE (IRPF)',
        ref: 'Isento até 5k',
        prov: 0,
        descVal: rescisao.descontoIrpf
      });
    }

    if (rescisao.outrosDescontos > 0) {
      items.push({
        cod: '199',
        desc: 'OUTROS DESCONTOS / ADIANTAMENTOS CONTRATUAIS',
        ref: 'Ajuste',
        prov: 0,
        descVal: rescisao.outrosDescontos
      });
    }

    let y = 124;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    items.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 4, 182, 6, 'F');
      }

      doc.text(item.cod, 18, y);
      doc.text(item.desc, 32, y);
      doc.text(item.ref, 105, y);
      doc.text(item.prov > 0 ? item.prov.toFixed(2) : '-', 145, y, { align: 'right' });
      doc.text(item.descVal > 0 ? item.descVal.toFixed(2) : '-', 180, y, { align: 'right' });

      y += 6.5;
    });

    // 6. Bloco de Totais
    y += 2;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 10, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, y, 182, 10, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL DE PROVENTOS (BRUTO):', 18, y + 6.5);
    doc.text(`R$ ${rescisao.totalGrossSeverance.toFixed(2)}`, 68, y + 6.5);

    doc.text('TOTAL DE DESCONTOS:', 105, y + 6.5);
    doc.setTextColor(225, 29, 72);
    doc.text(`- R$ ${rescisao.totalDeductionsSeverance.toFixed(2)}`, 140, y + 6.5);

    // Bloco Líquido Destaque
    y += 13;
    doc.setFillColor(6, 78, 59); // Emerald-900
    doc.rect(14, y, 182, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('VALOR LÍQUIDO RESCISÓRIO A RECEBER PELO TRABALHADOR:', 18, y + 7.5);
    doc.setFontSize(11);
    doc.text(`R$ ${rescisao.netSeverancePay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 155, y + 8);

    // 7. Informações de FGTS
    y += 16;
    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, 182, 16, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, y, 182, 16, 'D');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('INFORMAÇÕES COMPLEMENTARES DE FGTS (PORTARIA MTP / LEGISLAÇÃO):', 18, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.text(`• Saque do FGTS: ${rescisao.saqueFgtsLiberado ? 'LIBERADO (Código 01 / Chave Conectividade)' : 'NÃO LIBERADO (Conforme Modalidade Rescisória)'}`, 18, y + 10);
    doc.text(
      `• Multa Rescisória de 40% do FGTS: ${
        rescisao.multaFgts40PctValor && rescisao.multaFgts40PctValor > 0
          ? `R$ ${rescisao.multaFgts40PctValor.toFixed(2)} (Devida em rescisão antecipada/sem justa causa)`
          : 'NÃO APLICÁVEL (Término regular no prazo acordado ou pedido de demissão)'
      }`,
      18,
      y + 14
    );

    // 8. Termo de Quitação e Assinaturas
    y += 20;
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(
      'Declaro para os devidos fins ter recebido a importância líquida supra descrita, dando plena e geral quitação das parcelas especificadas neste termo.',
      18,
      y
    );

    const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const cityStr = resolvedStore?.city ? resolvedStore.city.split('/')[0].trim() : 'Rio de Janeiro';
    const stateStr = resolvedStore?.city && resolvedStore.city.includes('/') ? resolvedStore.city.split('/')[1].trim() : 'RJ';
    doc.text(`${cityStr} - ${stateStr}, ${dataHoje}.`, 18, y + 5);

    // Linhas de Assinatura
    y += 18;
    doc.setDrawColor(100, 116, 139);
    doc.line(20, y, 90, y);
    doc.line(110, y, 180, y);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(storeDisplayName.toUpperCase(), 55, y + 4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('Empregador / Responsável Legal da Unidade', 55, y + 8, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.text(rescisao.employeeName.toUpperCase(), 145, y + 4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`CPF: ${rescisao.cpf}`, 145, y + 8, { align: 'center' });

    // Salvar e baixar PDF
    const filename = `TRCT_Rescisao_${rescisao.employeeName.replace(/\s+/g, '_')}_${rescisao.dismissalDate}.pdf`;
    doc.save(filename);
  }
};
