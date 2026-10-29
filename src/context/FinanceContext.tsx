/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { gerarDicasDeterministicas } from '../engine/recommendations.ts';
import { dbLocal } from '../storage/db.ts';
import {
  Categoria,
  ContribuicaoMeta,
  DicaEconomia,
  Meta,
  Orcamento,
  Recorrencia,
  Transacao,
} from '../types/index.ts';
import { obterDataHojeISO } from '../utils/formatters.ts';
import { useAuth } from './AuthContext.tsx';

interface FinanceContextType {
  // Estado e navegação temporal
  anoSelecionado: number;
  mesSelecionado: number;
  avancarMes: () => void;
  voltarMes: () => void;
  definirMesAno: (ano: number, mes: number) => void;

  // Coleções
  transacoes: Transacao[];
  transacoesMes: Transacao[];
  categorias: Categoria[];
  metas: Meta[];
  contribuicoes: ContribuicaoMeta[];
  orcamentosMes: Orcamento[];
  recorrencias: Recorrencia[];
  dicas: DicaEconomia[];

  // Métricas calculadas em centavos inteiros
  saldoTotalDisponivelCentavos: number;
  saldoBrutoAcumuladoCentavos: number;
  totalReservadoMetasCentavos: number;
  receitasMesCentavos: number;
  despesasMesCentavos: number;
  resultadoMesCentavos: number;

  // Orçamento Geral
  orcamentoGeralMes: Orcamento | null;
  gastoOrcamentoGeralCentavos: number;
  restanteOrcamentoGeralCentavos: number;

  // Ações CRUD
  adicionarTransacao: (transacao: Omit<Transacao, 'id' | 'userId' | 'criadoEm' | 'atualizadoEm'>) => void;
  editarTransacao: (transacao: Transacao) => void;
  excluirTransacao: (id: string) => void;

  adicionarCategoria: (cat: Omit<Categoria, 'id' | 'userId' | 'padrao'>) => void;
  editarCategoria: (cat: Categoria) => void;
  excluirCategoria: (id: string) => { sucesso: boolean; mensagem?: string };

  adicionarMeta: (meta: Omit<Meta, 'id' | 'userId' | 'criadoEm'>) => void;
  editarMeta: (meta: Meta) => void;
  excluirMeta: (id: string) => void;
  adicionarContribuicaoMeta: (metaId: string, valorCentavos: number, observacao?: string) => void;
  obterTotalAportadoMeta: (metaId: string) => number;

  definirOrcamento: (categoriaId: string | null, limiteCentavos: number) => void;
  excluirOrcamento: (id: string) => void;

  adicionarRecorrencia: (rec: Omit<Recorrencia, 'id' | 'userId' | 'criadoEm'>) => void;
  editarRecorrencia: (rec: Recorrencia) => void;
  excluirRecorrencia: (id: string) => void;
  efetivarRecorrenciaNoMes: (recorrenciaId: string) => { sucesso: boolean; mensagem: string };

