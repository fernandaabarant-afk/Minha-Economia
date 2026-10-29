/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { FinanceProvider } from './context/FinanceContext.tsx';
import { AuthScreens } from './components/auth/AuthScreens.tsx';
import { NumericKeypadModal } from './components/common/NumericKeypadModal.tsx';
import { BottomNav } from './components/layout/BottomNav.tsx';
import { MobileFrame } from './components/layout/MobileFrame.tsx';
import { AnalyticsScreen } from './components/screens/AnalyticsScreen.tsx';
import { BudgetScreen } from './components/screens/BudgetScreen.tsx';
import { GoalsScreen } from './components/screens/GoalsScreen.tsx';
import { HomeScreen } from './components/screens/HomeScreen.tsx';
import { ProfileScreen } from './components/screens/ProfileScreen.tsx';
import { TransactionsScreen } from './components/screens/TransactionsScreen.tsx';
import { AbaNavegacao, TipoTransacao, Transacao } from './types/index.ts';

const AppContent: React.FC = () => {
  const { usuario, carregando } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<AbaNavegacao>('inicio');

  // Estado do modal de lançamento rápido
  const [modalLancamentoAberto, setModalLancamentoAberto] = useState<boolean>(false);
  const [tipoLancamentoInicial, setTipoLancamentoInicial] = useState<TipoTransacao>('DESPESA');
  const [transacaoParaEditar, setTransacaoParaEditar] = useState<Transacao | null>(null);

  if (carregando) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#F4F7FC]">
        <div className="w-12 h-12 rounded-2xl bg-[#365E91] text-white flex items-center justify-center animate-pulse mb-3">
          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-xs font-bold text-[#26364A]">Economia Pessoal</span>
        <span className="text-[11px] text-[#718096] mt-0.5">Carregando dados seguros locais...</span>
      </div>
    );
  }

  // Se o usuário não estiver autenticado localmente
  if (!usuario) {
    return <AuthScreens />;
  }

  const handleAbrirNovoLancamentoComTipo = (tipo: TipoTransacao) => {
    setTransacaoParaEditar(null);
    setTipoLancamentoInicial(tipo);
    setModalLancamentoAberto(true);
  };

  const handleEditarLancamento = (t: Transacao) => {
    setTransacaoParaEditar(t);
    setTipoLancamentoInicial(t.tipo);
    setModalLancamentoAberto(true);
  };

  return (
    <>
      {/* Telas da Aplicação Conforme a Aba Ativa */}
      {abaAtiva === 'inicio' && (
        <HomeScreen
          onNavegarParaAba={setAbaAtiva}
          onAbrirLancamento={handleAbrirNovoLancamentoComTipo}
          onEditarLancamento={handleEditarLancamento}
        />
      )}

      {abaAtiva === 'lancamentos' && (
        <TransactionsScreen
          onAbrirNovoLancamento={() => handleAbrirNovoLancamentoComTipo('DESPESA')}
          onEditarLancamento={handleEditarLancamento}
        />
      )}

      {abaAtiva === 'analises' && <AnalyticsScreen />}

      {abaAtiva === 'metas' && <GoalsScreen />}

      {abaAtiva === 'orcamento' && <BudgetScreen />}

      {abaAtiva === 'perfil' && <ProfileScreen onVoltar={() => setAbaAtiva('inicio')} />}

      {/* Barra de Navegação Móvel Inferior (Oculta na tela de perfil para foco total) */}
      {abaAtiva !== 'perfil' && (
        <BottomNav
          abaAtiva={abaAtiva}
          onSelecionarAba={setAbaAtiva}
          onAbrirNovoLancamento={() => handleAbrirNovoLancamentoComTipo('DESPESA')}
        />
      )}

      {/* Modal Bottom Sheet com Teclado Numérico Formatado */}
      <NumericKeypadModal
        aberto={modalLancamentoAberto}
        onFechar={() => {
          setModalLancamentoAberto(false);
          setTransacaoParaEditar(null);
        }}
        tipoInicial={tipoLancamentoInicial}
        transacaoParaEditar={transacaoParaEditar}
      />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <MobileFrame>
          <AppContent />
        </MobileFrame>
      </FinanceProvider>
    </AuthProvider>
  );
}
