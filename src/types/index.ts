/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TipoTransacao = 'RECEITA' | 'DESPESA';
export type NaturezaTransacao = 'FIXA' | 'VARIAVEL' | 'RECORRENTE';
export type ModalidadeMeta = 'MENSAL' | 'ANUAL' | 'PERSONALIZADA' | 'SEM_PRAZO';
export type PeriodicidadeRecorrencia = 'SEMANAL' | 'MENSAL' | 'ANUAL';
export type StatusMeta = 'EM_ANDAMENTO' | 'CONCLUIDA' | 'PAUSADA';

export interface UsuarioLocal {
  id: string;
  nome: string;
  email?: string;
  pinHash: string;
  salt: string;
  perguntaRecuperacao: string;
  respostaHash: string;
  criadoEm: string;
}

export interface Categoria {
  id: string;
  userId: string;
  nome: string;
  tipo: TipoTransacao;
  icone: string;
  cor: string;
  padrao: boolean;
}

export interface Transacao {
  id: string;
  userId: string;
  tipo: TipoTransacao;
  valorCentavos: number; // Armazenado em inteiros (ex: R$ 50,25 -> 5025)
  descricao: string;
  categoriaId: string;
  data: string; // Formato ISO YYYY-MM-DD
  natureza: NaturezaTransacao;
  recorrenciaId?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Meta {
  id: string;
  userId: string;
  titulo: string;
  descricao?: string;
  modalidade: ModalidadeMeta;
  valorAlvoCentavos: number;
  dataInicio: string; // YYYY-MM-DD
  dataFim?: string; // YYYY-MM-DD (opcional para SEM_PRAZO)
  mesReferencia?: number; // 1 a 12 (para MENSAL)
  anoReferencia?: number; // ex: 2026 (para MENSAL e ANUAL)
  status: StatusMeta;
  criadoEm: string;
}

export interface ContribuicaoMeta {
  id: string;
  metaId: string;
  userId: string;
  valorCentavos: number;
  data: string;
  observacao?: string;
  criadoEm: string;
}

export interface Orcamento {
  id: string;
  userId: string;
  ano: number;
  mes: number;
  categoriaId: string | null; // null = Orçamento Geral do Mês
  limiteCentavos: number;
  alertaPercentual: number; // padrão: 80%
  criadoEm: string;
}

export interface Recorrencia {
  id: string;
  userId: string;
  descricao: string;
  valorPrevistoCentavos: number;
  categoriaId: string;
  periodicidade: PeriodicidadeRecorrencia;
  dataInicio: string;
  proximaData: string;
  dataFim?: string;
  ativo: boolean;
  criadoEm: string;
}

export interface DicaEconomia {
  id: string;
  titulo: string;
  explicacao: string;
  justificativa: string;
  acaoPratica: string;
  economiaEstimadaCentavos?: number;
  tipo: 'ALERTA' | 'OPORTUNIDADE' | 'SUCESSO' | 'INFORMATIVO';
}

export type AbaNavegacao = 'inicio' | 'lancamentos' | 'analises' | 'metas' | 'orcamento' | 'perfil';
