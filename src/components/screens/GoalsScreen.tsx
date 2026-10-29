/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import confetti from 'canvas-confetti';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  History,
  PiggyBank,
  Plus,
  Sparkles,
  Target,
  Trash2,
  X
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { ModalidadeMeta, Meta } from '../../types/index.ts';
import {
  calcularDiasRestantes,
  formatarDataBR,
  formatarMoeda,
  obterDataHojeISO,
  obterNomeMes
} from '../../utils/formatters.ts';

export const GoalsScreen: React.FC = () => {
  const {
    metas,
    adicionarMeta,
    editarMeta,
    excluirMeta,
    adicionarContribuicaoMeta,
    obterTotalAportadoMeta,
    contribuicoes,
    anoSelecionado,
    mesSelecionado,
  } = useFinance();

  const [abaMetas, setAbaMetas] = useState<'ATIVAS' | 'CONCLUIDAS'>('ATIVAS');

  // Modais de Criação e Aporte
  const [modalNovaMeta, setModalNovaMeta] = useState<boolean>(false);
  const [metaParaEditar, setMetaParaEditar] = useState<Meta | null>(null);
  const [metaParaAporte, setMetaParaAporte] = useState<Meta | null>(null);
  const [metaHistoricoAportes, setMetaHistoricoAportes] = useState<Meta | null>(null);

  // Campos do formulário de nova meta
  const [titulo, setTitulo] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [modalidade, setModalidade] = useState<ModalidadeMeta>('PERSONALIZADA');
  const [valorAlvoReais, setValorAlvoReais] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [erroForm, setErroForm] = useState<string>('');

  // Campos de aporte
  const [valorAporteReais, setValorAporteReais] = useState<string>('');
  const [obsAporte, setObsAporte] = useState<string>('');

  const metasAtivas = useMemo(() => metas.filter(m => m.status === 'EM_ANDAMENTO'), [metas]);
  const metasConcluidas = useMemo(() => metas.filter(m => m.status === 'CONCLUIDA'), [metas]);

  const abrirModalCriacao = () => {
    setMetaParaEditar(null);
    setTitulo('');
    setDescricao('');
    setModalidade('PERSONALIZADA');
    setValorAlvoReais('');
    setDataFim('');
    setErroForm('');
    setModalNovaMeta(true);
  };

  const abrirModalEdicao = (m: Meta) => {
    setMetaParaEditar(m);
    setTitulo(m.titulo);
    setDescricao(m.descricao || '');
    setModalidade(m.modalidade);
    setValorAlvoReais((m.valorAlvoCentavos / 100).toFixed(2));
    setDataFim(m.dataFim || '');
    setErroForm('');
    setModalNovaMeta(true);
  };

  const handleSalvarMeta = () => {
    if (!titulo.trim()) {
      setErroForm('Informe o título do seu objetivo financeiro.');
      return;
    }
    const valorNum = parseFloat(valorAlvoReais.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) {
      setErroForm('Informe um valor-alvo válido maior que zero.');
      return;
    }

    const valorCentavos = Math.round(valorNum * 100);

    if (metaParaEditar) {
      editarMeta({
        ...metaParaEditar,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        modalidade,
        valorAlvoCentavos: valorCentavos,
        dataFim: modalidade !== 'SEM_PRAZO' ? dataFim || undefined : undefined,
      });
    } else {
      adicionarMeta({
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        modalidade,
        valorAlvoCentavos: valorCentavos,
        dataInicio: obterDataHojeISO(),
        dataFim: modalidade !== 'SEM_PRAZO' ? dataFim || undefined : undefined,
        mesReferencia: modalidade === 'MENSAL' ? mesSelecionado : undefined,
        anoReferencia: modalidade === 'MENSAL' || modalidade === 'ANUAL' ? anoSelecionado : undefined,
        status: 'EM_ANDAMENTO',
      });
    }

    setModalNovaMeta(false);
  };

  const handleConfirmarAporte = () => {
    if (!metaParaAporte) return;
    const valorNum = parseFloat(valorAporteReais.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) return;

    const centavos = Math.round(valorNum * 100);
    const totalAtual = obterTotalAportadoMeta(metaParaAporte.id);
    const novoTotal = totalAtual + centavos;

    adicionarContribuicaoMeta(metaParaAporte.id, centavos, obsAporte.trim() || undefined);

    // Se completou a meta, lança celebração
    if (novoTotal >= metaParaAporte.valorAlvoCentavos) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    setValorAporteReais('');
    setObsAporte('');
    setMetaParaAporte(null);
  };

  return (
    <div className="flex-1 pb-24 px-4 pt-3 space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#26364A]">Metas de Economia</h1>
          <p className="text-xs text-[#718096]">
            Guarde dinheiro com propósito sem misturar com despesas de consumo
          </p>
        </div>
        <button
          onClick={abrirModalCriacao}
          className="px-3.5 py-2 rounded-xl bg-[#365E91] text-white hover:bg-[#2A4D78] transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova Meta</span>
        </button>
      </div>

      {/* Abas Ativas vs Concluídas */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-2xl border border-[#DCE7F5] shadow-xs">
        <button
          onClick={() => setAbaMetas('ATIVAS')}
          className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            abaMetas === 'ATIVAS'
              ? 'bg-[#365E91] text-white shadow-xs'
              : 'text-[#718096] hover:text-[#26364A]'
          }`}
        >
          Em Andamento ({metasAtivas.length})
        </button>
        <button
          onClick={() => setAbaMetas('CONCLUIDAS')}
          className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            abaMetas === 'CONCLUIDAS'
              ? 'bg-[#365E91] text-white shadow-xs'
              : 'text-[#718096] hover:text-[#26364A]'
          }`}
        >
          Concluídas ({metasConcluidas.length})
        </button>
      </div>

      {/* Lista de Metas */}
      {((abaMetas === 'ATIVAS' && metasAtivas.length > 0) ||
        (abaMetas === 'CONCLUIDAS' && metasConcluidas.length > 0)) ? (
        <div className="space-y-3">
          {(abaMetas === 'ATIVAS' ? metasAtivas : metasConcluidas).map(meta => {
            const aportado = obterTotalAportadoMeta(meta.id);
            const restante = Math.max(0, meta.valorAlvoCentavos - aportado);
            const percentual = Math.min(100, Math.round((aportado / meta.valorAlvoCentavos) * 100));
            const diasRestantes = meta.dataFim ? calcularDiasRestantes(meta.dataFim) : null;

            // Estimativa de aporte mensal para Meta Anual
            let aporteMensalNecessarioCentavos = 0;
            if (meta.modalidade === 'ANUAL' && meta.anoReferencia) {
              const mesesRestantesNoAno = Math.max(1, 12 - mesSelecionado + 1);
              aporteMensalNecessarioCentavos = Math.round(restante / mesesRestantesNoAno);
            }

            return (
              <div
                key={meta.id}
                className="bg-white rounded-3xl p-5 border border-[#DCE7F5] shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#DCE7F5] text-[#365E91] flex items-center justify-center shrink-0 mt-0.5">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#26364A]">{meta.titulo}</h3>
                      {meta.descricao && (
                        <p className="text-xs text-[#718096] mt-0.5">{meta.descricao}</p>
                      )}
                      <span className="text-[10px] text-[#567FB5] font-semibold mt-1 inline-block">
                        {meta.modalidade === 'MENSAL' && `Meta Mensal (${obterNomeMes(meta.mesReferencia || mesSelecionado)})`}
                        {meta.modalidade === 'ANUAL' && `Meta Anual (${meta.anoReferencia || anoSelecionado})`}
                        {meta.modalidade === 'PERSONALIZADA' && 'Meta Personalizada'}
                        {meta.modalidade === 'SEM_PRAZO' && 'Meta Sem Prazo Fixo'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setMetaHistoricoAportes(meta)}
                      className="p-1.5 rounded-lg text-[#718096] hover:bg-[#F4F7FC] transition-colors cursor-pointer"
                      title="Ver Histórico de Aportes"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => abrirModalEdicao(meta)}
                      className="p-1.5 rounded-lg text-[#718096] hover:bg-[#F4F7FC] transition-colors cursor-pointer"
                      title="Editar Meta"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => excluirMeta(meta.id)}
                      className="p-1.5 rounded-lg text-[#718096] hover:bg-red-50 hover:text-[#C62828] transition-colors cursor-pointer"
                      title="Excluir Meta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-extrabold text-[#365E91] tabular-nums text-sm">
                      {formatarMoeda(aportado)}
                    </span>
                    <span className="font-semibold text-[#718096]">
                      Alvo: {formatarMoeda(meta.valorAlvoCentavos)} ({percentual}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#F4F7FC] rounded-full overflow-hidden border border-[#DCE7F5]">
                    <div
                      className="h-full bg-gradient-to-r from-[#567FB5] to-[#365E91] rounded-full transition-all duration-300"
                      style={{ width: `${percentual}%` }}
                    />
                  </div>
                </div>

                {/* Detalhes Complementares (Restante, Dias, Estimativa) */}
                <div className="pt-2 border-t border-[#DCE7F5]/70 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#718096] block text-[11px]">Valor restante</span>
                    <span className="font-bold text-[#26364A] tabular-nums">
                      {formatarMoeda(restante)}
                    </span>
                  </div>

                  {meta.modalidade === 'ANUAL' && restante > 0 && (
                    <div>
                      <span className="text-[#718096] block text-[11px]">Aporte mensal sugerido</span>
                      <span className="font-bold text-[#365E91] tabular-nums">
                        {formatarMoeda(aporteMensalNecessarioCentavos)}/mês
                      </span>
                    </div>
                  )}

                  {diasRestantes !== null && (
                    <div>
                      <span className="text-[#718096] block text-[11px]">Prazo estipulado</span>
                      <span className="font-medium text-[#26364A]">
                        {diasRestantes} dias restantes ({formatarDataBR(meta.dataFim!)})
                      </span>
                    </div>
                  )}
                </div>

                {/* Botão de Aporte Rápido */}
                {meta.status === 'EM_ANDAMENTO' && (
                  <button
                    onClick={() => {
                      setMetaParaAporte(meta);
                      setValorAporteReais('');
                      setObsAporte('');
                    }}
                    className="w-full py-2.5 rounded-2xl bg-[#DCE7F5]/70 text-[#365E91] hover:bg-[#DCE7F5] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Registrar Novo Aporte</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-[#DCE7F5] text-center shadow-xs">
          <PiggyBank className="w-10 h-10 text-[#567FB5]/50 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#26364A] mb-1">
            {abaMetas === 'ATIVAS' ? 'Nenhuma meta em andamento' : 'Nenhuma meta concluída ainda'}
          </h3>
          <p className="text-xs text-[#718096] max-w-xs mx-auto mb-4">
            Defina metas mensais, anuais, reserva de emergência ou compras planejadas.
          </p>
          <button
            onClick={abrirModalCriacao}
            className="px-4 py-2.5 rounded-xl bg-[#365E91] text-white text-xs font-bold hover:bg-[#2A4D78] transition-colors cursor-pointer"
          >
            Criar Minha Primeira Meta
          </button>
        </div>
      )}

      {/* Modal Criar / Editar Meta */}
      {modalNovaMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-[#DCE7F5] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE7F5]">
              <h3 className="text-sm font-bold text-[#26364A]">
                {metaParaEditar ? 'Editar Meta de Economia' : 'Nova Meta de Economia'}
              </h3>
              <button onClick={() => setModalNovaMeta(false)} className="text-[#718096]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {erroForm && (
              <div className="p-2.5 rounded-xl bg-red-50 text-[#C62828] text-xs font-medium border border-red-200">
                {erroForm}
              </div>
            )}

            {/* Seletor de Modalidade (4 Opções) */}
            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1.5">
                Modalidade da Meta
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'PERSONALIZADA', rotulo: 'Personalizada' },
                  { id: 'MENSAL', rotulo: 'Meta Mensal' },
                  { id: 'ANUAL', rotulo: 'Meta Anual' },
                  { id: 'SEM_PRAZO', rotulo: 'Sem Prazo Fixo' },
                ].map(op => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setModalidade(op.id as ModalidadeMeta)}
                    className={`py-2 px-2.5 rounded-xl font-semibold border text-left transition-all cursor-pointer ${
                      modalidade === op.id
                        ? 'border-[#365E91] bg-[#DCE7F5]/50 text-[#365E91]'
                        : 'border-[#DCE7F5] bg-white text-[#718096]'
                    }`}
                  >
                    {op.rotulo}
                  </button>
                ))}
              </div>
            </div>

            {/* Título e Descrição */}
            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1">
                Nome do Objetivo
              </label>
              <input
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Reserva de Emergência, Férias, Carro..."
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#DCE7F5] text-xs text-[#26364A] focus:outline-none focus:border-[#365E91]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1">
                Descrição (Opcional)
              </label>
              <input
                type="text"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Ex: 6 meses de contas essenciais guardados"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7F5] text-xs text-[#26364A] focus:outline-none focus:border-[#365E91]"
              />
            </div>

            {/* Valor Alvo */}
            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1">
                Valor Alvo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={valorAlvoReais}
                onChange={e => setValorAlvoReais(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#DCE7F5] text-sm font-bold text-[#26364A] focus:outline-none focus:border-[#365E91]"
              />
            </div>

            {/* Data Limite (para modalidades com prazo) */}
            {modalidade !== 'SEM_PRAZO' && (
              <div>
                <label className="block text-xs font-semibold text-[#26364A] mb-1">
                  Data Limite Desejada
                </label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={e => setDataFim(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7F5] text-xs text-[#26364A] focus:outline-none focus:border-[#365E91]"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalNovaMeta(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#DCE7F5] text-xs font-semibold text-[#718096] hover:bg-[#F4F7FC] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarMeta}
                className="flex-1 py-2.5 rounded-xl bg-[#365E91] text-white text-xs font-bold hover:bg-[#2A4D78] transition-colors cursor-pointer"
              >
                Salvar Meta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Aporte */}
      {metaParaAporte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-[#DCE7F5] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE7F5]">
              <h3 className="text-sm font-bold text-[#26364A]">
                Aporte para: {metaParaAporte.titulo}
              </h3>
              <button onClick={() => setMetaParaAporte(null)} className="text-[#718096]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1">
                Valor do Aporte (R$)
              </label>
              <input
                type="number"
                step="0.01"
                autoFocus
                value={valorAporteReais}
                onChange={e => setValorAporteReais(e.target.value)}
                placeholder="Ex: 100,00"
                className="w-full px-3.5 py-3 rounded-2xl bg-white border border-[#DCE7F5] text-base font-bold text-[#365E91] focus:outline-none focus:border-[#365E91]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1">
                Observação (Opcional)
              </label>
              <input
                type="text"
                value={obsAporte}
                onChange={e => setObsAporte(e.target.value)}
                placeholder="Ex: Sobra do décimo terceiro..."
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7F5] text-xs text-[#26364A] focus:outline-none focus:border-[#365E91]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMetaParaAporte(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#DCE7F5] text-xs font-semibold text-[#718096] hover:bg-[#F4F7FC] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarAporte}
                className="flex-1 py-2.5 rounded-xl bg-[#365E91] text-white text-xs font-bold hover:bg-[#2A4D78] transition-colors cursor-pointer"
              >
                Confirmar Aporte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Histórico de Aportes */}
      {metaHistoricoAportes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-[#DCE7F5] flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE7F5]">
              <h3 className="text-sm font-bold text-[#26364A]">
                Histórico: {metaHistoricoAportes.titulo}
              </h3>
              <button onClick={() => setMetaHistoricoAportes(null)} className="text-[#718096]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {contribuicoes.filter(c => c.metaId === metaHistoricoAportes.id).length > 0 ? (
                contribuicoes
                  .filter(c => c.metaId === metaHistoricoAportes.id)
                  .map(c => (
                    <div
                      key={c.id}
                      className="p-3 bg-[#F4F7FC] rounded-2xl border border-[#DCE7F5]/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#26364A] block">
                          {c.observacao || 'Aporte financeiro'}
                        </span>
                        <span className="text-[10px] text-[#718096]">{formatarDataBR(c.data)}</span>
                      </div>
                      <span className="font-extrabold text-[#365E91] tabular-nums">
                        +{formatarMoeda(c.valorCentavos)}
                      </span>
                    </div>
                  ))
              ) : (
                <div className="text-center py-6 text-xs text-[#718096]">
                  Nenhum aporte registrado para esta meta ainda.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#DCE7F5]">
              <button
                type="button"
                onClick={() => setMetaHistoricoAportes(null)}
                className="w-full py-2.5 rounded-xl bg-[#F4F7FC] text-xs font-bold text-[#365E91] hover:bg-[#DCE7F5]/50 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
