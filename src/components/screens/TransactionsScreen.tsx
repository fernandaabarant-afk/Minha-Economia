/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronDown,
  Edit2,
  Filter,
  Plus,
  Search,
  Tag,
  Trash2,
  X
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { TipoTransacao, Transacao } from '../../types/index.ts';
import { formatarDataBR, formatarMoeda } from '../../utils/formatters.ts';

interface TransactionsScreenProps {
  onAbrirNovoLancamento: () => void;
  onEditarLancamento: (t: Transacao) => void;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  onAbrirNovoLancamento,
  onEditarLancamento,
}) => {
  const {
    transacoes,
    categorias,
    excluirTransacao,
    adicionarCategoria,
    excluirCategoria,
    anoSelecionado,
    mesSelecionado,
  } = useFinance();

  // Estados de busca e filtros
  const [busca, setBusca] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'RECEITA' | 'DESPESA'>('TODOS');
  const [filtroCategoriaId, setFiltroCategoriaId] = useState<string>('TODAS');
  const [filtroPeriodo, setFiltroPeriodo] = useState<'MES_ATUAL' | 'TODOS'>('MES_ATUAL');
  const [ordenacao, setOrdenacao] = useState<'DATA_DESC' | 'DATA_ASC' | 'VALOR_DESC' | 'VALOR_ASC'>('DATA_DESC');

  // Modais de confirmação e categoria
  const [transacaoParaExcluir, setTransacaoParaExcluir] = useState<Transacao | null>(null);
  const [modalGerenciarCategorias, setModalGerenciarCategorias] = useState<boolean>(false);
  const [novaCatNome, setNovaCatNome] = useState<string>('');
  const [novaCatTipo, setNovaCatTipo] = useState<TipoTransacao>('DESPESA');
  const [novaCatCor, setNovaCatCor] = useState<string>('#567FB5');
  const [msgCategoria, setMsgCategoria] = useState<string>('');

  const mapaCategorias = useMemo(() => new Map(categorias.map(c => [c.id, c])), [categorias]);

  // Filtragem e ordenação dos lançamentos
  const transacoesFiltradas = useMemo(() => {
    return transacoes
      .filter(t => {
        // Filtro por período
        if (filtroPeriodo === 'MES_ATUAL') {
          const mesStr = String(mesSelecionado).padStart(2, '0');
          const prefixo = `${anoSelecionado}-${mesStr}`;
          if (!t.data.startsWith(prefixo)) return false;
        }

        // Filtro por tipo
        if (filtroTipo !== 'TODOS' && t.tipo !== filtroTipo) {
          return false;
        }

        // Filtro por categoria
        if (filtroCategoriaId !== 'TODAS' && t.categoriaId !== filtroCategoriaId) {
          return false;
        }

        // Filtro por busca textual
        if (busca.trim()) {
          const termo = busca.toLowerCase();
          const descMatch = t.descricao.toLowerCase().includes(termo);
          const cat = mapaCategorias.get(t.categoriaId);
          const catMatch = cat?.nome.toLowerCase().includes(termo);
          const valorFormatado = (t.valorCentavos / 100).toFixed(2).replace('.', ',');
          const valorMatch = valorFormatado.includes(termo);
          if (!descMatch && !catMatch && !valorMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (ordenacao === 'DATA_DESC') return a.data > b.data ? -1 : 1;
        if (ordenacao === 'DATA_ASC') return a.data < b.data ? -1 : 1;
        if (ordenacao === 'VALOR_DESC') return b.valorCentavos - a.valorCentavos;
        if (ordenacao === 'VALOR_ASC') return a.valorCentavos - b.valorCentavos;
        return 0;
      });
  }, [
    transacoes,
    filtroPeriodo,
    anoSelecionado,
    mesSelecionado,
    filtroTipo,
    filtroCategoriaId,
    busca,
    ordenacao,
    mapaCategorias,
  ]);

  // Agrupamento por data para exibição elegante
  const gruposPorData = useMemo(() => {
    const mapa = new Map<string, Transacao[]>();
    transacoesFiltradas.forEach(t => {
      const lista = mapa.get(t.data) || [];
      lista.push(t);
      mapa.set(t.data, lista);
    });
    return Array.from(mapa.entries());
  }, [transacoesFiltradas]);

  const handleConfirmarExclusao = () => {
    if (transacaoParaExcluir) {
      excluirTransacao(transacaoParaExcluir.id);
      setTransacaoParaExcluir(null);
    }
  };

  const handleAdicionarNovaCategoria = () => {
    if (!novaCatNome.trim()) {
      setMsgCategoria('Informe o nome da categoria.');
      return;
    }
    adicionarCategoria({
      nome: novaCatNome.trim(),
      tipo: novaCatTipo,
      cor: novaCatCor,
      icone: 'Tag',
    });
    setNovaCatNome('');
    setMsgCategoria('Categoria adicionada com sucesso!');
    setTimeout(() => setMsgCategoria(''), 2500);
  };

  const CORES_PALETA = ['#365E91', '#567FB5', '#E65100', '#2E7D32', '#C62828', '#7C3AED', '#0284C7', '#D97706'];

  return (
    <div className="flex-1 pb-24 px-4 pt-3 space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#26364A]">Lançamentos</h1>
          <p className="text-xs text-[#718096]">
            {transacoesFiltradas.length} {transacoesFiltradas.length === 1 ? 'registro' : 'registros'} encontrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalGerenciarCategorias(true)}
            className="p-2 rounded-xl bg-white border border-[#DCE7F5] text-[#365E91] hover:bg-[#F4F7FC] transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            title="Gerenciar Categorias"
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Categorias</span>
          </button>
          <button
            onClick={onAbrirNovoLancamento}
            className="px-3 py-2 rounded-xl bg-[#365E91] text-white hover:bg-[#2A4D78] transition-colors cursor-pointer text-xs font-bold flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Pesquisar por descrição, categoria ou valor..."
          className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-white border border-[#DCE7F5] text-xs text-[#26364A] placeholder:text-[#718096]/70 focus:outline-none focus:border-[#365E91] shadow-xs"
        />
        {busca && (
          <button
            onClick={() => setBusca('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#26364A]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Controles de Filtros Rápidos (Tipo e Período) */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs select-none">
        {/* Filtro por Tipo */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-[#DCE7F5] shrink-0">
          <button
            onClick={() => setFiltroTipo('TODOS')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filtroTipo === 'TODOS' ? 'bg-[#365E91] text-white shadow-xs' : 'text-[#718096] hover:text-[#26364A]'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroTipo('DESPESA')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filtroTipo === 'DESPESA' ? 'bg-[#C62828] text-white shadow-xs' : 'text-[#718096] hover:text-[#26364A]'
            }`}
          >
            Despesas
          </button>
          <button
            onClick={() => setFiltroTipo('RECEITA')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filtroTipo === 'RECEITA' ? 'bg-[#2E7D32] text-white shadow-xs' : 'text-[#718096] hover:text-[#26364A]'
            }`}
          >
            Receitas
          </button>
        </div>

        {/* Filtro Período */}
        <button
          onClick={() => setFiltroPeriodo(prev => (prev === 'MES_ATUAL' ? 'TODOS' : 'MES_ATUAL'))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold shrink-0 cursor-pointer transition-all ${
            filtroPeriodo === 'MES_ATUAL'
              ? 'bg-[#DCE7F5]/60 border-[#567FB5] text-[#365E91]'
              : 'bg-white border-[#DCE7F5] text-[#718096]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{filtroPeriodo === 'MES_ATUAL' ? 'Mês Selecionado' : 'Todo o Histórico'}</span>
        </button>
      </div>

      {/* Filtros Secundários: Categoria e Ordenação */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <select
            value={filtroCategoriaId}
            onChange={e => setFiltroCategoriaId(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#DCE7F5] text-[#26364A] font-medium focus:outline-none focus:border-[#365E91] shadow-xs cursor-pointer truncate"
          >
            <option value="TODAS">Todas as Categorias</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>
                {c.tipo === 'RECEITA' ? '+ ' : '- '}
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={ordenacao}
            onChange={e => setOrdenacao(e.target.value as any)}
            className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#DCE7F5] text-[#26364A] font-medium focus:outline-none focus:border-[#365E91] shadow-xs cursor-pointer truncate"
          >
            <option value="DATA_DESC">Mais recentes primeiro</option>
            <option value="DATA_ASC">Mais antigas primeiro</option>
            <option value="VALOR_DESC">Maior valor primeiro</option>
            <option value="VALOR_ASC">Menor valor primeiro</option>
          </select>
        </div>
      </div>

      {/* Lista Agrupada por Data */}
      {gruposPorData.length > 0 ? (
        <div className="space-y-4">
          {gruposPorData.map(([dataISO, itens]) => (
            <div key={dataISO} className="space-y-2">
              {/* Separador Limpo de Data (Sem Pílula) */}
              <div className="flex items-center justify-between text-xs text-[#718096] font-semibold px-1">
                <span>{formatarDataBR(dataISO)}</span>
                <span className="text-[11px] font-normal">
                  {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-[#DCE7F5] shadow-xs divide-y divide-[#DCE7F5]/50 overflow-hidden">
                {itens.map(t => {
                  const cat = mapaCategorias.get(t.categoriaId);
                  return (
                    <div
                      key={t.id}
                      className="p-3.5 flex items-center justify-between hover:bg-[#F4F7FC]/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${cat?.cor || '#567FB5'}20` }}
                        >
                          <div
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: cat?.cor || '#567FB5' }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-[#26364A] block truncate">
                            {t.descricao}
                          </span>
                          <div className="text-[11px] text-[#718096] flex items-center gap-1.5 flex-wrap">
                            <span>{cat?.nome || 'Geral'}</span>
                            <span aria-hidden="true">·</span>
                            <span>{t.natureza.toLowerCase()}</span>
                            {t.recorrenciaId && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-[#365E91] font-medium">recorrente</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Valor e Ações */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-extrabold tabular-nums ${
                            t.tipo === 'RECEITA' ? 'text-[#2E7D32]' : 'text-[#26364A]'
                          }`}
                        >
                          {t.tipo === 'RECEITA' ? '+' : '-'} {formatarMoeda(t.valorCentavos)}
                        </span>

                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={() => onEditarLancamento(t)}
                            className="w-7 h-7 rounded-lg text-[#718096] hover:bg-[#DCE7F5]/60 hover:text-[#365E91] flex items-center justify-center transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTransacaoParaExcluir(t)}
                            className="w-7 h-7 rounded-lg text-[#718096] hover:bg-red-50 hover:text-[#C62828] flex items-center justify-center transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 border border-[#DCE7F5] text-center shadow-xs">
          <Filter className="w-8 h-8 text-[#567FB5]/50 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#26364A] mb-1">Nenhum lançamento localizado</h3>
          <p className="text-xs text-[#718096] max-w-xs mx-auto mb-4">
            Tente ajustar os filtros, buscar por outro termo ou adicione uma nova transação.
          </p>
          <button
            onClick={onAbrirNovoLancamento}
            className="px-4 py-2 rounded-xl bg-[#365E91] text-white text-xs font-bold hover:bg-[#2A4D78] transition-colors cursor-pointer"
          >
            Adicionar Lançamento
          </button>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {transacaoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-[#DCE7F5] space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-[#C62828] flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-[#26364A] mb-1">Confirmar Exclusão</h3>
              <p className="text-xs text-[#718096]">
                Deseja realmente excluir o lançamento &ldquo;<span className="font-semibold text-[#26364A]">{transacaoParaExcluir.descricao}</span>&rdquo; de{' '}
                <span className="font-bold text-[#26364A]">{formatarMoeda(transacaoParaExcluir.valorCentavos)}</span>?
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTransacaoParaExcluir(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#DCE7F5] text-xs font-semibold text-[#718096] hover:bg-[#F4F7FC] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                className="flex-1 py-2.5 rounded-xl bg-[#C62828] text-white text-xs font-bold hover:bg-red-800 transition-colors cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gerenciamento de Categorias */}
      {modalGerenciarCategorias && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-[#DCE7F5] flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE7F5]">
              <h3 className="text-sm font-bold text-[#26364A]">Gerenciar Categorias</h3>
              <button
                onClick={() => setModalGerenciarCategorias(false)}
                className="text-[#718096] hover:text-[#26364A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-4">
              {/* Formulário de Criação de Categoria */}
              <div className="p-3 bg-[#F4F7FC] rounded-2xl border border-[#DCE7F5] space-y-3">
                <span className="text-xs font-bold text-[#26364A] block">Nova Categoria</span>

                {msgCategoria && (
                  <div className="p-2 rounded-lg bg-emerald-50 text-[#2E7D32] text-[11px] font-semibold border border-emerald-200">
                    {msgCategoria}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNovaCatTipo('DESPESA')}
                    className={`py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      novaCatTipo === 'DESPESA'
                        ? 'bg-white text-[#C62828] border-red-200 shadow-xs'
                        : 'text-[#718096] border-transparent'
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setNovaCatTipo('RECEITA')}
                    className={`py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      novaCatTipo === 'RECEITA'
                        ? 'bg-white text-[#2E7D32] border-emerald-200 shadow-xs'
                        : 'text-[#718096] border-transparent'
                    }`}
                  >
                    Receita
                  </button>
                </div>

                <input
                  type="text"
                  value={novaCatNome}
                  onChange={e => setNovaCatNome(e.target.value)}
                  placeholder="Nome da categoria..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7F5] text-xs text-[#26364A] focus:outline-none focus:border-[#365E91]"
                />

                <div>
                  <span className="text-[11px] font-medium text-[#718096] block mb-1.5">Escolha uma cor:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {CORES_PALETA.map(cor => (
                      <button
                        key={cor}
                        type="button"
                        onClick={() => setNovaCatCor(cor)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          novaCatCor === cor ? 'ring-2 ring-offset-2 ring-[#365E91]' : ''
                        }`}
                        style={{ backgroundColor: cor }}
                      >
                        {novaCatCor === cor && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAdicionarNovaCategoria}
                  className="w-full py-2 rounded-xl bg-[#365E91] text-white text-xs font-bold hover:bg-[#2A4D78] transition-colors cursor-pointer"
                >
                  Salvar Nova Categoria
                </button>
              </div>

              {/* Lista de Categorias Cadastradas */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#718096] block">Categorias Atuais ({categorias.length})</span>
                <div className="divide-y divide-[#DCE7F5] border border-[#DCE7F5] rounded-2xl overflow-hidden bg-white">
                  {categorias.map(c => (
                    <div key={c.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.cor }} />
                        <span className="font-semibold text-[#26364A]">{c.nome}</span>
                        <span className="text-[10px] text-[#718096]">({c.tipo.toLowerCase()})</span>
                      </div>
                      {!c.padrao && (
                        <button
                          onClick={() => {
                            const res = excluirCategoria(c.id);
                            if (!res.sucesso && res.mensagem) {
                              alert(res.mensagem);
                            }
                          }}
                          className="text-[#718096] hover:text-[#C62828] p-1 cursor-pointer"
                          title="Excluir Categoria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#DCE7F5]">
              <button
                type="button"
                onClick={() => setModalGerenciarCategorias(false)}
                className="w-full py-2.5 rounded-xl bg-[#F4F7FC] text-xs font-bold text-[#365E91] hover:bg-[#DCE7F5]/50 transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
