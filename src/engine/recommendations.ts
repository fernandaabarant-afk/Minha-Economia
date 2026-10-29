/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Categoria, DicaEconomia, Meta, Orcamento, Recorrencia, Transacao } from '../types/index.ts';
import { formatarMoeda, obterNomeMes } from '../utils/formatters.ts';

interface ParametrosRecomendacao {
  transacoesMesAtual: Transacao[];
  transacoesMesAnterior: Transacao[];
  categorias: Categoria[];
  metas: Meta[];
  orcamentos: Orcamento[];
  recorrencias: Recorrencia[];
  mesAtual: number;
  anoAtual: number;
}

/**
 * Motor Determinístico de Recomendações Financeiras (100% Local no Aparelho)
 * Não utiliza IA externa nem consome APIs de rede.
 */
export function gerarDicasDeterministicas(params: ParametrosRecomendacao): DicaEconomia[] {
  const {
    transacoesMesAtual,
    transacoesMesAnterior,
    categorias,
    metas,
    orcamentos,
    recorrencias,
    mesAtual,
  } = params;

  const dicas: DicaEconomia[] = [];
  const mapaCategorias = new Map<string, Categoria>(categorias.map(c => [c.id, c]));

  // Totais do mês atual
  const receitasMesAtual = transacoesMesAtual
    .filter(t => t.tipo === 'RECEITA')
    .reduce((acc, t) => acc + t.valorCentavos, 0);

  const despesasMesAtual = transacoesMesAtual
    .filter(t => t.tipo === 'DESPESA')
    .reduce((acc, t) => acc + t.valorCentavos, 0);

  // 1. Verificação de volume de dados
  if (transacoesMesAtual.length === 0) {
    return [
      {
        id: 'dica_inicio',
        titulo: 'Comece registrando seus lançamentos',
        explicacao: 'Suas recomendações de economia serão geradas automaticamente assim que você registrar suas primeiras receitas e despesas.',
        justificativa: 'Nenhum lançamento foi registrado para este mês ainda.',
        acaoPratica: 'Toque no botão "+" para adicionar sua primeira receita ou despesa.',
        tipo: 'INFORMATIVO',
      },
    ];
  }

  // 2. Alerta de Déficit no Mês
  if (despesasMesAtual > receitasMesAtual && receitasMesAtual > 0) {
    const deficitCentavos = despesasMesAtual - receitasMesAtual;
    dicas.push({
      id: 'alerta_deficit',
      titulo: 'Atenção: Despesas superando receitas',
      explicacao: `Neste mês, suas despesas ultrapassaram as receitas em ${formatarMoeda(deficitCentavos)}. Vale a pena revisar gastos não essenciais antes do fechamento.`,
      justificativa: `Receitas: ${formatarMoeda(receitasMesAtual)} | Despesas: ${formatarMoeda(despesasMesAtual)}.`,
      acaoPratica: 'Analise a aba Lançamentos e identifique despesas variáveis que podem ser adiadas.',
      tipo: 'ALERTA',
    });
  }

  // 3. Regra de Orçamento Próximo do Limite ou Estourado
  orcamentos.forEach(orc => {
    let gastoCentavos = 0;
    let nomeAlvo = 'Geral do Mês';

    if (orc.categoriaId) {
      const cat = mapaCategorias.get(orc.categoriaId);
      nomeAlvo = cat ? cat.nome : 'Categoria';
      gastoCentavos = transacoesMesAtual
        .filter(t => t.tipo === 'DESPESA' && t.categoriaId === orc.categoriaId)
        .reduce((acc, t) => acc + t.valorCentavos, 0);
    } else {
      gastoCentavos = despesasMesAtual;
    }

    const percentualGasto = Math.round((gastoCentavos / orc.limiteCentavos) * 100);

    if (percentualGasto >= 100) {
      dicas.push({
        id: `orc_estourado_${orc.id}`,
        titulo: `Orçamento de ${nomeAlvo} excedido`,
        explicacao: `Você atingiu ${percentualGasto}% do teto definido (${formatarMoeda(gastoCentavos)} de ${formatarMoeda(orc.limiteCentavos)}).`,
        justificativa: `Limite planejado: ${formatarMoeda(orc.limiteCentavos)} | Consumo real: ${formatarMoeda(gastoCentavos)}.`,
        acaoPratica: 'Suspenda novas compras nessa categoria até a virada do próximo mês.',
        tipo: 'ALERTA',
      });
    } else if (percentualGasto >= orc.alertaPercentual) {
      const saldoRestante = orc.limiteCentavos - gastoCentavos;
      dicas.push({
        id: `orc_alerta_${orc.id}`,
        titulo: `Atenção ao orçamento de ${nomeAlvo}`,
        explicacao: `Você já consumiu ${percentualGasto}% do limite planejado para este mês. Restam apenas ${formatarMoeda(saldoRestante)}.`,
        justificativa: `Consumido: ${formatarMoeda(gastoCentavos)} de ${formatarMoeda(orc.limiteCentavos)}.`,
        acaoPratica: `Tente limitar os próximos gastos diários em ${nomeAlvo} para não ultrapassar a margem restante.`,
        tipo: 'OPORTUNIDADE',
      });
    }
  });

  // 4. Comparação de Categorias com o Mês Anterior (Aumento >= 15%)
  if (transacoesMesAnterior.length > 0) {
    const gastosPorCategoriaAtual = new Map<string, number>();
    const gastosPorCategoriaAnterior = new Map<string, number>();

    transacoesMesAtual
      .filter(t => t.tipo === 'DESPESA')
      .forEach(t => {
        const atual = gastosPorCategoriaAtual.get(t.categoriaId) || 0;
        gastosPorCategoriaAtual.set(t.categoriaId, atual + t.valorCentavos);
      });

    transacoesMesAnterior
      .filter(t => t.tipo === 'DESPESA')
      .forEach(t => {
        const anterior = gastosPorCategoriaAnterior.get(t.categoriaId) || 0;
        gastosPorCategoriaAnterior.set(t.categoriaId, anterior + t.valorCentavos);
      });

    gastosPorCategoriaAtual.forEach((gastoAtual, catId) => {
      const gastoAnterior = gastosPorCategoriaAnterior.get(catId) || 0;
      if (gastoAnterior > 1000) { // Apenas se o gasto anterior for relevante (> R$ 10,00)
        const variacao = ((gastoAtual - gastoAnterior) / gastoAnterior) * 100;
        if (variacao >= 20) {
          const cat = mapaCategorias.get(catId);
          const aumentoCentavos = gastoAtual - gastoAnterior;
          dicas.push({
            id: `aumento_cat_${catId}`,
            titulo: `Aumento em ${cat ? cat.nome : 'Categoria'}`,
            explicacao: `Os gastos nesta categoria aumentaram ${Math.round(variacao)}% em relação ao mês anterior (+${formatarMoeda(aumentoCentavos)}).`,
            justificativa: `Mês anterior: ${formatarMoeda(gastoAnterior)} | Mês atual: ${formatarMoeda(gastoAtual)}.`,
            acaoPratica: 'Verifique no extrato se houve despesas pontuais ou se há oportunidade de corte de despesas recorrentes.',
            economiaEstimadaCentavos: aumentoCentavos,
            tipo: 'OPORTUNIDADE',
          });
        }
      }
    });
  }

  // 5. Impacto Anual de Assinaturas e Despesas Recorrentes
  const recorrenciasAtivas = recorrencias.filter(r => r.ativo);
  if (recorrenciasAtivas.length >= 2) {
    let custoMensalEstimado = 0;
    recorrenciasAtivas.forEach(r => {
      if (r.periodicidade === 'MENSAL') custoMensalEstimado += r.valorPrevistoCentavos;
      else if (r.periodicidade === 'SEMANAL') custoMensalEstimado += r.valorPrevistoCentavos * 4;
      else if (r.periodicidade === 'ANUAL') custoMensalEstimado += Math.round(r.valorPrevistoCentavos / 12);
    });

    const impactoAnual = custoMensalEstimado * 12;
    dicas.push({
      id: 'dica_recorrencias',
      titulo: 'Impacto anual de serviços e assinaturas fixas',
      explicacao: `Suas ${recorrenciasAtivas.length} despesas recorrentes ativas somam aproximadamente ${formatarMoeda(impactoAnual)} por ano (${formatarMoeda(custoMensalEstimado)}/mês).`,
      justificativa: `${recorrenciasAtivas.length} assinaturas e despesas fixas cadastradas.`,
      acaoPratica: 'Revise se você utiliza todos os serviços cadastrados ou se planos familiares/anuais seriam mais vantajosos.',
      tipo: 'INFORMATIVO',
    });
  }

  // 6. Superávit Disponível para Acelerar Metas
  const superavitMes = receitasMesAtual - despesasMesAtual;
  const metasEmAndamento = metas.filter(m => m.status === 'EM_ANDAMENTO');

  if (superavitMes > 5000 && metasEmAndamento.length > 0) { // Se houver mais de R$ 50 de sobra
    const primeiraMeta = metasEmAndamento[0];
    const aporteSugerido = Math.round(superavitMes * 0.4); // Sugere poupar 40% da sobra

    dicas.push({
      id: `dica_meta_superavit_${primeiraMeta.id}`,
      titulo: `Oportunidade para sua meta "${primeiraMeta.titulo}"`,
      explicacao: `Você possui um saldo positivo de ${formatarMoeda(superavitMes)} em ${obterNomeMes(mesAtual)}. Que tal destinar uma parte para sua meta?`,
      justificativa: `Superávit do mês atual: ${formatarMoeda(superavitMes)}.`,
      acaoPratica: `Fazer um aporte de ${formatarMoeda(aporteSugerido)} para aproximar a conclusão da meta.`,
      economiaEstimadaCentavos: aporteSugerido,
      tipo: 'SUCESSO',
    });
  }

  // Se após as regras nenhuma dica específica tiver disparado
  if (dicas.length === 0) {
    dicas.push({
      id: 'dica_disciplina',
      titulo: 'Parabéns pela disciplina financeira',
      explicacao: 'Suas receitas cobrem as despesas registradas e seus orçamentos continuam sob controle neste período.',
      justificativa: `Saldo positivo no mês de ${obterNomeMes(mesAtual)}.`,
      acaoPratica: 'Mantenha o registro contínuo dos gastos para preservar o controle orçamentário.',
      tipo: 'SUCESSO',
    });
  }

  return dicas;
}
