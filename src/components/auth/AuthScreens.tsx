/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Check,
  CheckCircle2,
  Delete,
  HelpCircle,
  KeyRound,
  Lock,
  Shield,
  ShieldAlert,
  Sparkles,
  User,
  UserPlus
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { dbLocal } from '../../storage/db.ts';

export const AuthScreens: React.FC = () => {
  const { cadastrar, login, recuperarAcesso, temUsuariosCadastrados } = useAuth();

  const [modo, setModo] = useState<'LOGIN' | 'CADASTRO' | 'RECUPERAR'>(
    temUsuariosCadastrados ? 'LOGIN' : 'CADASTRO'
  );

  // Campos de Cadastro
  const [cadNome, setCadNome] = useState<string>('');
  const [cadEmail, setCadEmail] = useState<string>('');
  const [cadPin, setCadPin] = useState<string>('');
  const [cadPergunta, setCadPergunta] = useState<string>('Nome do seu primeiro animal de estimação?');
  const [cadResposta, setCadResposta] = useState<string>('');

  // Campos de Login por PIN
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPin, setLoginPin] = useState<string>('');

  // Campos de Recuperação
  const [recEmail, setRecEmail] = useState<string>('');
  const [recResposta, setRecResposta] = useState<string>('');
  const [recNovoPin, setRecNovoPin] = useState<string>('');

  const [erro, setErro] = useState<string>('');
  const [sucesso, setSucesso] = useState<string>('');

  const usuariosCadastrados = dbLocal.obterUsuarios();

  const handleDigitarPinLogin = (digito: string) => {
    setErro('');
    if (loginPin.length < 6) {
      const proximo = loginPin + digito;
      setLoginPin(proximo);
      if (proximo.length >= 4) {
        // Se tiver apenas 1 usuário local, tenta login automático ao atingir 4 a 6 dígitos
        if (usuariosCadastrados.length === 1) {
          login(usuariosCadastrados[0].email || '', proximo).then(res => {
            if (!res.sucesso && proximo.length === 6) {
              setErro(res.mensagem || 'PIN incorreto.');
            }
          });
        }
      }
    }
  };

  const handleBackspaceLogin = () => {
    setLoginPin(prev => prev.slice(0, -1));
  };

  const handleSubmeterLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErro('');
    if (!loginPin) {
      setErro('Digite seu PIN de 4 dígitos.');
      return;
    }

    const emailAlvo = loginEmail.trim() || (usuariosCadastrados[0]?.email || '');
    const res = await login(emailAlvo, loginPin);
    if (!res.sucesso) {
      setErro(res.mensagem || 'PIN de acesso inválido.');
    }
  };

  const handleSubmeterCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!cadNome.trim()) {
      setErro('Informe seu nome ou apelido.');
      return;
    }
    if (cadPin.length < 4) {
      setErro('O PIN deve conter ao menos 4 dígitos numéricos.');
      return;
    }
    if (!cadResposta.trim()) {
      setErro('Responda a pergunta secreta para proteção de recuperação offline.');
      return;
    }

    const res = await cadastrar(cadNome, cadEmail, cadPin, cadPergunta, cadResposta);
    if (!res.sucesso) {
      setErro(res.mensagem || 'Erro ao criar o perfil local.');
    }
  };

  const handleSubmeterRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    const res = await recuperarAcesso(recEmail, recResposta, recNovoPin);
    if (res.sucesso) {
      setSucesso('PIN redefinido com sucesso! Você já está conectado.');
    } else {
      setErro(res.mensagem || 'Não foi possível redefinir o PIN com os dados informados.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 max-w-md mx-auto w-full">
      {/* Logotipo e Identidade Visual (Azul & Branco) */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-3xl bg-[#365E91] text-white flex items-center justify-center mx-auto shadow-xl shadow-[#365E91]/30 mb-3">
          <Shield className="w-8 h-8 stroke-[2.2]" />
        </div>
        <h1 className="text-xl font-bold text-[#26364A]">Economia Pessoal</h1>
        <p className="text-xs text-[#718096] mt-0.5">
          100% Local · Sem Nuvem · Sem Cobranças
        </p>
      </div>

      {/* Caixa de Mensagens */}
      {erro && (
        <div className="mb-4 p-3 rounded-2xl bg-red-50 text-[#C62828] text-xs font-semibold border border-red-200 text-center animate-in fade-in">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="mb-4 p-3 rounded-2xl bg-emerald-50 text-[#2E7D32] text-xs font-semibold border border-emerald-200 text-center animate-in fade-in">
          {sucesso}
        </div>
      )}

      {/* MODO 1: LOGIN POR PIN */}
      {modo === 'LOGIN' && (
        <div className="bg-white rounded-3xl p-6 border border-[#DCE7F5] shadow-xs space-y-4">
          <div className="text-center">
            <h2 className="text-sm font-bold text-[#26364A]">Desbloqueio de Acesso</h2>
            <p className="text-xs text-[#718096] mt-0.5">
              {usuariosCadastrados.length === 1
                ? `Olá, ${usuariosCadastrados[0].nome}. Digite seu PIN.`
                : 'Selecione seu perfil e digite seu PIN local.'}
            </p>
          </div>

          {usuariosCadastrados.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-[#26364A] mb-1">Perfil Local</label>
              <select
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F4F7FC] border border-[#DCE7F5] text-xs text-[#26364A] focus:outline-none"
              >
                {usuariosCadastrados.map(u => (
                  <option key={u.id} value={u.email || u.id}>
                    {u.nome} {u.email ? `(${u.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Marcadores de Dígitos do PIN (Dots) */}
          <div className="flex justify-center items-center gap-3 py-2">
            {[0, 1, 2, 3].map(index => {
              const preenchido = loginPin.length > index;
              return (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    preenchido ? 'bg-[#365E91] scale-110' : 'bg-[#DCE7F5] border border-[#567FB5]/40'
                  }`}
                />
              );
            })}
          </div>

          {/* Teclado Numérico para Entrada de PIN Rápida */}
          <div className="grid grid-cols-3 gap-2 bg-[#F4F7FC] p-3 rounded-2xl border border-[#DCE7F5]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => handleDigitarPinLogin(n)}
                className="h-11 rounded-xl bg-white text-base font-bold text-[#26364A] shadow-xs active:bg-[#DCE7F5] transition-colors cursor-pointer"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLoginPin('')}
              className="h-11 rounded-xl bg-white text-xs font-bold text-[#718096] shadow-xs active:bg-[#DCE7F5] transition-colors cursor-pointer"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => handleDigitarPinLogin('0')}
              className="h-11 rounded-xl bg-white text-base font-bold text-[#26364A] shadow-xs active:bg-[#DCE7F5] transition-colors cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspaceLogin}
              className="h-11 rounded-xl bg-white text-[#718096] flex items-center justify-center shadow-xs active:bg-[#DCE7F5] transition-colors cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSubmeterLogin()}
            className="w-full py-3 rounded-2xl bg-[#365E91] text-white font-bold text-xs hover:bg-[#2A4D78] shadow-md shadow-[#365E91]/25 transition-all cursor-pointer"
          >
            Entrar no Aplicativo
          </button>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => {
                setErro('');
                setModo('RECUPERAR');
              }}
              className="text-[#718096] hover:text-[#365E91] font-medium cursor-pointer"
            >
              Esqueci meu PIN
            </button>

            <button
              type="button"
              onClick={() => {
                setErro('');
                setModo('CADASTRO');
              }}
              className="text-[#365E91] font-bold hover:underline cursor-pointer"
            >
              Criar Novo Perfil
            </button>
          </div>
        </div>
      )}

      {/* MODO 2: CADASTRO DE NOVO PERFIL LOCAL */}
      {modo === 'CADASTRO' && (
        <form
          onSubmit={handleSubmeterCadastro}
          className="bg-white rounded-3xl p-6 border border-[#DCE7F5] shadow-xs space-y-3"
        >
          <div className="text-center mb-1">
            <h2 className="text-sm font-bold text-[#26364A]">Criar Perfil Local Seguro</h2>
            <p className="text-xs text-[#718096] mt-0.5">
              Seus dados serão gravados com criptografia neste dispositivo
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26364A] mb-1">Seu Nome</label>
            <input
              type="text"
              required
              value={cadNome}
              onChange={e => setCadNome(e.target.value)}
              placeholder="Como prefere ser chamado..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7F5] text-xs text-[#26364A] focus:outline-none focus:border-[#365E91]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26364A] mb-1">
              E-mail (Identificador Local)
            </label>
            <input
              type="email"
              value={cadEmail}
              onChange={e => setCadEmail(e.target.value)}
              placeholder="seu@email.com (opcional)"
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7F5] text-xs text-[#26364A] focus:outline-none focus:border-[#365E91]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26364A] mb-1">
              Definir PIN de Acesso (4 a 6 dígitos)
            </label>
            <input
              type="password"
              required
              maxLength={6}
              value={cadPin}
              onChange={e => setCadPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#DCE7F5] text-center text-lg font-bold text-[#26364A] tracking-widest focus:outline-none focus:border-[#365E91]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26364A] mb-1">
              Pergunta Secreta para Recuperação Offline
            </label>
            <select
              value={cadPergunta}
              onChange={e => setCadPergunta(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7F5] text-xs text-[#26364A] focus:outline-none"
            >
              <option value="Nome do seu primeiro animal de estimação?">
                Nome do seu primeiro animal de estimação?
              </option>
              <option value="Cidade onde você nasceu?">Cidade onde você nasceu?</option>
              <option value="Nome da sua escola primária?">Nome da sua escola primária?</option>
              <option value="Comida favorita de infância?">Comida favorita de infância?</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26364A] mb-1">Sua Resposta Secreta</label>
            <input
              type="text"
              required
              value={cadResposta}
              onChange={e => setCadResposta(e.target.value)}
              placeholder="Resposta para recuperar o PIN se esquecer..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7F5] text-xs text-[#26364A] focus:outline-none focus:border-[#365E91]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-[#365E91] text-white font-bold text-xs hover:bg-[#2A4D78] shadow-md shadow-[#365E91]/25 transition-all cursor-pointer mt-2"
          >
            Criar Perfil e Começar
          </button>

          {temUsuariosCadastrados && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setErro('');
                  setModo('LOGIN');
                }}
                className="text-xs text-[#365E91] font-semibold hover:underline cursor-pointer"
              >
                Já possuo um perfil neste aparelho
              </button>
            </div>
          )}
        </form>
      )}

      {/* MODO 3: RECUPERAÇÃO OFFLINE DE PIN */}
      {modo === 'RECUPERAR' && (
        <form
          onSubmit={handleSubmeterRecuperacao}
          className="bg-white rounded-3xl p-6 border border-[#DCE7F5] shadow-xs space-y-3"
        >
          <div className="text-center mb-1">
            <h2 className="text-sm font-bold text-[#26364A]">Recuperação Offline de Acesso</h2>
            <p className="text-xs text-[#718096] mt-0.5">
              Valide sua resposta de segurança cadastrada
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26364A] mb-1">E-mail Cadastrado</label>
            <input
              type="email"
              required
              value={recEmail}
              onChange={e => setRecEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7F5] text-xs text-[#26364A] focus:outline-none focus:border-[#365E91]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26364A] mb-1">Resposta Secreta</label>
            <input
              type="text"
              required
              value={recResposta}
              onChange={e => setRecResposta(e.target.value)}
              placeholder="Digite a resposta cadastrada..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7F5] text-xs text-[#26364A] focus:outline-none focus:border-[#365E91]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26364A] mb-1">Novo PIN (4 a 6 dígitos)</label>
            <input
              type="password"
              required
              maxLength={6}
              value={recNovoPin}
              onChange={e => setRecNovoPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#DCE7F5] text-center text-lg font-bold text-[#26364A] tracking-widest focus:outline-none focus:border-[#365E91]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-[#365E91] text-white font-bold text-xs hover:bg-[#2A4D78] shadow-md shadow-[#365E91]/25 transition-all cursor-pointer mt-2"
          >
            Validar Resposta e Redefinir PIN
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setErro('');
                setModo('LOGIN');
              }}
              className="text-xs text-[#718096] hover:text-[#365E91] font-semibold cursor-pointer"
            >
              Voltar ao Desbloqueio
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