  exportarBackup: () => string;
  importarBackup: (json: string) => { sucesso: boolean; mensagem: string };
  limparDadosLocais: () => void;
  carregarDadosExemplo: () => void;
  recarregarDados: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario } = useAuth();
  const hoje = new Date();

  const [anoSelecionado, setAnoSelecionado] = useState<number>(hoje.getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState<number>(hoje.getMonth() + 1);

  // Estados locais sincronizados com o SQLite
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [contribuicoes, setContribuicoes] = useState<ContribuicaoMeta[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [recorrencias, setRecorrencias] = useState<Recorrencia[]>([]);

  const recarregarDados = useCallback(() => {
    if (!usuario) {
      setTransacoes([]);
      setCategorias([]);
      setMetas([]);
      setContribuicoes([]);
      setOrcamentos([]);
      setRecorrencias([]);
      return;
    }

    dbLocal.seedCategoriasPadrao(usuario.id);
    setTransacoes(dbLocal.obterTransacoes(usuario.id));
    setCategorias(dbLocal.obterCategorias(usuario.id));
    setMetas(dbLocal.obterMetas(usuario.id));
    setContribuicoes(dbLocal.obterContribuicoes(usuario.id));
    setOrcamentos(dbLocal.obterOrcamentos(usuario.id, anoSelecionado, mesSelecionado));
    setRecorrencias(dbLocal.obterRecorrencias(usuario.id));
  }, [usuario, anoSelecionado, mesSelecionado]);

  useEffect(() => {
    recarregarDados();
  }, [recarregarDados]);

  // Navegação de mês
  const avancarMes = () => {
    if (mesSelecionado === 12) {
      setMesSelecionado(1);
      setAnoSelecionado(prev => prev + 1);
    } else {
      setMesSelecionado(prev => prev + 1);
    }
  };

  const voltarMes = () => {
    if (mesSelecionado === 1) {
      setMesSelecionado(12);
      setAnoSelecionado(prev => prev - 1);
    } else {
      setMesSelecionado(prev => prev - 1);
    }
  };

  const definirMesAno = (ano: number, mes: number) => {
    setAnoSelecionado(ano);
    setMesSelecionado(mes);
  };

  // Filtragem de transações do mês selecionado
  const transacoesMes = useMemo(() => {
    const mesStr = String(mesSelecionado).padStart(2, '0');
    const prefixo = `${anoSelecionado}-${mesStr}`;
    return transacoes.filter(t => t.data.startsWith(prefixo));
  }, [transacoes, anoSelecionado, mesSelecionado]);

  // Transações do mês anterior (para comparações determinísticas)
  const transacoesMesAnterior = useMemo(() => {
    let mesAnt = mesSelecionado - 1;
    let anoAnt = anoSelecionado;
    if (mesAnt === 0) {
      mesAnt = 12;
      anoAnt -= 1;
    }
    const mesStr = String(mesAnt).padStart(2, '0');
    const prefixo = `${anoAnt}-${mesStr}`;
    return transacoes.filter(t => t.data.startsWith(prefixo));
  }, [transacoes, anoSelecionado, mesSelecionado]);

  // Métricas do Mês
  const receitasMesCentavos = useMemo(() => {
    return transacoesMes
      .filter(t => t.tipo === 'RECEITA')
      .reduce((sum, t) => sum + t.valorCentavos, 0);
  }, [transacoesMes]);

  const despesasMesCentavos = useMemo(() => {
    return transacoesMes
      .filter(t => t.tipo === 'DESPESA')
      .reduce((sum, t) => sum + t.valorCentavos, 0);
  }, [transacoesMes]);

  const resultadoMesCentavos = receitasMesCentavos - despesasMesCentavos;

  // Total acumulado em metas ativas
  const totalReservadoMetasCentavos = useMemo(() => {
    const idsMetasAtivas = new Set(
      metas.filter(m => m.status === 'EM_ANDAMENTO').map(m => m.id)
    );
    return contribuicoes
      .filter(c => idsMetasAtivas.has(c.metaId))
      .reduce((sum, c) => sum + c.valorCentavos, 0);
  }, [metas, contribuicoes]);

  // Saldo Bruto Histórico (Todas as Receitas - Todas as Despesas de consumo)
  const saldoBrutoAcumuladoCentavos = useMemo(() => {
    const recTotal = transacoes
      .filter(t => t.tipo === 'RECEITA')
      .reduce((sum, t) => sum + t.valorCentavos, 0);
    const despTotal = transacoes
      .filter(t => t.tipo === 'DESPESA')
      .reduce((sum, t) => sum + t.valorCentavos, 0);
    return recTotal - despTotal;
  }, [transacoes]);

  // Saldo Líquido Disponível Livre (Descontando as reservas alocadas para metas)
  const saldoTotalDisponivelCentavos = useMemo(() => {
    return saldoBrutoAcumuladoCentavos - totalReservadoMetasCentavos;
  }, [saldoBrutoAcumuladoCentavos, totalReservadoMetasCentavos]);

  // Orçamento Geral
  const orcamentosMes = useMemo(() => {
    if (!usuario) return [];
    return dbLocal.obterOrcamentos(usuario.id, anoSelecionado, mesSelecionado);
  }, [usuario, anoSelecionado, mesSelecionado, orcamentos]);

  const orcamentoGeralMes = useMemo(() => {
    return orcamentosMes.find(o => o.categoriaId === null) || null;
  }, [orcamentosMes]);

  const gastoOrcamentoGeralCentavos = despesasMesCentavos;
  const restanteOrcamentoGeralCentavos = orcamentoGeralMes
    ? Math.max(0, orcamentoGeralMes.limiteCentavos - gastoOrcamentoGeralCentavos)
    : 0;

  // Dicas Determinísticas em Tempo Real
  const dicas = useMemo(() => {
    return gerarDicasDeterministicas({
      transacoesMesAtual: transacoesMes,
      transacoesMesAnterior,
      categorias,
      metas,
      orcamentos: orcamentosMes,
      recorrencias,
      mesAtual: mesSelecionado,
      anoAtual: anoSelecionado,
    });
  }, [
    transacoesMes,
    transacoesMesAnterior,
    categorias,
    metas,
    orcamentosMes,
    recorrencias,
    mesSelecionado,
    anoSelecionado,
  ]);

  // ==========================================
  // OPERAÇÕES TRANSAÇÕES
  // ==========================================
  const adicionarTransacao = (dados: Omit<Transacao, 'id' | 'userId' | 'criadoEm' | 'atualizadoEm'>) => {
    if (!usuario) return;
    const agora = new Date().toISOString();
    const nova: Transacao = {
      ...dados,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: usuario.id,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    dbLocal.inserirTransacao(nova);
    recarregarDados();
  };

  const editarTransacao = (transacao: Transacao) => {
    if (!usuario) return;
    dbLocal.atualizarTransacao(transacao);
    recarregarDados();
  };

  const excluirTransacao = (id: string) => {
    if (!usuario) return;
    dbLocal.excluirTransacao(id, usuario.id);
    recarregarDados();
  };

  // ==========================================
  // OPERAÇÕES CATEGORIAS
  // ==========================================
  const adicionarCategoria = (dados: Omit<Categoria, 'id' | 'userId' | 'padrao'>) => {
    if (!usuario) return;
    const nova: Categoria = {
      ...dados,
      id: `cat_custom_${Date.now()}`,
      userId: usuario.id,
      padrao: false,
    };
    dbLocal.inserirCategoria(nova);
    recarregarDados();
  };

  const editarCategoria = (cat: Categoria) => {
    if (!usuario) return;
    dbLocal.atualizarCategoria(cat);
    recarregarDados();
  };

  const excluirCategoria = (id: string) => {
    if (!usuario) return { sucesso: false, mensagem: 'Usuário não conectado.' };
    const sucesso = dbLocal.excluirCategoria(id, usuario.id);
    if (!sucesso) {
      return {
        sucesso: false,
        mensagem: 'Não é possível excluir uma categoria que possui transações vinculadas.',
      };
    }
    recarregarDados();
    return { sucesso: true };
  };

  // ==========================================
  // OPERAÇÕES METAS
  // ==========================================
  const adicionarMeta = (dados: Omit<Meta, 'id' | 'userId' | 'criadoEm'>) => {
    if (!usuario) return;
    const nova: Meta = {
      ...dados,
      id: `meta_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: usuario.id,
      criadoEm: new Date().toISOString(),
    };
    dbLocal.inserirMeta(nova);
    recarregarDados();
  };

  const editarMeta = (meta: Meta) => {
    if (!usuario) return;
    dbLocal.atualizarMeta(meta);
    recarregarDados();
  };

  const excluirMeta = (id: string) => {
    if (!usuario) return;
    dbLocal.excluirMeta(id, usuario.id);
    recarregarDados();
  };

  const adicionarContribuicaoMeta = (metaId: string, valorCentavos: number, observacao?: string) => {
    if (!usuario) return;
    const nova: ContribuicaoMeta = {
      id: `ctb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      metaId,
      userId: usuario.id,
      valorCentavos,
      data: obterDataHojeISO(),
      observacao,
      criadoEm: new Date().toISOString(),
    };
    dbLocal.inserirContribuicao(nova);

    // Checar se a meta atingiu 100%
    const totalAportado = dbLocal
      .obterContribuicoes(usuario.id, metaId)
      .reduce((s, c) => s + c.valorCentavos, 0) + valorCentavos;
    const meta = metas.find(m => m.id === metaId);
    if (meta && totalAportado >= meta.valorAlvoCentavos && meta.status === 'EM_ANDAMENTO') {
      dbLocal.atualizarMeta({
        ...meta,
        status: 'CONCLUIDA',
      });
    }

    recarregarDados();
  };

  const obterTotalAportadoMeta = (metaId: string): number => {
    return contribuicoes
      .filter(c => c.metaId === metaId)
      .reduce((acc, c) => acc + c.valorCentavos, 0);
  };

  // ==========================================
  // OPERAÇÕES ORÇAMENTOS
  // ==========================================
  const definirOrcamento = (categoriaId: string | null, limiteCentavos: number) => {
    if (!usuario) return;
    const novo: Orcamento = {
      id: `orc_${usuario.id}_${anoSelecionado}_${mesSelecionado}_${categoriaId || 'geral'}`,
      userId: usuario.id,
      ano: anoSelecionado,
      mes: mesSelecionado,
      categoriaId,
      limiteCentavos,
      alertaPercentual: 80,
      criadoEm: new Date().toISOString(),
    };
    dbLocal.salvarOrcamento(novo);
    recarregarDados();
  };

  const excluirOrcamento = (id: string) => {
    if (!usuario) return;
    dbLocal.excluirOrcamento(id, usuario.id);
    recarregarDados();
  };

  // ==========================================
  // OPERAÇÕES RECORRÊNCIAS
  // ==========================================
  const adicionarRecorrencia = (dados: Omit<Recorrencia, 'id' | 'userId' | 'criadoEm'>) => {
    if (!usuario) return;
    const nova: Recorrencia = {
      ...dados,
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: usuario.id,
      criadoEm: new Date().toISOString(),
    };
    dbLocal.inserirRecorrencia(nova);
    recarregarDados();
  };

  const editarRecorrencia = (rec: Recorrencia) => {
    if (!usuario) return;
    dbLocal.atualizarRecorrencia(rec);
    recarregarDados();
  };

  const excluirRecorrencia = (id: string) => {
    if (!usuario) return;
    dbLocal.excluirRecorrencia(id, usuario.id);
    recarregarDados();
  };

  const efetivarRecorrenciaNoMes = (recorrenciaId: string): { sucesso: boolean; mensagem: string } => {
    if (!usuario) return { sucesso: false, mensagem: 'Usuário não conectado.' };
    const rec = recorrencias.find(r => r.id === recorrenciaId);
    if (!rec) return { sucesso: false, mensagem: 'Recorrência não encontrada.' };

    const mesStr = String(mesSelecionado).padStart(2, '0');
    const prefixo = `${anoSelecionado}-${mesStr}`;

    // Prevenção estrita de duplicações no mesmo mês
    const jaLancado = transacoes.some(
      t => t.recorrenciaId === recorrenciaId && t.data.startsWith(prefixo)
    );

    if (jaLancado) {
      return {
        sucesso: false,
        mensagem: 'Esta despesa recorrente já foi registrada neste mês!',
      };
    }

    const dataLancamento = `${prefixo}-10`; // Registra no mês selecionado
    adicionarTransacao({
      tipo: 'DESPESA',
      valorCentavos: rec.valorPrevistoCentavos,
      descricao: `${rec.descricao} (Recorrente)`,
      categoriaId: rec.categoriaId,
      data: dataLancamento,
      natureza: 'RECORRENTE',
      recorrenciaId: rec.id,
    });

    return { sucesso: true, mensagem: `Lançamento de ${rec.descricao} efetuado com sucesso!` };
  };

  // ==========================================
  // BACKUP E PURGA
  // ==========================================
  const exportarBackup = () => {
    if (!usuario) return '';
    return dbLocal.exportarBackupLocal(usuario.id);
  };

  const importarBackup = (json: string) => {
    if (!usuario) return { sucesso: false, mensagem: 'Usuário não conectado.' };
    const res = dbLocal.importarBackupLocal(usuario.id, json);
    recarregarDados();
    return res;
  };

  const limparDadosLocais = () => {
    if (!usuario) return;
    dbLocal.limparDadosDoUsuario(usuario.id);
    recarregarDados();
  };

  const carregarDadosExemplo = () => {
    if (!usuario) return;
    dbLocal.carregarDadosExemplo(usuario.id);
    recarregarDados();
  };

  return (
    <FinanceContext.Provider
      value={{
        anoSelecionado,
        mesSelecionado,
        avancarMes,
        voltarMes,
        definirMesAno,
        transacoes,
        transacoesMes,
        categorias,
        metas,
        contribuicoes,
        orcamentosMes,
        recorrencias,
        dicas,
        saldoTotalDisponivelCentavos,
        saldoBrutoAcumuladoCentavos,
        totalReservadoMetasCentavos,
        receitasMesCentavos,
        despesasMesCentavos,
        resultadoMesCentavos,
        orcamentoGeralMes,
        gastoOrcamentoGeralCentavos,
        restanteOrcamentoGeralCentavos,
        adicionarTransacao,
        editarTransacao,
        excluirTransacao,
        adicionarCategoria,
        editarCategoria,
        excluirCategoria,
        adicionarMeta,
        editarMeta,
        excluirMeta,
        adicionarContribuicaoMeta,
        obterTotalAportadoMeta,
        definirOrcamento,
        excluirOrcamento,
        adicionarRecorrencia,
        editarRecorrencia,
        excluirRecorrencia,
        efetivarRecorrenciaNoMes,
        exportarBackup,
        importarBackup,
        limparDadosLocais,
        carregarDadosExemplo,
        recarregarDados,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser utilizado dentro de um FinanceProvider');
  }
  return context;
};
