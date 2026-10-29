/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Check,
  Delete,
  FileText,
  Tag,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { NaturezaTransacao, TipoTransacao, Transacao } from '../../types/index.ts';
import { formatarMoeda, obterDataHojeISO } from '../../utils/formatters.ts';

interface NumericKeypadModalProps {
  aberto: boolean;
  onFechar: () => void;
  tipoInicial?: TipoTransacao;
  transacaoParaEditar?: Transacao | null;
}

export const NumericKeypadModal: React.FC<NumericKeypadModalProps> = ({
  aberto,
  onFechar,
  tipoInicial = 'DESPESA',
  transacaoParaEditar,
}) => {
  const { categorias, adicionarTransacao, editarTransacao } = useFinance();

  const [tipo, setTipo] = useState<TipoTransacao>(transacaoParaEditar ? transacaoParaEditar.tipo : tipoInicial);
  const [valorCentavos, setValorCentavos] = useState<number>(
    transacaoParaEditar ? transacaoParaEditar.valorCentavos : 0
  );
  const [descricao, setDescricao] = useState<string>(transacaoParaEditar ? transacaoParaEditar.descricao : '');
  const [categoriaId, setCategoriaId] = useState<string>(
    transacaoParaEditar ? transacaoParaEditar.categoriaId : ''
  );
  const [data, setData] = useState<string>(
    transacaoParaEditar ? transacaoParaEditar.data : obterDataHojeISO()
  );
  const [natureza, setNatureza] = useState<NaturezaTransacao>(
    transacaoParaEditar ? transacaoParaEditar.natureza : 'VARIAVEL'
  );
  const [erro, setErro] = useState<string>('');

  // Filtrar categorias pelo tipo selecionado
  const categoriasDoTipo = categorias.filter(c => c.tipo === tipo);

  // Auto-selecionar primeira categoria caso nenhuma esteja selecionada
  React.useEffect(() => {
    if (aberto) {
      if (transacaoParaEditar) {
        setTipo(transacaoParaEditar.tipo);
        setValorCentavos(transacaoParaEditar.valorCentavos);
        setDescricao(transacaoParaEditar.descricao);
        setCategoriaId(transacaoParaEditar.categoriaId);
        setData(transacaoParaEditar.data);
        setNatureza(transacaoParaEditar.natureza);
      } else {
        setTipo(tipoInicial);
        setValorCentavos(0);
        setDescricao('');
        setData(obterDataHojeISO());
        setNatureza('VARIAVEL');
        const prim = categorias.find(c => c.tipo === tipoInicial);
        if (prim) setCategoriaId(prim.id);
      }
      setErro('');
    }
  }, [aberto, tipoInicial, transacaoParaEditar, categorias]);

  if (!aberto) return null;

  // Lógica do teclado numérico
  const handleDigito = (digito: string) => {
    setErro('');
    if (digito === '00') {
      if (valorCentavos > 0 && valorCentavos < 10000000) {
        setValorCentavos(prev => prev * 100);
      }
    } else {
      const num = parseInt(digito, 10);
      if (valorCentavos < 100000000) {
        setValorCentavos(prev => prev * 10 + num);
      }
    }
  };

  const handleBackspace = () => {
    setValorCentavos(prev => Math.floor(prev / 10));
  };

  const handleLimpar = () => {
    setValorCentavos(0);
  };

  const handleSalvar = () => {
    if (valorCentavos <= 0) {
      setErro('Informe um valor maior que zero.');
      return;
    }
    if (!descricao.trim()) {
      setErro('Digite uma breve descrição para o lançamento.');
      return;
    }
    if (!categoriaId) {
      setErro('Selecione uma categoria.');
      return;
    }

    if (transacaoParaEditar) {
      editarTransacao({
        ...transacaoParaEditar,
        tipo,
        valorCentavos,
        descricao: descricao.trim(),
        categoriaId,
        data,
        natureza,
      });
    } else {
      adicionarTransacao({
        tipo,
        valorCentavos,
        descricao: descricao.trim(),
        categoriaId,
        data,
        natureza,
      });
    }

    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-[#DCE7F5]">
        {/* Cabeçalho da Folha */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#DCE7F5] bg-[#F4F7FC]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-[#DCE7F5] rounded-full mx-auto sm:hidden absolute top-2 left-1/2 -translate-x-1/2" />
            <h3 className="text-base font-bold text-[#26364A]">
              {transacaoParaEditar ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h3>
          </div>
          <button
            onClick={onFechar}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#718096] hover:bg-[#DCE7F5]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Rolagem */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Seletor de Tipo (Receita vs Despesa) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4F7FC] rounded-2xl border border-[#DCE7F5]">
            <button
              type="button"
              onClick={() => {
                setTipo('DESPESA');
                const prim = categorias.find(c => c.tipo === 'DESPESA');
                if (prim) setCategoriaId(prim.id);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                tipo === 'DESPESA'
                  ? 'bg-white text-[#C62828] shadow-sm border border-red-100'
                  : 'text-[#718096] hover:text-[#26364A]'
              }`}
            >
              <ArrowDownRight className="w-4 h-4 text-[#C62828]" />
              <span>Despesa</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTipo('RECEITA');
                const prim = categorias.find(c => c.tipo === 'RECEITA');
                if (prim) setCategoriaId(prim.id);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                tipo === 'RECEITA'
                  ? 'bg-white text-[#2E7D32] shadow-sm border border-emerald-100'
                  : 'text-[#718096] hover:text-[#26364A]'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-[#2E7D32]" />
              <span>Receita</span>
            </button>
          </div>

          {/* Exibição do Valor Formatado em Destaque */}
          <div className="text-center py-3 bg-[#F4F7FC] rounded-2xl border border-[#DCE7F5]">
            <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider block mb-1">
              Valor do Lançamento
            </span>
            <div
              className={`text-3xl font-extrabold tabular-nums tracking-tight ${
                tipo === 'RECEITA' ? 'text-[#2E7D32]' : 'text-[#26364A]'
              }`}
            >
              {formatarMoeda(valorCentavos)}
            </div>
          </div>

          {/* Mensagem de Erro de Validação */}
          {erro && (
            <div className="p-2.5 rounded-xl bg-red-50 text-[#C62828] text-xs font-medium border border-red-200">
              {erro}
            </div>
          )}

          {/* Teclado Numérico Touch Integrado */}
          <div className="grid grid-cols-3 gap-1.5 bg-[#F4F7FC] p-2 rounded-2xl border border-[#DCE7F5]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => handleDigito(n)}
                className="h-11 rounded-xl bg-white text-base font-bold text-[#26364A] shadow-xs active:bg-[#DCE7F5] transition-colors cursor-pointer"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleDigito('00')}
              className="h-11 rounded-xl bg-white text-xs font-bold text-[#365E91] shadow-xs active:bg-[#DCE7F5] transition-colors cursor-pointer"
            >
              00
            </button>
            <button
              type="button"
              onClick={() => handleDigito('0')}
              className="h-11 rounded-xl bg-white text-base font-bold text-[#26364A] shadow-xs active:bg-[#DCE7F5] transition-colors cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 rounded-xl bg-white text-[#718096] flex items-center justify-center shadow-xs active:bg-[#DCE7F5] transition-colors cursor-pointer"
              title="Apagar último dígito"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Campo Descrição */}
          <div>
            <label className="block text-xs font-semibold text-[#26364A] mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#567FB5]" />
              <span>Descrição</span>
            </label>
            <input
              type="text"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Ex: Almoço, Supermercado, Salário..."
              maxLength={50}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7F5] bg-white text-sm text-[#26364A] placeholder:text-[#718096]/60 focus:outline-none focus:border-[#365E91] focus:ring-2 focus:ring-[#365E91]/20"
            />
          </div>

          {/* Seleção de Categoria */}
          <div>
            <label className="block text-xs font-semibold text-[#26364A] mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#567FB5]" />
              <span>Categoria</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {categoriasDoTipo.map(cat => {
                const selecionada = categoriaId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoriaId(cat.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer ${
                      selecionada
                        ? 'border-[#365E91] bg-[#DCE7F5]/40 text-[#365E91]'
                        : 'border-[#DCE7F5] bg-white text-[#26364A] hover:bg-[#F4F7FC]'
                    }`}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.cor }}
                    />
                    <span className="truncate flex-1">{cat.nome}</span>
                    {selecionada && <Check className="w-3.5 h-3.5 text-[#365E91] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data e Natureza */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#567FB5]" />
                <span>Data</span>
              </label>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE7F5] bg-white text-xs text-[#26364A] focus:outline-none focus:border-[#365E91]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1">
                Natureza do Gasto
              </label>
              <select
                value={natureza}
                onChange={e => setNatureza(e.target.value as NaturezaTransacao)}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE7F5] bg-white text-xs text-[#26364A] focus:outline-none focus:border-[#365E91]"
              >
                <option value="VARIAVEL">Variável</option>
                <option value="FIXA">Fixa</option>
                <option value="RECORRENTE">Recorrente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rodapé com Botão Salvar */}
        <div className="p-4 bg-[#F4F7FC] border-t border-[#DCE7F5] flex gap-3">
          <button
            type="button"
            onClick={handleLimpar}
            className="px-4 py-2.5 rounded-xl border border-[#DCE7F5] text-xs font-semibold text-[#718096] hover:bg-white transition-colors cursor-pointer"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            className="flex-1 py-3 rounded-xl bg-[#365E91] hover:bg-[#2A4D78] text-white text-sm font-bold shadow-md shadow-[#365E91]/25 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{transacaoParaEditar ? 'Atualizar Lançamento' : 'Confirmar Lançamento'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
