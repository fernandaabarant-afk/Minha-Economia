/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formata um valor em centavos inteiros para a representação em Real Brasileiro (BRL)
 * Exemplo: 125050 -> "R$ 1.250,50"
 */
export function formatarMoeda(centavos: number, incluirSimbolo: boolean = true): string {
  const valorReais = centavos / 100;
  const formatado = valorReais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return incluirSimbolo ? `R$ ${formatado}` : formatado;
}

/**
 * Converte valor em reais para centavos inteiros com arredondamento seguro
 */
export function reaisParaCentavos(valor: number): number {
  return Math.round(valor * 100);
}

/**
 * Converte centavos inteiros para valor em reais
 */
export function centavosParaReais(centavos: number): number {
  return centavos / 100;
}

/**
 * Formata data ISO (YYYY-MM-DD) para padrão brasileiro (DD/MM/AAAA)
 */
export function formatarDataBR(dataISO: string): string {
  if (!dataISO) return '';
  const partes = dataISO.split('-');
  if (partes.length !== 3) return dataISO;
  const [ano, mes, dia] = partes;
  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
}

/**
 * Formata data ISO para exibição amigável: "15 de Outubro"
 */
export function formatarDataAmigavel(dataISO: string): string {
  if (!dataISO) return '';
  const partes = dataISO.split('-');
  if (partes.length !== 3) return dataISO;
  const [ano, mes, dia] = partes;
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const nomeMes = meses[parseInt(mes, 10) - 1] || '';
  return `${parseInt(dia, 10)} de ${nomeMes} de ${ano}`;
}

/**
 * Retorna o nome por extenso do mês brasileiro (1 a 12)
 */
export function obterNomeMes(mes: number): string {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return meses[mes - 1] || '';
}

/**
 * Retorna o nome curto do mês brasileiro (1 a 12)
 */
export function obterNomeMesCurto(mes: number): string {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return meses[mes - 1] || '';
}

/**
 * Retorna a data de hoje no formato ISO YYYY-MM-DD considerando fuso local
 */
export function obterDataHojeISO(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Calcula a quantidade de dias restantes até uma data alvo ISO
 */
export function calcularDiasRestantes(dataAlvoISO: string): number {
  if (!dataAlvoISO) return 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [ano, mes, dia] = dataAlvoISO.split('-').map(Number);
  const alvo = new Date(ano, mes - 1, dia);

  const diferencaMs = alvo.getTime() - hoje.getTime();
  const dias = Math.ceil(diferencaMs / (1000 * 60 * 60 * 24));
  return Math.max(0, dias);
}
