/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Battery, Maximize2, Minimize2, Smartphone, Wifi } from 'lucide-react';
import React, { useState } from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  const [modoTelaCheia, setModoTelaCheia] = useState<boolean>(false);
  const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#E9F0F8] flex flex-col items-center justify-center p-0 md:p-6 transition-all duration-300">
      {/* Barra de utilitário superior para alternar visualização móvel */}
      <div className="w-full max-w-[430px] md:max-w-none flex items-center justify-between px-4 py-2 text-xs text-[#718096]">
        <div className="flex items-center gap-1.5 font-medium">
          <Smartphone className="w-4 h-4 text-[#365E91]" />
          <span className="hidden sm:inline">Visualização Mobile Touch (Expo / React Native)</span>
          <span className="sm:hidden font-semibold text-[#26364A]">Economia Pessoal</span>
        </div>
        <button
          onClick={() => setModoTelaCheia(!modoTelaCheia)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#DCE7F5] text-[#365E91] hover:bg-[#F4F7FC] transition-colors font-medium cursor-pointer shadow-xs"
          title={modoTelaCheia ? 'Voltar para moldura de smartphone' : 'Expandir para tela cheia'}
        >
          {modoTelaCheia ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Moldura Móvel</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Modo Expandido</span>
            </>
          )}
        </button>
      </div>

      {/* Dispositivo Móvel ou Container Tela Cheia */}
      <div
        className={`w-full bg-[#F4F7FC] flex flex-col relative transition-all duration-300 ${
          modoTelaCheia
            ? 'max-w-4xl min-h-[90vh] rounded-2xl shadow-xl border border-[#DCE7F5] overflow-hidden'
            : 'max-w-[414px] h-[860px] max-h-[95vh] rounded-[44px] shadow-2xl border-[10px] border-[#26364A] overflow-hidden'
        }`}
      >
        {/* Barra de Status do Sistema Operacional (Mobile) */}
        {!modoTelaCheia && (
          <div className="w-full bg-[#F4F7FC] pt-3 px-7 pb-2 flex items-center justify-between text-xs font-semibold text-[#26364A] select-none shrink-0 z-50">
            <span>{horaAtual}</span>
            <div className="w-24 h-4 bg-[#26364A] rounded-full mx-auto -mt-1 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ml-auto mr-1.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Conteúdo da Aplicação com Rolagem Touch Nativa */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative">
          {children}
        </div>

        {/* Indicador de Barra Home do Smartphone */}
        {!modoTelaCheia && (
          <div className="w-full pb-2 pt-1 flex justify-center bg-white/80 backdrop-blur-md shrink-0 pointer-events-none border-t border-[#DCE7F5]/50">
            <div className="w-32 h-1 bg-[#26364A]/30 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
