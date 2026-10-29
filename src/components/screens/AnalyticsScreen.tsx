/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Filter,
  PieChart,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatarDataBR, formatarMoeda, obterNomeMesCurto } from '../../utils/formatters.ts';

export const AnalyticsScreen: React.FC = () => {
  const {
    transacoes,
    categorias,
    anoSelecionado,
    mesSelecionado,
  } = useFinance();

  const [periodoFiltro, setPeriodoFiltro] = useState<'MES_ATUAL' | 'ULTIMOS_3' | 'ULTIMOS_6' | 'ANO_ATUAL'>('MES_ATUAL');
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState<string | null>(null);

  const mapaCategorias = useMemo(() => new Map(categorias.map(c => [c.id, c])), [categorias]);

  // Transações do mês atual e anterior para comparação de tendências
  const mesAtualStr = String(mesSelecionado).padStart(2, '0');
  const prefixoMesAtual = `${anoSelecionado}-${mesAtualStr}`;

  let mesAntNum = mesSelecionado - 1;
  let anoAntNum = anoSelecionado;
  if (mesAntNum === 0) {
    mesAntNum = 12;
    anoAntNum -= 1;
  }
  const prefixoMesAnt = `${anoAntNum}-${String(mesAntNum).padStart(2, '0')}`;

  const despesasMesAtual = useMemo(() => {
    return transacoes.filter(t => t.tipo === 'DESPESA' && t.data.startsWith(prefixoMesAtual));
  }, [transacoes, prefixoMesAtual]);

  const despesasMesAnterior = useMemo(() => {
    return transacoes.filter(t => t.tipo === 'DESPESA' && t.data.startsWith(prefixoMesAnt));
  }, [transacoes, prefixoMesAnt]);

  // Total das despesas do período selecionado para o Donut
  const totalDespesasCentavos = useMemo(() => {
    return despesasMesAtual.reduce((sum, t) => sum + t.valorCentavos, 0);
  }, [despesasMesAtual]);

  // Agrupamento por Categoria para o Gráfico de Rosca
  const dadosCategorias = useMemo(() => {
    const mapa = new Map<string, number>();
    despesasMesAtual.forEach(t => {
      const atual = mapa.get(t.categoriaId) || 0;
      mapa.set(t.categoriaId, atual + t.valorCentavos);
    });

    const itens = Array.from(mapa.entries()).map(([catId, totalCentavos]) => {
      const cat = mapaCategorias.get(catId);
      const percentual = totalDespesasCentavos > 0
        ? Math.round((totalCentavos / totalDespesasCentavos) * 100)
        : 0;
      return {
        catId,
        nome: cat ? cat.nome : 'Outros',
        cor: cat ? cat.cor : '#718096',
        totalCentavos,
        percentual,
      };
    });

    return itens.sort((a, b) => b.totalCentavos - a.totalCentavos);
  }, [despesasMesAtual, totalDespesasCentavos, mapaCategorias]);

  // Dados para o Gráfico de Barras Mensais (Últimos 6 Meses)
  const dadosHistoricoMensal = useMemo(() => {
    const resultado = [];
    const hoje = new Date(anoSelecionado, mesSelecionado - 1, 1);

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const a = d.getFullYear();
      const m = d.getMonth() + 1;
      const prefixo = `${a}-${String(m).padStart(2, '0')}`;

      const txMes = transacoes.filter(t => t.data.startsWith(prefixo));
      const rec = txMes
        .filter(t => t.tipo === 'RECEITA')
        .reduce((sum, t) => sum + t.valorCentavos, 0);
      const desp = txMes
        .filter(t => t.tipo === 'DESPESA')
        .reduce((sum, t) => sum + t.valorCentavos, 0);

      resultado.push({
        rotulo: `${obterNomeMesCurto(m)}/${String(a).slice(2)}`,
        receitasCentavos: rec,
        despesasCentavos: desp,
      });
    }

    return resultado;
  }, [transacoes, anoSelecionado, mesSelecionado]);

  // Maior valor histórico para normalizar as barras
  const maxValorMensal = useMemo(() => {
    let max = 1;
    dadosHistoricoMensal.forEach(d => {
      if (d.receitasCentavos > max) max = d.receitasCentavos;
      if (d.despesasCentavos > max) max = d.despesasCentavos;
    });
    return max;
  }, [dadosHistoricoMensal]);

  // Lançamentos filtrados da categoria selecionada no gráfico
  const transacoesCategoriaSelecionada = useMemo(() => {
    if (!categoriaSelecionadaId) return [];
    return despesasMesAtual.filter(t => t.categoriaId === categoriaSelecionadaId);
  }, [despesasMesAtual, categoriaSelecionadaId]);

  // Variação por categoria (Mês Atual vs Mês Anterior)
  const variacoesCategorias = useMemo(() => {
    const mapaAtual = new Map<string, number>();
    const mapaAnt = new Map<string, number>();

    despesasMesAtual.forEach(t => {
      mapaAtual.set(t.categoriaId, (mapaAtual.get(t.categoriaId) || 0) + t.valorCentavos);
    });

    despesasMesAnterior.forEach(t => {
      mapaAnt.set(t.categoriaId, (mapaAnt.get(t.categoriaId) || 0) + t.valorCentavos);
    });

    const todasCatIds = Array.from(new Set([...mapaAtual.keys(), ...mapaAnt.keys()]));
    const lista = todasCatIds.map(catId => {
      const vAtual = mapaAtual.get(catId) || 0;
      const vAnt = mapaAnt.get(catId) || 0;
      const delta = vAtual - vAnt;
      let percentual = 0;
      if (vAnt > 0) {
        percentual = Math.round((delta / vAnt) * 100);
      } else if (vAtual > 0) {
        percentual = 100;
      }
      const cat = mapaCategorias.get(catId);
      return {
        catId,
        nome: cat ? cat.nome : 'Outros',
        cor: cat ? cat.cor : '#567FB5',
        vAtual,
        vAnt,
        delta,
        percentual,
      };
    });

    return lista.filter(item => item.vAtual > 0 || item.vAnt > 0).sort((a, b) => b.delta - a.delta);
  }, [despesasMesAtual, despesasMesAnterior, mapaCategorias]);

  // Cálculo dos arcos do Donut SVG
  const arcosDonut = useMemo(() => {
    let anguloAcumulado = 0;
    const raio = 70;
    const centro = 100;

    return dadosCategorias.map(d => {
      const proporcao = totalDespesasCentavos > 0 ? d.totalCentavos / totalDespesasCentavos : 0;
      const angulo = proporcao * 360;

      const inicioAngulo = anguloAcumulado;
      const fimAngulo = anguloAcumulado + angulo;
      anguloAcumulado += angulo;

      const radInicio = (inicioAngulo - 90) * (Math.PI / 180);
      const radFim = (fimAngulo - 90) * (Math.PI / 180);

      const x1 = centro + raio * Math.cos(radInicio);
      const y1 = centro + raio * Math.sin(radInicio);
      const x2 = centro + raio * Math.cos(radFim);
      const y2 = centro + raio * Math.sin(radFim);

      const grandeArco = angulo > 180 ? 1 : 0;

      // Se for 100% de uma única categoria
      const pathD =
        proporcao >= 0.999
          ? `M ${centro} ${centro - raio} A ${raio} ${raio} 0 1 1 ${centro - 0.01} ${centro - raio} Z`
          : `M ${centro} ${centro} L ${x1} ${y1} A ${raio} ${raio} 0 ${grandeArco} 1 ${x2} ${y2} Z`;

      return {
        ...d,
        pathD,
      };
    });
  }, [dadosCategorias, totalDespesasCentavos]);

  return (
    <div className="flex-1 pb-24 px-4 pt-3 space-y-4">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-lg font-bold text-[#26364A]">Análises Financeiras</h1>
        <p className="text-xs text-[#718096]">
          Visão gráfica das despesas, comparativos e evolução temporal
        </p>
      </div>

      {/* Gráfico 1: Despesas por Categoria (Donut Interativo) */}
      <div className="bg-white rounded-3xl p-5 border border-[#DCE7F5] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#365E91]" />
            <span className="text-xs font-bold text-[#26364A]">Despesas por Categoria</span>
          </div>
          <span className="text-xs font-semibold text-[#718096]">
            Total: {formatarMoeda(totalDespesasCentavos)}
          </span>
        </div>

        {totalDespesasCentavos > 0 ? (
          <div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
              {/* Gráfico SVG Donut */}
              <div className="relative w-44 h-44 shrink-0">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-0">
                  {arcosDonut.map(arco => (
                    <path
                      key={arco.catId}
                      d={arco.pathD}
                      fill={arco.cor}
                      className="cursor-pointer transition-transform hover:opacity-90 active:scale-95"
                      onClick={() =>
                        setCategoriaSelecionadaId(prev => (prev === arco.catId ? null : arco.catId))
                      }
                    />
                  ))}
                  {/* Furo central do Donut */}
                  <circle cx="100" cy="100" r="46" fill="#FFFFFF" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] text-[#718096] uppercase font-semibold">Despesas</span>
                  <span className="text-xs font-extrabold text-[#26364A] tabular-nums">
                    {formatarMoeda(totalDespesasCentavos, false)}
                  </span>
                </div>
              </div>

              {/* Legenda Lateral Interativa */}
              <div className="w-full sm:w-auto flex-1 max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {dadosCategorias.map(item => {
                  const ativa = categoriaSelecionadaId === item.catId;
                  return (
                    <button
                      key={item.catId}
                      onClick={() =>
                        setCategoriaSelecionadaId(prev => (prev === item.catId ? null : item.catId))
                      }
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                        ativa
                          ? 'bg-[#DCE7F5]/50 border border-[#365E91] font-bold'
                          : 'hover:bg-[#F4F7FC] text-[#26364A]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.cor }} />
                        <span className="truncate">{item.nome}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-[#718096]">{item.percentual}%</span>
                        <span className="font-semibold tabular-nums">{formatarMoeda(item.totalCentavos)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Listagem de Lançamentos da Categoria Selecionada */}
            {categoriaSelecionadaId && (
              <div className="mt-3 pt-3 border-t border-[#DCE7F5] space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#26364A]">
                    Lançamentos de &ldquo;{mapaCategorias.get(categoriaSelecionadaId)?.nome}&rdquo;
                  </span>
                  <button
                    onClick={() => setCategoriaSelecionadaId(null)}
                    className="text-[11px] text-[#365E91] hover:underline cursor-pointer"
                  >
                    Fechar filtro
                  </button>
                </div>
                <div className="divide-y divide-[#DCE7F5] bg-[#F4F7FC] rounded-2xl p-2 max-h-36 overflow-y-auto">
                  {transacoesCategoriaSelecionada.map(t => (
                    <div key={t.id} className="py-1.5 px-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-[#26364A] block">{t.descricao}</span>
                        <span className="text-[10px] text-[#718096]">{formatarDataBR(t.data)}</span>
                      </div>
                      <span className="font-bold text-[#26364A] tabular-nums">
                        {formatarMoeda(t.valorCentavos)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-[#718096]">
            Nenhuma despesa registrada para o período selecionado.
          </div>
        )}
      </div>

      {/* Gráfico 2: Evolução Mensal (Barras Comparativas) */}
      <div className="bg-white rounded-3xl p-5 border border-[#DCE7F5] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#365E91]" />
            <span className="text-xs font-bold text-[#26364A]">Evolução Financeira (Últimos 6 Meses)</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
              <span className="text-[#718096]">Receitas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#C62828]" />
              <span className="text-[#718096]">Despesas</span>
            </div>
          </div>
        </div>

        {/* Barras Lado a Lado */}
        <div className="h-44 pt-6 flex items-end justify-between gap-2 border-b border-[#DCE7F5] pb-2">
          {dadosHistoricoMensal.map((item, idx) => {
            const alturaRec = Math.max(4, Math.round((item.receitasCentavos / maxValorMensal) * 120));
            const alturaDesp = Math.max(4, Math.round((item.despesasCentavos / maxValorMensal) * 120));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-32">
                  {/* Barra Receita */}
                  <div
                    className="w-3 bg-[#2E7D32] rounded-t-md transition-all hover:opacity-85"
                    style={{ height: `${alturaRec}px` }}
                    title={`Receitas: ${formatarMoeda(item.receitasCentavos)}`}
                  />
                  {/* Barra Despesa */}
                  <div
                    className="w-3 bg-[#C62828] rounded-t-md transition-all hover:opacity-85"
                    style={{ height: `${alturaDesp}px` }}
                    title={`Despesas: ${formatarMoeda(item.despesasCentavos)}`}
                  />
                </div>
                <span className="text-[10px] text-[#718096] font-semibold mt-1">
                  {item.rotulo}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráfico 3: Comparativo de Variação de Gastos por Categoria */}
      <div className="bg-white rounded-3xl p-5 border border-[#DCE7F5] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#365E91]" />
            <span className="text-xs font-bold text-[#26364A]">Variação em Relação ao Mês Anterior</span>
          </div>
        </div>

        {variacoesCategorias.length > 0 ? (
          <div className="space-y-2">
            {variacoesCategorias.slice(0, 4).map(item => (
              <div
                key={item.catId}
                className="p-3 bg-[#F4F7FC] rounded-2xl border border-[#DCE7F5]/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }} />
                  <div>
                    <span className="font-bold text-[#26364A] block">{item.nome}</span>
                    <span className="text-[11px] text-[#718096]">
                      {formatarMoeda(item.vAtual)} vs {formatarMoeda(item.vAnt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.delta > 0 ? (
                    <span className="font-extrabold text-[#C62828] flex items-center gap-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      +{item.percentual}%
                    </span>
                  ) : item.delta < 0 ? (
                    <span className="font-extrabold text-[#2E7D32] flex items-center gap-0.5">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      {item.percentual}%
                    </span>
                  ) : (
                    <span className="text-[#718096] font-semibold">0%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-[#718096]">
            Dados insuficientes para calcular variações entre meses.
          </div>
        )}
      </div>
    </div>
  );
};
