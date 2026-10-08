import { UserAccount } from '../types';

/**
 * Regras de Perfil e Acesso da Crepelocks
 * 
 * Hierarquia de Cargos:
 * 1. Atendente (Operacional de Loja)
 * 2. Gerente de Loja (Gestão de Unidade Específica)
 * 3. Cargos Corporativos e de Diretoria (Acima de Gerente de Loja):
 *    - Gerente de Vendas
 *    - Gerente de Marketing
 *    - Auxiliar Administrativo (Backoffice / DP)
 *    - Diretor Financeiro (CFO)
 *    - Diretor Operacional (COO)
 *    - Diretor Executivo (CEO)
 *    - Dono / Proprietário
 */

/**
 * Verifica se o usuário é Atendente
 */
export function isAtendente(user?: UserAccount): boolean {
  if (!user) return false;
  const title = (user.positionTitle || '').toLowerCase();
  // Auxiliar Administrativo tem role 'atendente' no sistema mas é cargo administrativo acima de loja
  if (title.includes('auxiliar')) return false;
  return user.role === 'atendente' || title.includes('atendente');
}

/**
 * Verifica se o usuário é Gerente de Loja
 */
export function isGerenteLoja(user?: UserAccount): boolean {
  if (!user) return false;
  const title = (user.positionTitle || '').toLowerCase();
  if (title.includes('gerente de loja') || title === 'gerente de unidade') {
    return true;
  }
  // Se for role 'gerente' sem especificação de cargo corporativo (vendas, marketing)
  if (user.role === 'gerente' && !title.includes('vendas') && !title.includes('marketing')) {
    return true;
  }
  return false;
}

/**
 * Verifica se o cargo está acima de Gerente de Loja
 * (Gerente de Vendas, Gerente de Marketing, Auxiliar Administrativo, Diretorias e Dono)
 */
export function isCargoAcimaDeGerenteLoja(user?: UserAccount): boolean {
  if (!user) return false;
  if (user.role === 'dono') return true;
  const title = (user.positionTitle || '').toLowerCase();
  return (
    title.includes('diretor') ||
    title.includes('dono') ||
    title.includes('proprietário') ||
    title.includes('gerente de vendas') ||
    title.includes('gerente de marketing') ||
    title.includes('auxiliar administrativo')
  );
}

/**
 * Regra: Download de Documentos e Comprovantes
 * - Atendente: NÃO pode baixar nenhum comprovante ou espelho do dia.
 * - Gerente de Loja: NÃO faz download de nenhum documento.
 * - Demais cargos acima de Gerente de Loja: PODEM baixar arquivos e documentos.
 */
export function canDownloadDocuments(user?: UserAccount): boolean {
  if (!user) return false;
  if (isAtendente(user)) return false;
  if (isGerenteLoja(user)) return false;
  return isCargoAcimaDeGerenteLoja(user);
}

/**
 * Regra: Anexar Atestados Médicos
 * - Atendente: Apenas consulta (NÃO pode anexar).
 * - Gerente de Loja e cargos acima: PODEM anexar atestados.
 */
export function canAttachCertificates(user?: UserAccount): boolean {
  if (!user) return false;
  if (isAtendente(user)) return false;
  return isGerenteLoja(user) || isCargoAcimaDeGerenteLoja(user);
}

/**
 * Regra: Restrição à respectiva loja
 * - Gerente de loja: consulta e anexa apenas da sua respectiva loja.
 * - Cargos acima de Gerente de Loja (com hasAccessToAllStores ou role dono): acesso a todas as lojas.
 */
export function isRestrictedToOwnStore(user?: UserAccount): boolean {
  if (!user) return false;
  if (user.hasAccessToAllStores || user.storeId === 'all' || user.role === 'dono') return false;
  return isGerenteLoja(user) || isAtendente(user);
}
