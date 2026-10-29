/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Database,
  Download,
  KeyRound,
  Lock,
  LogOut,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  X
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useFinance } from '../../context/FinanceContext.tsx';
import { dbLocal } from '../../storage/db.ts';
import { formatarDataBR } from '../../utils/formatters.ts';

interface ProfileScreenProps {
  onVoltar: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onVoltar }) => {
  const { usuario, logout, alterarPin, excluirConta } = useAuth();
  const { exportarBackup, importarBackup, limparDadosLocais } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para alteração de PIN
  const [modalAlterarPin, setModalAlterarPin] = useState<boolean>(false);
  const [pinAtual, setPinAtual] = useState<string>('');
  const [novoPin, setNovoPin] = useState<string>('');
  const [confirmaPin, setConfirmaPin] = useState<string>('');
  const [msgPin, setMsgPin] = useState<{ tipo: 'ERRO' | 'SUCESSO'; texto: string } | null>(null);

  // Estados de confirmação
  const [modalLimparDados, setModalLimparDados] = useState<boolean>(false);
  const [modalExcluirConta, setModalExcluirConta] = useState<boolean>(false);
  const [msgBackup, setMsgBackup] = useState<{ tipo: 'ERRO' | 'SUCESSO'; texto: string } | null>(null);

  const stats = usuario ? dbLocal.obterEstatisticasBanco(usuario.id) : null;

  const handleSalvarNovoPin = async () => {
    setMsgPin(null);
    if (!pinAtual || !novoPin) {
      setMsgPin({ tipo: 'ERRO', texto: 'Preencha todos os campos do PIN.' });
      return;
    }
    if (novoPin.length < 4) {
      setMsgPin({ tipo: 'ERRO', texto: 'O novo PIN deve possuir ao menos 4 dígitos.' });
      return;
    }
    if (novoPin !== confirmaPin) {
      setMsgPin({ tipo: 'ERRO', texto: 'A confirmação do novo PIN não coincide.' });
      return;
    }

    const res = await alterarPin(pinAtual, novoPin);
    if (res.sucesso) {
      setMsgPin({ tipo: 'SUCESSO', texto: 'PIN alterado com sucesso!' });
      setTimeout(() => {
        setModalAlterarPin(false);
        setPinAtual('');
        setNovoPin('');
        setConfirmaPin('');
        setMsgPin(null);
      }, 1500);
    } else {
      setMsgPin({ tipo: 'ERRO', texto: res.mensagem || 'Erro ao alterar o PIN.' });
    }
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportarBackup();
    if (!jsonStr) return;
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `economia_pessoal_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMsgBackup({ tipo: 'SUCESSO', texto: 'Backup exportado com sucesso para seu dispositivo!' });
    setTimeout(() => setMsgBackup(null), 3000);
  };

  const handleSelecionarArquivoBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const conteudo = evt.target?.result as string;
      if (conteudo) {
        const res = importarBackup(conteudo);
        if (res.sucesso) {
          setMsgBackup({ tipo: 'SUCESSO', texto: res.mensagem });
        } else {
          setMsgBackup({ tipo: 'ERRO', texto: res.mensagem });
        }
        setTimeout(() => setMsgBackup(null), 3500);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex-1 pb-24 px-4 pt-3 space-y-4">
      {/* Botão Voltar e Título */}
      <div className="flex items-center gap-3">
        <button
          onClick={onVoltar}
          className="w-9 h-9 rounded-xl bg-white border border-[#DCE7F5] flex items-center justify-center text-[#365E91] hover:bg-[#F4F7FC] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-[#26364A]">Perfil & Segurança Local</h1>
          <p className="text-xs text-[#718096]">Controle de privacidade 100% no dispositivo</p>
        </div>
      </div>

      {msgBackup && (
        <div
          className={`p-3 rounded-2xl text-xs font-semibold border ${
            msgBackup.tipo === 'SUCESSO'
              ? 'bg-emerald-50 text-[#2E7D32] border-emerald-200'
              : 'bg-red-50 text-[#C62828] border-red-200'
          }`}
        >
          {msgBackup.texto}
        </div>
      )}

      {/* Cartão de Informações do Perfil */}
      <div className="bg-white rounded-3xl p-5 border border-[#DCE7F5] shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#DCE7F5] text-[#365E91] flex items-center justify-center font-extrabold text-lg">
            {usuario?.nome.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#26364A]">{usuario?.nome}</h3>
            {usuario?.email && <p className="text-xs text-[#718096]">{usuario.email}</p>}
            <span className="text-[10px] text-[#567FB5] font-semibold mt-0.5 inline-block">
              Perfil local desde {usuario ? formatarDataBR(usuario.criadoEm.slice(0, 10)) : ''}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#DCE7F5]/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#2E7D32] font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Protegido por PIN Local</span>
          </div>
          <button
            onClick={() => setModalAlterarPin(true)}
            className="text-xs font-bold text-[#365E91] hover:underline cursor-pointer"
          >
            Alterar PIN
          </button>
        </div>
      </div>

      {/* Armazenamento SQLite Local */}
      <div className="bg-white rounded-3xl p-5 border border-[#DCE7F5] shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#365E91]" />
          <h3 className="text-xs font-bold text-[#26364A]">Armazenamento SQLite no Dispositivo</h3>
        </div>

        <div className="p-3 bg-[#F4F7FC] rounded-2xl border border-[#DCE7F5]/80 text-xs text-[#718096] leading-relaxed">
          🔒 <strong>Privacidade Soberana:</strong> Todas as receitas, despesas, orçamentos e metas permanecem exclusivamente na memória interna deste aparelho. Não há servidores remotos nem cópias em nuvem.
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 bg-[#F4F7FC] rounded-xl border border-[#DCE7F5]/60">
              <span className="text-[#718096] text-[10px] block">Lançamentos</span>
              <span className="font-bold text-[#26364A] text-sm tabular-nums">
                {stats.totalTransacoes}
              </span>
            </div>
            <div className="p-2.5 bg-[#F4F7FC] rounded-xl border border-[#DCE7F5]/60">
              <span className="text-[#718096] text-[10px] block">Metas</span>
              <span className="font-bold text-[#26364A] text-sm tabular-nums">
                {stats.totalMetas}
              </span>
            </div>
            <div className="p-2.5 bg-[#F4F7FC] rounded-xl border border-[#DCE7F5]/60">
              <span className="text-[#718096] text-[10px] block">Espaço SQLite</span>
              <span className="font-bold text-[#365E91] text-sm tabular-nums">
                {stats.tamanhoKb} KB
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Cópia de Segurança e Restauração Local (JSON) */}
      <div className="bg-white rounded-3xl p-5 border border-[#DCE7F5] shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-[#26364A]">Backup e Restauração Manual</h3>
        <p className="text-xs text-[#718096] leading-relaxed">
          Como os dados não vão para a nuvem, guarde cópias periódicas do seu arquivo de dados local para transferir para outro celular ou restaurar em caso de troca de aparelho.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#DCE7F5]/70 hover:bg-[#DCE7F5] text-[#365E91] font-bold text-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Backup</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#DCE7F5] hover:bg-[#F4F7FC] text-[#26364A] font-bold text-xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#365E91]" />
            <span>Restaurar JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleSelecionarArquivoBackup}
            className="hidden"
          />
        </div>
      </div>

      {/* Ações de Sessão e Limpeza */}
      <div className="bg-white rounded-3xl p-5 border border-[#DCE7F5] shadow-xs space-y-2">
        <button
          onClick={logout}
          className="w-full py-2.5 rounded-xl bg-[#F4F7FC] hover:bg-[#DCE7F5]/50 text-[#365E91] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Bloquear Acesso / Sair da Sessão</span>
        </button>

        <button
          onClick={() => setModalLimparDados(true)}
          className="w-full py-2.5 rounded-xl text-[#C62828] hover:bg-red-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Apagar Apenas Dados Financeiros Locais</span>
        </button>

        <button
          onClick={() => setModalExcluirConta(true)}
          className="w-full py-2 rounded-xl text-[#718096] hover:text-[#C62828] text-[11px] font-medium transition-colors cursor-pointer"
        >
          Excluir Perfil e Dados Definitivamente
        </button>
      </div>

      {/* Modal Alterar PIN */}
      {modalAlterarPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-[#DCE7F5] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE7F5]">
              <h3 className="text-sm font-bold text-[#26364A]">Alterar PIN de Acesso</h3>
              <button onClick={() => setModalAlterarPin(false)} className="text-[#718096]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {msgPin && (
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold border ${
                  msgPin.tipo === 'SUCESSO'
                    ? 'bg-emerald-50 text-[#2E7D32] border-emerald-200'
                    : 'bg-red-50 text-[#C62828] border-red-200'
                }`}
              >
                {msgPin.texto}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1">PIN Atual</label>
              <input
                type="password"
                maxLength={6}
                value={pinAtual}
                onChange={e => setPinAtual(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#DCE7F5] text-center text-lg font-bold text-[#26364A] tracking-widest focus:outline-none focus:border-[#365E91]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1">Novo PIN (4 a 6 dígitos)</label>
              <input
                type="password"
                maxLength={6}
                value={novoPin}
                onChange={e => setNovoPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#DCE7F5] text-center text-lg font-bold text-[#26364A] tracking-widest focus:outline-none focus:border-[#365E91]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1">Confirmar Novo PIN</label>
              <input
                type="password"
                maxLength={6}
                value={confirmaPin}
                onChange={e => setConfirmaPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#DCE7F5] text-center text-lg font-bold text-[#26364A] tracking-widest focus:outline-none focus:border-[#365E91]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalAlterarPin(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#DCE7F5] text-xs font-semibold text-[#718096] hover:bg-[#F4F7FC] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarNovoPin}
                className="flex-1 py-2.5 rounded-xl bg-[#365E91] text-white text-xs font-bold hover:bg-[#2A4D78] transition-colors cursor-pointer"
              >
                Salvar PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação Limpar Dados */}
      {modalLimparDados && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-[#DCE7F5] space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-[#C62828] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-[#26364A] mb-1">Limpar Dados Financeiros?</h3>
              <p className="text-xs text-[#718096]">
                Todas as suas transações, metas e orçamentos cadastrados neste aparelho serão apagados. Seu perfil e PIN serão mantidos.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalLimparDados(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#DCE7F5] text-xs font-semibold text-[#718096] hover:bg-[#F4F7FC] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  limparDadosLocais();
                  setModalLimparDados(false);
                  setMsgBackup({ tipo: 'SUCESSO', texto: 'Dados financeiros locais apagados.' });
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#C62828] text-white text-xs font-bold hover:bg-red-800 transition-colors cursor-pointer"
              >
                Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação Excluir Perfil */}
      {modalExcluirConta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-[#DCE7F5] space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-[#C62828] flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-[#26364A] mb-1">Excluir Perfil e Dados?</h3>
              <p className="text-xs text-[#718096]">
                Esta ação apagará permanentemente seu cadastro local e todo o histórico financeiro deste dispositivo.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalExcluirConta(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#DCE7F5] text-xs font-semibold text-[#718096] hover:bg-[#F4F7FC] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  excluirConta();
                  setModalExcluirConta(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#C62828] text-white text-xs font-bold hover:bg-red-800 transition-colors cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
