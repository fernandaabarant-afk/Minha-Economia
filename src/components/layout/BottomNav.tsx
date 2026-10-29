/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarChart3, Home, PiggyBank, Plus, ReceiptText, SlidersHorizontal } from 'lucide-react';
import React from 'react';
import { AbaNavegacao } from '../../types/index.ts';

interface BottomNavProps {
  abaAtiva: AbaNavegacao;
  onSelecionarAba: (aba: AbaNavegacao) => void;
  onAbrirNovoLancamento: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  abaAtiva,
  onSelecionarAba,
  onAbrirNovoLancamento,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DCE7F5] px-2 py-1.5 shadow-lg select-none pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* Aba Início */}
        <button
          onClick={() => onSelecionarAba('inicio')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all cursor-pointer ${
            abaAtiva === 'inicio'
              ? 'text-[#365E91] font-semibold'
              : 'text-[#718096] hover:text-[#26364A]'
          }`}
        >
          <Home className={`w-5 h-5 ${abaAtiva === 'inicio' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-1">Início</span>
        </button>

        {/* Aba Lançamentos */}
        <button
          onClick={() => onSelecionarAba('lancamentos')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all cursor-pointer ${
            abaAtiva === 'lancamentos'
              ? 'text-[#365E91] font-semibold'
              : 'text-[#718096] hover:text-[#26364A]'
          }`}
        >
          <ReceiptText className={`w-5 h-5 ${abaAtiva === 'lancamentos' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-1">Extrato</span>
        </button>

        {/* Botão de Ação Rápida Central (+) */}
        <div className="relative -top-3">
          <button
            onClick={onAbrirNovoLancamento}
            className="w-13 h-13 rounded-full bg-[#365E91] text-white flex items-center justify-center shadow-lg shadow-[#365E91]/35 hover:bg-[#2A4D78] active:scale-95 transition-all cursor-pointer"
            title="Adicionar Lançamento"
            aria-label="Adicionar Lançamento"
          >
            <Plus className="w-6 h-6 stroke-[2.6]" />
          </button>
        </div>

        {/* Aba Análises */}
        <button
          onClick={() => onSelecionarAba('analises')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all cursor-pointer ${
            abaAtiva === 'analises'
              ? 'text-[#365E91] font-semibold'
              : 'text-[#718096] hover:text-[#26364A]'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${abaAtiva === 'analises' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-1">Análises</span>
        </button>

        {/* Aba Metas */}
        <button
          onClick={() => onSelecionarAba('metas')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all cursor-pointer ${
            abaAtiva === 'metas'
              ? 'text-[#365E91] font-semibold'
              : 'text-[#718096] hover:text-[#26364A]'
          }`}
        >
          <PiggyBank className={`w-5 h-5 ${abaAtiva === 'metas' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-1">Metas</span>
        </button>

        {/* Aba Orçamento */}
        <button
          onClick={() => onSelecionarAba('orcamento')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all cursor-pointer ${
            abaAtiva === 'orcamento'
              ? 'text-[#365E91] font-semibold'
              : 'text-[#718096] hover:text-[#26364A]'
          }`}
        >
          <SlidersHorizontal className={`w-5 h-5 ${abaAtiva === 'orcamento' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-1">Orçamento</span>
        </button>
      </div>
    </nav>
  );
};
