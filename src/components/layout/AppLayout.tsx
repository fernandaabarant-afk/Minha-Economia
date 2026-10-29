/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BarChart3,
  Home,
  PiggyBank,
  Plus,
  ReceiptText,
  Shield,
  SlidersHorizontal,
  User
} from 'lucide-react';
import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { AbaNavegacao } from '../../types/index.ts';
import { BottomNav } from './BottomNav.tsx';

interface AppLayoutProps {
  children: React.ReactNode;
  abaAtiva: AbaNavegacao;
  onSelecionarAba: (aba: AbaNavegacao) => void;
  onAbrirNovoLancamento: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  abaAtiva,
  onSelecionarAba,
  onAbrirNovoLancamento,
}) => {
  const { usuario } = useAuth();

  const NAV_ITEMS: { id: AbaNavegacao; rotulo: string; icone: React.ElementType }[] = [
    { id: 'inicio', rotulo: 'Início', icone: Home },
    { id: 'lancamentos', rotulo: 'Extrato', icone: ReceiptText },
    { id: 'analises', rotulo: 'Análises', icone: BarChart3 },
    { id: 'metas', rotulo: 'Metas', icone: PiggyBank },
    { id: 'orcamento', rotulo: 'Orçamento', icone: SlidersHorizontal },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-[#26364A] flex flex-col antialiased">
      {/* ======================================================== */}
      {/* CABEÇALHO RESPONSIVO: DESKTOP & MOBILE                   */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DCE7F5] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zona 1: Marca & Logo */}
          <div
            onClick={() => onSelecionarAba('inicio')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#365E91] text-white flex items-center justify-center shadow-md shadow-[#365E91]/25 group-hover:bg-[#2A4D78] transition-colors">
              <Shield className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <span className="text-base font-bold text-[#26364A] tracking-tight block">
                Economia Pessoal
              </span>
              <span className="text-[10px] font-semibold text-[#567FB5] tracking-wider uppercase block">
                100% Local · Sem Nuvem
              </span>
            </div>
          </div>

          {/* Zona 2: Links de Navegação Desktop (Top Bar Contract) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {NAV_ITEMS.map(item => {
              const Icone = item.icone;
              const ativa = abaAtiva === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelecionarAba(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    ativa
                      ? 'bg-[#DCE7F5]/60 text-[#365E91] shadow-xs'
                      : 'text-[#718096] hover:text-[#26364A] hover:bg-[#F4F7FC]'
                  }`}
                >
                  <Icone className={`w-4 h-4 ${ativa ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                  <span>{item.rotulo}</span>
                </button>
              );
            })}
          </nav>

          {/* Zona 3: Ação Rápida & Perfil do Usuário */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Botão de Novo Lançamento no Desktop */}
            <button
              onClick={onAbrirNovoLancamento}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#365E91] hover:bg-[#2A4D78] text-white text-xs font-bold shadow-sm shadow-[#365E91]/25 active:scale-98 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.6]" />
              <span>Novo Lançamento</span>
            </button>

            {/* Perfil do Usuário */}
            <button
              onClick={() => onSelecionarAba('perfil')}
              className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border transition-all cursor-pointer ${
                abaAtiva === 'perfil'
                  ? 'border-[#365E91] bg-[#DCE7F5]/50 text-[#365E91]'
                  : 'border-[#DCE7F5] bg-white text-[#26364A] hover:bg-[#F4F7FC]'
              }`}
              title="Perfil & Configurações"
            >
              <div className="w-7 h-7 rounded-lg bg-[#365E91] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {usuario?.nome?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <span className="text-xs font-bold text-[#26364A] block truncate max-w-[120px]">
                  {usuario?.nome || 'Usuário'}
                </span>
                <span className="text-[10px] text-[#718096] block -mt-0.5">Segurança Local</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* CONTEÚDO PRINCIPAL EXPANSIVO E RESPONSIVO               */}
      {/* ======================================================== */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-12">
        {children}
      </main>

      {/* ======================================================== */}
      {/* RODAPÉ DESKTOP                                           */}
      {/* ======================================================== */}
      <footer className="hidden md:block border-t border-[#DCE7F5] bg-white py-4 text-center text-xs text-[#718096]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#26364A]">Economia Pessoal</span>
            <span>·</span>
            <span>Armazenamento SQLite 100% no Dispositivo</span>
            <span>·</span>
            <span className="text-[#2E7D32] font-medium">Livre de Cobranças</span>
          </div>
          <div>
            <span>Seus dados financeiros nunca saem deste computador ou celular.</span>
          </div>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* BARRA INFERIOR MOBILE TOUCH (OCULTA NO DESKTOP)          */}
      {/* ======================================================== */}
      {abaAtiva !== 'perfil' && (
        <BottomNav
          abaAtiva={abaAtiva}
          onSelecionarAba={onSelecionarAba}
          onAbrirNovoLancamento={onAbrirNovoLancamento}
        />
      )}
    </div>
  );
};
