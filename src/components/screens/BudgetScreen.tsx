/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Layers,
  Pause,
  Play,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Tag,
  Trash2,
  X
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { PeriodicidadeRecorrencia, Recorrencia } from '../../types/index.ts';
import { formatarMoeda, obterDataHojeISO, obterNomeMes } from '../../utils/formatters.ts';

export const BudgetScreen: React.FC = () => {
  const {
    anoSelecionado,
    mesSelecionado,
    orcamentosMes,
    orcamentoGeralMes,
    gastoOrcamentoGeralCentavos,
    definirOrcamento,
    excluirOrcamento,
    categorias,
    transacoesMes,
    recorrencias,
    adicionarRecorrencia,
    editarRecorrencia,
    excluirRecorrencia,
    efetivarRecorrenciaNoMes,
  } = useFinance();

  const [abaInterna, setAbaInterna] = useState<'ORCAMENTO' | 'RECORRENCIAS'>('ORCAMENTO');

  // Modais de Orçamento
  const [modalDefinirOrcamento, setModalDefinirOrcamento] = useState<boolean>(false);
  const [catOrcamentoAlvo, setCatOrcamentoAlvo] = useState<string | null>(null);
  const [valorOrcamentoReais, setValorOrcamentoReais] = useState<string>('');

  // Modais de Recorrência
  const [modalNovaRecorrencia, setModalNovaRecorrencia] = useState<boolean>(false);
  const [recParaEditar, setRecParaEditar] = useState<Recorrencia | null>(null);
  const [recDescricao, setRecDescricao] = useState<string>('');
  const [recValorReais, setRecValorReais] = useState<string>('');
  const [recCategoriaId, setRecCategoriaId] = useState<string>('');
  const [recPeriodicidade, setRecPeriodicidade] = useState<PeriodicidadeRecorrencia>('MENSAL');
  const [msgRecorrencia, setMsgRecorrencia] = useState<string>('');

  const mapaCategorias = useMemo(() => new Map(categorias.map(c => [c.id, c])), [categorias]);
  const categoriasDespesa = useMemo(() => categorias.filter(c => c.tipo === 'DESPESA'), [categorias]);

  // Cálculos de consumo de orçamento geral
  const percentualGeral = orcamentoGeralMes
    ? Math.min(100, Math.round((gastoOrcamentoGeralCentavos / orcamentoGeralMes.limiteCentavos) * 100))
    : 0;
  const restanteGeral = orcamentoGeralMes
    ? Math.max(0, orcamentoGeralMes.limiteCentavos - gastoOrcamentoGeralCentavos)
    : 0;

  // Cálculos por categoria de despesa
  const orcamentosPorCategoria = useMemo(() => {
    return categoriasDespesa.map(cat => {
      const orc = orcamentosMes.find(o => o.categoriaId === cat.id);
      const gasto = transacoesMes
        .filter(t => t.tipo === 'DESPESA' && t.categoriaId === cat.id)
        .reduce((sum, t) => sum + t.valorCentavos, 0);

      const limite = orc ? orc.limiteCentavos : 0;
      const percentual = limite > 0 ? Math.min(100, Math.round((gasto / limite) * 100)) : 0;
      const restante = Math.max(0, limite - gasto);

      return {
        cat,
        orc,
        limite,
        gasto,
        percentual,
        restante,
      };
    });
  }, [categoriasDespesa, orcamentosMes, transacoesMes]);

  const abrirModalOrcamento = (categoriaId: string | null, limiteAtualCentavos: number = 0) => {
    setCatOrcamentoAlvo(categoriaId);
    setValorOrcamentoReais(limiteAtualCentavos > 0 ? (limiteAtualCentavos / 100).toFixed(2) : '');
    setModalDefinirOrcamento(true);
  };

  const handleSalvarOrcamento = () => {
    const num = parseFloat(valorOrcamentoReais.replace(',', '.'));
    if (isNaN(num) || num <= 0) return;
    const centavos = Math.round(num * 100);
    definirOrcamento(catOrcamentoAlvo, centavos);
    setModalDefinirOrcamento(false);
  };

  const abrirModalNovaRecorrencia = () => {
    setRecParaEditar(null);
    setRecDescricao('');
    setRecValorReais('');
    setRecPeriodicidade('MENSAL');
    const prim = categoriasDespesa[0];
    if (prim) setRecCategoriaId(prim.id);
    setModalNovaRecorrencia(true);
  };

  const handleSalvarRecorrencia = () => {
    if (!recDescricao.trim()) return;
    const num = parseFloat(recValorReais.replace(',', '.'));
    if (isNaN(num) || num <= 0) return;
    const centavos = Math.round(num * 100);

    if (recParaEditar) {
      editarRecorrencia({
        ...recParaEditar,
        descricao: recDescricao.trim(),
        valorPrevistoCentavos: centavos,
        categoriaId: recCategoriaId,
        periodicidade: recPeriodicidade,
      });
    } else {
      adicionarRecorrencia({
        descricao: recDescricao.trim(),
        valorPrevistoCentavos: centavos,
        categoriaId: recCategoriaId,
        periodicidade: recPeriodicidade,
        dataInicio: obterDataHojeISO(),
        proximaData: obterDataHojeISO(),
        ativo: true,
      });
    }

    setModalNovaRecorrencia(false);
  };

  const handleEfetivarRecorrencia = (recId: string) => {
    const res = efetivarRecorrenciaNoMes(recId);
    setMsgRecorrencia(res.mensagem);
    setTimeout(() => setMsgRecorrencia(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-[#26364A]">Orçamento & Recorrências</h1>
        <p className="text-xs sm:text-sm text-[#718096]">
          Controle tetos de despesas em {obterNomeMes(mesSelecionado)} e preveja gastos fixos
        </p>
      </div>

      {/* Seletor entre Orçamento e Recorrências */}
      <div className="max-w-md grid grid-cols-2 gap-2 p-1 bg-white rounded-2xl border border-[#DCE7F5] shadow-xs">
        <button
          onClick={() => setAbaInterna('ORCAMENTO')}
          className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            abaInterna === 'ORCAMENTO'
              ? 'bg-[#365E91] text-white shadow-xs'
              : 'text-[#718096] hover:text-[#26364A]'
          }`}
        >
          Tetos de Orçamento
        </button>
        <button
          onClick={() => setAbaInterna('RECORRENCIAS')}
          className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            abaInterna === 'RECORRENCIAS'
              ? 'bg-[#365E91] text-white shadow-xs'
              : 'text-[#718096] hover:text-[#26364A]'
          }`}
        >
          Despesas Recorrentes ({recorrencias.length})
        </button>
      </div>

      {msgRecorrencia && (
        <div className="p-3 rounded-2xl bg-emerald-50 text-[#2E7D32] text-xs font-semibold border border-emerald-200">
          {msgRecorrencia}
        </div>
      )}

      {abaInterna === 'ORCAMENTO' ? (
        <div className="space-y-4">
          {/* Card Orçamento Geral Mensal */}
          <div className="bg-white rounded-3xl p-5 border border-[#DCE7F5] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#365E91]" />
                <div>
                  <h3 className="text-sm font-bold text-[#26364A]">Orçamento Geral do Mês</h3>
                  <span className="text-[11px] text-[#718096]">
                    Teto para todas as despesas de {obterNomeMes(mesSelecionado)}
                  </span>
                </div>
              </div>
              <button
                onClick={() =>
                  abrirModalOrcamento(null, orcamentoGeralMes?.limiteCentavos || 0)
                }
                className="px-3 py-1.5 rounded-xl bg-[#DCE7F5]/60 hover:bg-[#DCE7F5] text-[#365E91] font-bold text-xs transition-colors cursor-pointer"
              >
                {orcamentoGeralMes ? 'Alterar Teto' : 'Definir Teto'}
              </button>
            </div>

            {orcamentoGeralMes ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#718096] block text-[11px]">Gasto Realizado</span>
                    <span className="font-extrabold text-[#26364A] text-sm tabular-nums">
                      {formatarMoeda(gastoOrcamentoGeralCentavos)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#718096] block text-[11px]">Teto Planejado</span>
                    <span className="font-extrabold text-[#365E91] text-sm tabular-nums">
                      {formatarMoeda(orcamentoGeralMes.limiteCentavos)}
                    </span>
                  </div>
                </div>

                <div className="w-full h-3 bg-[#F4F7FC] rounded-full overflow-hidden border border-[#DCE7F5]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      percentualGeral >= 100
                        ? 'bg-[#C62828]'
                        : percentualGeral >= 80
                        ? 'bg-[#E65100]'
                        : 'bg-[#567FB5]'
                    }`}
                    style={{ width: `${percentualGeral}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      percentualGeral >= 100
                        ? 'text-[#C62828]'
                        : percentualGeral >= 80
                        ? 'text-[#E65100]'
                        : 'text-[#2E7D32]'
                    }`}
                  >
                    {percentualGeral >= 100 ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Teto estourado em {percentualGeral - 100}%
                      </>
                    ) : (
                      <>Restam {formatarMoeda(restanteGeral)} livres</>
                    )}
                  </span>
                  <span className="text-[#718096] font-medium">{percentualGeral}% consumido</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#F4F7FC] rounded-2xl border border-[#DCE7F5] text-center text-xs text-[#718096]">
                Nenhum teto global cadastrado para {obterNomeMes(mesSelecionado)}.
              </div>
            )}
          </div>

          {/* Limites por Categoria */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#26364A]">Tetos por Categoria</span>
              <span className="text-[11px] text-[#718096]">Metas de contenção de gastos</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {orcamentosPorCategoria.map(item => (
                <div
                  key={item.cat.id}
                  className="bg-white rounded-2xl p-3.5 border border-[#DCE7F5] shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: item.cat.cor }}
                      />
                      <span className="font-bold text-[#26364A]">{item.cat.nome}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.limite > 0 ? (
                        <div className="text-right">
                          <span className="font-bold text-[#26364A] tabular-nums">
                            {formatarMoeda(item.gasto)} / {formatarMoeda(item.limite)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#718096]">
                          Gasto: {formatarMoeda(item.gasto)}
                        </span>
                      )}

                      <button
                        onClick={() => abrirModalOrcamento(item.cat.id, item.limite)}
                        className="px-2 py-1 rounded-lg bg-[#F4F7FC] text-[#365E91] font-semibold text-[11px] hover:bg-[#DCE7F5] transition-colors cursor-pointer"
                      >
                        {item.limite > 0 ? 'Editar' : '+ Definir'}
                      </button>
                    </div>
                  </div>

                  {item.limite > 0 && (
                    <div className="w-full h-2 bg-[#F4F7FC] rounded-full overflow-hidden border border-[#DCE7F5]">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.percentual >= 100
                            ? 'bg-[#C62828]'
                            : item.percentual >= 80
                            ? 'bg-[#E65100]'
                            : 'bg-[#567FB5]'
                        }`}
                        style={{ width: `${item.percentual}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Aba Recorrências (Assinaturas e Gastos Fixos) */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#26364A]">Contas Fixas e Assinaturas</span>
            <button
              onClick={abrirModalNovaRecorrencia}
              className="px-3 py-1.5 rounded-xl bg-[#365E91] text-white font-bold text-xs flex items-center gap-1 hover:bg-[#2A4D78] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Recorrência</span>
            </button>
          </div>

          {recorrencias.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recorrencias.map(rec => {
                const cat = mapaCategorias.get(rec.categoriaId);
                return (
                  <div
                    key={rec.id}
                    className="bg-white rounded-2xl p-4 border border-[#DCE7F5] shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat?.cor || '#567FB5'}20` }}
                      >
                        <RefreshCw className="w-4 h-4 text-[#365E91]" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#26364A] block">{rec.descricao}</span>
                        <div className="text-[11px] text-[#718096] flex items-center gap-1.5">
                          <span>{cat?.nome || 'Geral'}</span>
                          <span aria-hidden="true">·</span>
                          <span>{rec.periodicidade.toLowerCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-[#26364A] tabular-nums block">
                          {formatarMoeda(rec.valorPrevistoCentavos)}
                        </span>
                        <button
                          onClick={() => handleEfetivarRecorrencia(rec.id)}
                          className="text-[11px] font-bold text-[#365E91] hover:underline cursor-pointer"
                        >
                          Lançar no Mês
                        </button>
                      </div>

                      <button
                        onClick={() => excluirRecorrencia(rec.id)}
                        className="p-1.5 rounded-lg text-[#718096] hover:bg-red-50 hover:text-[#C62828] transition-colors cursor-pointer"
                        title="Excluir Recorrência"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-[#DCE7F5] text-center shadow-xs">
              <Clock className="w-10 h-10 text-[#567FB5]/50 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-[#26364A] mb-1">Nenhuma recorrência cadastrada</h3>
              <p className="text-xs text-[#718096] max-w-xs mx-auto mb-4">
                Cadastre contas de luz, aluguel, internet ou assinaturas para controle prévio sem duplicação.
              </p>
              <button
                onClick={abrirModalNovaRecorrencia}
                className="px-4 py-2 rounded-xl bg-[#365E91] text-white text-xs font-bold hover:bg-[#2A4D78] transition-colors cursor-pointer"
              >
                Adicionar Despesa Recorrente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Definir Orçamento */}
      {modalDefinirOrcamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-[#DCE7F5] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE7F5]">
              <h3 className="text-sm font-bold text-[#26364A]">
                {catOrcamentoAlvo
                  ? `Teto: ${mapaCategorias.get(catOrcamentoAlvo)?.nome}`
                  : 'Orçamento Geral do Mês'}
              </h3>
              <button onClick={() => setModalDefinirOrcamento(false)} className="text-[#718096]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1">
                Limite Mensal Máximo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                autoFocus
                value={valorOrcamentoReais}
                onChange={e => setValorOrcamentoReais(e.target.value)}
                placeholder="Ex: 1500,00"
                className="w-full px-3.5 py-3 rounded-2xl bg-white border border-[#DCE7F5] text-base font-bold text-[#365E91] focus:outline-none focus:border-[#365E91]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalDefinirOrcamento(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#DCE7F5] text-xs font-semibold text-[#718096] hover:bg-[#F4F7FC] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarOrcamento}
                className="flex-1 py-2.5 rounded-xl bg-[#365E91] text-white text-xs font-bold hover:bg-[#2A4D78] transition-colors cursor-pointer"
              >
                Salvar Limite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Recorrência */}
      {modalNovaRecorrencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-[#DCE7F5] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE7F5]">
              <h3 className="text-sm font-bold text-[#26364A]">Nova Despesa Recorrente</h3>
              <button onClick={() => setModalNovaRecorrencia(false)} className="text-[#718096]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1">Descrição</label>
              <input
                type="text"
                value={recDescricao}
                onChange={e => setRecDescricao(e.target.value)}
                placeholder="Ex: Internet fibra, Aluguel, Netflix..."
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#DCE7F5] text-xs text-[#26364A] focus:outline-none focus:border-[#365E91]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1">Valor Previsto (R$)</label>
              <input
                type="number"
                step="0.01"
                value={recValorReais}
                onChange={e => setRecValorReais(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#DCE7F5] text-sm font-bold text-[#26364A] focus:outline-none focus:border-[#365E91]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1">Categoria</label>
              <select
                value={recCategoriaId}
                onChange={e => setRecCategoriaId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7F5] text-xs text-[#26364A] focus:outline-none focus:border-[#365E91]"
              >
                {categoriasDespesa.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1">Frequência</label>
              <select
                value={recPeriodicidade}
                onChange={e => setRecPeriodicidade(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7F5] text-xs text-[#26364A] focus:outline-none focus:border-[#365E91]"
              >
                <option value="MENSAL">Mensal</option>
                <option value="SEMANAL">Semanal</option>
                <option value="ANUAL">Anual</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalNovaRecorrencia(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#DCE7F5] text-xs font-semibold text-[#718096] hover:bg-[#F4F7FC] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarRecorrencia}
                className="flex-1 py-2.5 rounded-xl bg-[#365E91] text-white text-xs font-bold hover:bg-[#2A4D78] transition-colors cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
