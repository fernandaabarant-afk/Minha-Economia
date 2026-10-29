/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  PiggyBank,
  ReceiptText,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react';
import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useFinance } from '../../context/FinanceContext.tsx';
import { AbaNavegacao, TipoTransacao, Transacao } from '../../types/index.ts';
import {
  formatarDataBR,
  formatarMoeda,
  obterNomeMes
} from '../../utils/formatters.ts';

interface HomeScreenProps {
  onNavegarParaAba: (aba: AbaNavegacao) => void;
  onAbrirLancamento: (tipo: TipoTransacao) => void;
  onEditarLancamento: (transacao: Transacao) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavegarParaAba,
  onAbrirLancamento,
  onEditarLancamento,
}) => {
  const { usuario } = useAuth();
  const {
    anoSelecionado,
    mesSelecionado,
    avancarMes,
    voltarMes,
    saldoTotalDisponivelCentavos,
    saldoBrutoAcumuladoCentavos,
    totalReservadoMetasCentavos,
    receitasMesCentavos,
    despesasMesCentavos,
    resultadoMesCentavos,
    transacoes,
    transacoesMes,
    categorias,
    orcamentoGeralMes,
    gastoOrcamentoGeralCentavos,
    metas,
    obterTotalAportadoMeta,
    dicas,
    carregarDadosExemplo,
  } = useFinance();

  const mapaCategorias = new Map(categorias.map(c => [c.id, c]));
  const ultimasTransacoes = transacoesMes.slice(0, 6);

  // Primeira dica em destaque
  const dicaPrincipal = dicas.length > 0 ? dicas[0] : null;

  // Cálculo do percentual do orçamento geral
  const percentualOrcamento = orcamentoGeralMes
    ? Math.min(100, Math.round((gastoOrcamentoGeralCentavos / orcamentoGeralMes.limiteCentavos) * 100))
    : 0;

  // Metas ativas
  const metasAtivas = metas.filter(m => m.status === 'EM_ANDAMENTO');

  return (
    <div className="space-y-6">
      {/* Barra de Período e Saudação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-[#DCE7F5] shadow-xs">
        <div>
          <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider block">
            Painel Geral
          </span>
          <h1 className="text-lg sm:text-xl font-bold text-[#26364A]">
            Olá, {usuario?.nome || 'Usuário'}
          </h1>
        </div>

        {/* Navegação entre Meses */}
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-[#F4F7FC] px-3 py-1.5 rounded-2xl border border-[#DCE7F5]">
          <button
            onClick={voltarMes}
            className="p-1 rounded-lg text-[#718096] hover:bg-white hover:text-[#26364A] transition-colors cursor-pointer"
            title="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-2">
            <Calendar className="w-4 h-4 text-[#365E91]" />
            <span className="text-xs sm:text-sm font-bold text-[#26364A]">
              {obterNomeMes(mesSelecionado)} de {anoSelecionado}
            </span>
          </div>
          <button
            onClick={avancarMes}
            className="p-1 rounded-lg text-[#718096] hover:bg-white hover:text-[#26364A] transition-colors cursor-pointer"
            title="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Banner de Demonstração quando não houver transações */}
      {transacoes.length === 0 && (
        <div className="bg-[#DCE7F5]/50 border border-[#567FB5]/40 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="text-xs">
            <span className="font-bold text-[#365E91] text-sm block">
              Deseja iniciar com lançamentos de demonstração?
            </span>
            <span className="text-[#718096] text-xs">
              Carrega transações em reais, 4 modalidades de metas e orçamentos para testar os gráficos e motor determinístico imediatamente.
            </span>
          </div>
          <button
            onClick={carregarDadosExemplo}
            className="px-4 py-2 rounded-xl bg-[#365E91] text-white text-xs font-bold hover:bg-[#2A4D78] transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            Carregar Dados de Exemplo
          </button>
        </div>
      )}

      {/* Grid Principal: 2 Colunas no Desktop / 1 Coluna no Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* COLUNA ESQUERDA: Saldo, Métricas, Ações Rápidas, Dicas   */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4">
          {/* Cartão de Saldo Consolidado */}
          <div className="bg-gradient-to-br from-[#365E91] to-[#567FB5] rounded-3xl p-6 text-white shadow-lg shadow-[#365E91]/25 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#DCE7F5]">
                Saldo Disponível Livre
              </span>
              <div className="p-2 rounded-full bg-white/15">
                <Wallet className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight mb-4">
              {formatarMoeda(saldoTotalDisponivelCentavos)}
            </div>

            {/* Separação Transparente entre Saldo Livre e Metas */}
            <div className="pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[#DCE7F5] block text-[11px]">Total Acumulado</span>
                <span className="font-semibold tabular-nums text-white text-sm">
                  {formatarMoeda(saldoBrutoAcumuladoCentavos)}
                </span>
              </div>
              <div>
                <span className="text-[#DCE7F5] block text-[11px]">Reservado em Metas</span>
                <span className="font-semibold tabular-nums text-[#DCE7F5] text-sm">
                  {formatarMoeda(totalReservadoMetasCentavos)}
                </span>
              </div>
            </div>
          </div>

          {/* Indicadores do Mês (Receitas vs Despesas) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-[#DCE7F5] shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#718096]">Receitas</span>
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-[#2E7D32] flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg font-bold text-[#2E7D32] tabular-nums">
                {formatarMoeda(receitasMesCentavos)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#DCE7F5] shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#718096]">Despesas</span>
                <div className="w-6 h-6 rounded-full bg-red-50 text-[#C62828] flex items-center justify-center">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg font-bold text-[#C62828] tabular-nums">
                {formatarMoeda(despesasMesCentavos)}
              </div>
            </div>
          </div>

          {/* Resultado do Período */}
          <div className="bg-white px-4 py-3.5 rounded-2xl border border-[#DCE7F5] shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {resultadoMesCentavos >= 0 ? (
                <div className="w-8 h-8 rounded-full bg-emerald-100/70 text-[#2E7D32] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-100/70 text-[#C62828] flex items-center justify-center shrink-0">
                  <TrendingDown className="w-4 h-4" />
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-[#26364A] block">
                  Resultado de {obterNomeMes(mesSelecionado)}
                </span>
                <span className="text-[11px] text-[#718096]">
                  {resultadoMesCentavos >= 0 ? 'Superávit no período' : 'Déficit no período'}
                </span>
              </div>
            </div>
            <span
              className={`text-sm font-extrabold tabular-nums ${
                resultadoMesCentavos >= 0 ? 'text-[#2E7D32]' : 'text-[#C62828]'
              }`}
            >
              {resultadoMesCentavos >= 0 ? '+' : ''}
              {formatarMoeda(resultadoMesCentavos)}
            </span>
          </div>

          {/* Botões Rápidos de Ação (+ Receita e + Despesa) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onAbrirLancamento('RECEITA')}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-[#DCE7F5] text-[#2E7D32] hover:bg-emerald-50/50 shadow-xs active:scale-98 transition-all font-semibold text-xs cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              <span>+ Nova Receita</span>
            </button>

            <button
              onClick={() => onAbrirLancamento('DESPESA')}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-[#DCE7F5] text-[#C62828] hover:bg-red-50/50 shadow-xs active:scale-98 transition-all font-semibold text-xs cursor-pointer"
            >
              <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
              <span>+ Nova Despesa</span>
            </button>
          </div>

          {/* Dica Automática em Destaque */}
          {dicaPrincipal && (
            <div className="bg-white rounded-3xl p-5 border border-[#DCE7F5] shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#DCE7F5] text-[#365E91] flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-[#26364A]">{dicaPrincipal.titulo}</h4>
                    <span className="text-[10px] text-[#567FB5] font-semibold">Dica Inteligente</span>
                  </div>
                  <p className="text-xs text-[#718096] mb-2 leading-relaxed">
                    {dicaPrincipal.explicacao}
                  </p>
                  <div className="text-[11px] font-medium text-[#365E91] bg-[#F4F7FC] p-2.5 rounded-xl border border-[#DCE7F5]/80">
                    👉 {dicaPrincipal.acaoPratica}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* COLUNA DIREITA: Orçamento, Metas, Últimas Transações     */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          {/* Resumo do Orçamento Mensal */}
          <div className="bg-white rounded-3xl p-5 border border-[#DCE7F5] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#365E91]" />
                <span className="text-xs font-bold text-[#26364A]">Orçamento Geral do Mês</span>
              </div>
              <button
                onClick={() => onNavegarParaAba('orcamento')}
                className="text-xs font-semibold text-[#365E91] hover:underline cursor-pointer"
              >
                Gerenciar Orçamentos
              </button>
            </div>

            {orcamentoGeralMes ? (
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#718096]">
                    Gasto: {formatarMoeda(gastoOrcamentoGeralCentavos)}
                  </span>
                  <span className="font-bold text-[#26364A]">
                    Teto: {formatarMoeda(orcamentoGeralMes.limiteCentavos)} ({percentualOrcamento}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-[#F4F7FC] rounded-full overflow-hidden border border-[#DCE7F5]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      percentualOrcamento >= 100
                        ? 'bg-[#C62828]'
                        : percentualOrcamento >= 80
                        ? 'bg-[#E65100]'
                        : 'bg-[#567FB5]'
                    }`}
                    style={{ width: `${percentualOrcamento}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-3 bg-[#F4F7FC] rounded-2xl border border-[#DCE7F5]/80">
                <p className="text-xs text-[#718096] mb-2">Nenhum teto geral definido para este mês.</p>
                <button
                  onClick={() => onNavegarParaAba('orcamento')}
                  className="text-xs font-semibold text-[#365E91] bg-white border border-[#DCE7F5] px-3 py-1.5 rounded-xl hover:bg-[#DCE7F5]/50 transition-colors cursor-pointer"
                >
                  Definir Teto de Gastos
                </button>
              </div>
            )}
          </div>

          {/* Metas em Andamento */}
          {metasAtivas.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-[#DCE7F5] shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-[#365E91]" />
                  <span className="text-xs font-bold text-[#26364A]">Metas em Andamento</span>
                </div>
                <button
                  onClick={() => onNavegarParaAba('metas')}
                  className="text-xs font-semibold text-[#365E91] hover:underline cursor-pointer"
                >
                  Ver todas ({metasAtivas.length})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {metasAtivas.slice(0, 4).map(meta => {
                  const aportado = obterTotalAportadoMeta(meta.id);
                  const percentual = Math.min(100, Math.round((aportado / meta.valorAlvoCentavos) * 100));

                  return (
                    <div key={meta.id} className="p-3.5 bg-[#F4F7FC] rounded-2xl border border-[#DCE7F5]/80">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-[#26364A] truncate">{meta.titulo}</span>
                        <span className="font-semibold text-[#365E91]">{percentual}%</span>
                      </div>
                      <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#DCE7F5] mb-1.5">
                        <div
                          className="h-full bg-[#567FB5] rounded-full transition-all"
                          style={{ width: `${percentual}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#718096]">
                        <span>{formatarMoeda(aportado)}</span>
                        <span>Alvo: {formatarMoeda(meta.valorAlvoCentavos)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Últimos Lançamentos */}
          <div className="bg-white rounded-3xl p-5 border border-[#DCE7F5] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-[#365E91]" />
                <span className="text-xs font-bold text-[#26364A]">Últimos Lançamentos</span>
              </div>
              <button
                onClick={() => onNavegarParaAba('lancamentos')}
                className="text-xs font-semibold text-[#365E91] hover:underline cursor-pointer"
              >
                Ver Extrato Completo
              </button>
            </div>

            {ultimasTransacoes.length > 0 ? (
              <div className="divide-y divide-[#DCE7F5]/60">
                {ultimasTransacoes.map(t => {
                  const cat = mapaCategorias.get(t.categoriaId);
                  return (
                    <div
                      key={t.id}
                      onClick={() => onEditarLancamento(t)}
                      className="py-3 flex items-center justify-between hover:bg-[#F4F7FC]/70 px-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${cat?.cor || '#567FB5'}20` }}
                        >
                          <div
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: cat?.cor || '#567FB5' }}
                          />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#26364A] block truncate max-w-[200px] sm:max-w-xs">
                            {t.descricao}
                          </span>
                          <span className="text-[11px] text-[#718096]">
                            {cat?.nome || 'Geral'} · {formatarDataBR(t.data)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-extrabold tabular-nums ${
                          t.tipo === 'RECEITA' ? 'text-[#2E7D32]' : 'text-[#26364A]'
                        }`}
                      >
                        {t.tipo === 'RECEITA' ? '+' : '-'} {formatarMoeda(t.valorCentavos)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-[#718096]">
                Nenhum lançamento registrado neste mês.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
