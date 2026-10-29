/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { dbLocal } from '../storage/db.ts';
import { UsuarioLocal } from '../types/index.ts';
import { gerarHashSeguro, gerarSaltAleatorio, verificarHash } from '../utils/crypto.ts';

interface AuthContextType {
  usuario: UsuarioLocal | null;
  carregando: boolean;
  cadastrar: (
    nome: string,
    email: string,
    pin: string,
    perguntaRecuperacao: string,
    respostaRecuperacao: string
  ) => Promise<{ sucesso: boolean; mensagem?: string }>;
  login: (email: string, pin: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
  logout: () => void;
  recuperarAcesso: (
    email: string,
    resposta: string,
    novoPin: string
  ) => Promise<{ sucesso: boolean; mensagem?: string }>;
  alterarPin: (pinAtual: string, novoPin: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
  excluirConta: () => void;
  temUsuariosCadastrados: boolean;
}

const SESSION_KEY = 'economia_pessoal_sessao_ativa_v1';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<UsuarioLocal | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [temUsuariosCadastrados, setTemUsuariosCadastrados] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      await dbLocal.inicializar();
      const todos = dbLocal.obterUsuarios();
      setTemUsuariosCadastrados(todos.length > 0);

      const userIdSalvo = localStorage.getItem(SESSION_KEY);
      if (userIdSalvo) {
        const u = dbLocal.obterUsuarioPorId(userIdSalvo);
        if (u) {
          setUsuario(u);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
      setCarregando(false);
    };
    init();
  }, []);

  const cadastrar = async (
    nome: string,
    email: string,
    pin: string,
    perguntaRecuperacao: string,
    respostaRecuperacao: string
  ): Promise<{ sucesso: boolean; mensagem?: string }> => {
    if (!nome.trim()) return { sucesso: false, mensagem: 'Informe seu nome.' };
    if (!pin || pin.length < 4) return { sucesso: false, mensagem: 'O PIN deve ter no mínimo 4 dígitos.' };

    const emailLimpo = email.trim().toLowerCase();
    if (emailLimpo) {
      const existente = dbLocal.obterUsuarioPorEmail(emailLimpo);
      if (existente) {
        return { sucesso: false, mensagem: 'Já existe um perfil local cadastrado com este e-mail.' };
      }
    }

    const salt = gerarSaltAleatorio(16);
    const pinHash = await gerarHashSeguro(pin, salt);
    const respostaHash = respostaRecuperacao.trim()
      ? await gerarHashSeguro(respostaRecuperacao.trim().toLowerCase(), salt)
      : '';

    const novoUsuario: UsuarioLocal = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      nome: nome.trim(),
      email: emailLimpo || undefined,
      pinHash,
      salt,
      perguntaRecuperacao: perguntaRecuperacao.trim() || 'Qual o nome do seu primeiro animal de estimação?',
      respostaHash,
      criadoEm: new Date().toISOString(),
    };

    dbLocal.inserirUsuario(novoUsuario);
    localStorage.setItem(SESSION_KEY, novoUsuario.id);
    setUsuario(novoUsuario);
    setTemUsuariosCadastrados(true);

    return { sucesso: true };
  };

  const login = async (email: string, pin: string): Promise<{ sucesso: boolean; mensagem?: string }> => {
    const emailLimpo = email.trim().toLowerCase();
    let userAlvo: UsuarioLocal | undefined;

    if (emailLimpo) {
      userAlvo = dbLocal.obterUsuarioPorEmail(emailLimpo);
    }

    if (!userAlvo) {
      // Se não encontrou por email, tenta verificar se há um único usuário local
      const usuarios = dbLocal.obterUsuarios();
      if (usuarios.length === 1 && !emailLimpo) {
        userAlvo = usuarios[0];
      }
    }

    if (!userAlvo) {
      return { sucesso: false, mensagem: 'Perfil não encontrado neste dispositivo.' };
    }

    const pinCorreto = await verificarHash(pin, userAlvo.salt, userAlvo.pinHash);
    if (!pinCorreto) {
      return { sucesso: false, mensagem: 'PIN de acesso incorreto.' };
    }

    localStorage.setItem(SESSION_KEY, userAlvo.id);
    setUsuario(userAlvo);
    return { sucesso: true };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUsuario(null);
  };

  const recuperarAcesso = async (
    email: string,
    resposta: string,
    novoPin: string
  ): Promise<{ sucesso: boolean; mensagem?: string }> => {
    const emailLimpo = email.trim().toLowerCase();
    const userAlvo = dbLocal.obterUsuarioPorEmail(emailLimpo);

    if (!userAlvo) {
      return { sucesso: false, mensagem: 'Nenhum perfil localizado com este e-mail.' };
    }

    if (!userAlvo.respostaHash) {
      return { sucesso: false, mensagem: 'Este perfil não configurou uma resposta de recuperação.' };
    }

    const respostaCorreta = await verificarHash(resposta.trim().toLowerCase(), userAlvo.salt, userAlvo.respostaHash);
    if (!respostaCorreta) {
      return { sucesso: false, mensagem: 'Resposta de segurança incorreta.' };
    }

    if (novoPin.length < 4) {
      return { sucesso: false, mensagem: 'O novo PIN deve possuir ao menos 4 dígitos.' };
    }

    const novoPinHash = await gerarHashSeguro(novoPin, userAlvo.salt);
    const userAtualizado: UsuarioLocal = {
      ...userAlvo,
      pinHash: novoPinHash,
    };

    dbLocal.atualizarUsuario(userAtualizado);
    localStorage.setItem(SESSION_KEY, userAtualizado.id);
    setUsuario(userAtualizado);

    return { sucesso: true, mensagem: 'PIN atualizado com sucesso!' };
  };

  const alterarPin = async (
    pinAtual: string,
    novoPin: string
  ): Promise<{ sucesso: boolean; mensagem?: string }> => {
    if (!usuario) return { sucesso: false, mensagem: 'Nenhum usuário ativo.' };

    const pinValido = await verificarHash(pinAtual, usuario.salt, usuario.pinHash);
    if (!pinValido) {
      return { sucesso: false, mensagem: 'O PIN atual informado está incorreto.' };
    }

    if (novoPin.length < 4) {
      return { sucesso: false, mensagem: 'O novo PIN deve ter pelo menos 4 dígitos.' };
    }

    const novoPinHash = await gerarHashSeguro(novoPin, usuario.salt);
    const atualizado: UsuarioLocal = {
      ...usuario,
      pinHash: novoPinHash,
    };

    dbLocal.atualizarUsuario(atualizado);
    setUsuario(atualizado);
    return { sucesso: true, mensagem: 'PIN alterado com sucesso!' };
  };

  const excluirConta = () => {
    if (!usuario) return;
    dbLocal.excluirUsuario(usuario.id, true);
    localStorage.removeItem(SESSION_KEY);
    setUsuario(null);
    setTemUsuariosCadastrados(dbLocal.obterUsuarios().length > 0);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        cadastrar,
        login,
        logout,
        recuperarAcesso,
        alterarPin,
        excluirConta,
        temUsuariosCadastrados,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
