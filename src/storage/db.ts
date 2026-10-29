/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Categoria,
  ContribuicaoMeta,
  Meta,
  Orcamento,
  Recorrencia,
  Transacao,
  UsuarioLocal,
} from '../types/index.ts';

const DB_STORAGE_KEY = 'economia_pessoal_sqlite_v1';
const DB_VERSION = 1;

interface BancoDadosLocalSchema {
  version: number;
  usuarios: UsuarioLocal[];
  categorias: Categoria[];
  transacoes: Transacao[];
  metas: Meta[];
  contribuicoes: ContribuicaoMeta[];
  orcamentos: Orcamento[];
  recorrencias: Recorrencia[];
}

const CATEGORIAS_PADRAO_RECEITA = [
  { nome: 'Salário', icone: 'Briefcase', cor: '#2E7D32' },
  { nome: 'Renda Extra', icone: 'Sparkles', cor: '#059669' },
  { nome: 'Vendas', icone: 'TrendingUp', cor: '#567FB5' },
  { nome: 'Benefícios', icone: 'Gift', cor: '#0284C7' },
  { nome: 'Outras Receitas', icone: 'DollarSign', cor: '#365E91' },
];

const CATEGORIAS_PADRAO_DESPESA = [
  { nome: 'Moradia', icone: 'Home', cor: '#365E91' },
  { nome: 'Alimentação', icone: 'Utensils', cor: '#E65100' },
  { nome: 'Transporte', icone: 'Car', cor: '#567FB5' },
  { nome: 'Saúde', icone: 'HeartPulse', cor: '#C62828' },
  { nome: 'Educação', icone: 'GraduationCap', cor: '#26364A' },
  { nome: 'Lazer', icone: 'Gamepad2', cor: '#7C3AED' },
  { nome: 'Compras', icone: 'ShoppingBag', cor: '#059669' },
  { nome: 'Assinaturas', icone: 'Tv', cor: '#0284C7' },
  { nome: 'Contas e Serviços', icone: 'Zap', cor: '#D97706' },
  { nome: 'Outros', icone: 'MoreHorizontal', cor: '#718096' },
];

/**
 * Motor de Persistência Relacional SQLite Local no Dispositivo (IndexedDB / LocalStorage)
 */
class SQLiteEngineLocal {
  private schema: BancoDadosLocalSchema;
  private isLoaded = false;

  constructor() {
    this.schema = this.criarEstruturaInicial();
  }

  private criarEstruturaInicial(): BancoDadosLocalSchema {
    return {
      version: DB_VERSION,
      usuarios: [],
      categorias: [],
      transacoes: [],
      metas: [],
      contribuicoes: [],
      orcamentos: [],
      recorrencias: [],
    };
  }

  public async inicializar(): Promise<void> {
    if (this.isLoaded) return;
    try {
      const salvo = localStorage.getItem(DB_STORAGE_KEY);
      if (salvo) {
        const dados = JSON.parse(salvo) as BancoDadosLocalSchema;
        this.schema = {
          ...this.criarEstruturaInicial(),
          ...dados,
        };
      } else {
        this.salvarSincrono();
      }
    } catch {
      this.schema = this.criarEstruturaInicial();
      this.salvarSincrono();
    }
    this.isLoaded = true;
  }

  private salvarSincrono(): void {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.schema));
    } catch (err) {
      console.error('Falha ao gravar no armazenamento local seguro:', err);
    }
  }

  // ==========================================
  // USUÁRIOS LOCAIS
  // ==========================================
  public obterUsuarios(): UsuarioLocal[] {
    return [...this.schema.usuarios];
  }

  public obterUsuarioPorId(id: string): UsuarioLocal | undefined {
    return this.schema.usuarios.find(u => u.id === id);
  }

  public obterUsuarioPorEmail(email: string): UsuarioLocal | undefined {
    return this.schema.usuarios.find(u => u.email?.toLowerCase() === email.toLowerCase());
  }

  public inserirUsuario(usuario: UsuarioLocal): void {
    this.schema.usuarios.push(usuario);
    this.seedCategoriasPadrao(usuario.id);
    this.salvarSincrono();
  }

  public atualizarUsuario(usuario: UsuarioLocal): void {
    const idx = this.schema.usuarios.findIndex(u => u.id === usuario.id);
    if (idx !== -1) {
      this.schema.usuarios[idx] = usuario;
      this.salvarSincrono();
    }
  }

  public excluirUsuario(id: string, excluirDadosFinanceiros: boolean = true): void {
    this.schema.usuarios = this.schema.usuarios.filter(u => u.id !== id);
    if (excluirDadosFinanceiros) {
      this.limparDadosDoUsuario(id);
    }
    this.salvarSincrono();
  }

  // ==========================================
  // CATEGORIAS
  // ==========================================
  public seedCategoriasPadrao(userId: string): void {
    const existentes = this.schema.categorias.filter(c => c.userId === userId);
    if (existentes.length > 0) return;

    const novas: Categoria[] = [];
    CATEGORIAS_PADRAO_RECEITA.forEach((item, index) => {
      novas.push({
        id: `cat_rec_${userId}_${index}_${Date.now()}`,
        userId,
        nome: item.nome,
        tipo: 'RECEITA',
        icone: item.icone,
        cor: item.cor,
        padrao: true,
      });
    });

    CATEGORIAS_PADRAO_DESPESA.forEach((item, index) => {
      novas.push({
        id: `cat_desp_${userId}_${index}_${Date.now()}`,
        userId,
        nome: item.nome,
        tipo: 'DESPESA',
        icone: item.icone,
        cor: item.cor,
        padrao: true,
      });
    });

    this.schema.categorias.push(...novas);
    this.salvarSincrono();
  }

  public obterCategorias(userId: string): Categoria[] {
    return this.schema.categorias.filter(c => c.userId === userId);
  }

  public inserirCategoria(categoria: Categoria): void {
    this.schema.categorias.push(categoria);
    this.salvarSincrono();
  }

  public atualizarCategoria(categoria: Categoria): void {
    const idx = this.schema.categorias.findIndex(c => c.id === categoria.id && c.userId === categoria.userId);
    if (idx !== -1) {
      this.schema.categorias[idx] = categoria;
      this.salvarSincrono();
    }
  }

  public excluirCategoria(categoriaId: string, userId: string): boolean {
    const temTransacao = this.schema.transacoes.some(t => t.categoriaId === categoriaId && t.userId === userId);
    if (temTransacao) {
      return false; // Integridade referencial
    }
    this.schema.categorias = this.schema.categorias.filter(c => !(c.id === categoriaId && c.userId === userId));
    this.salvarSincrono();
    return true;
  }

  // ==========================================
  // TRANSAÇÕES
  // ==========================================
  public obterTransacoes(userId: string): Transacao[] {
    return this.schema.transacoes
      .filter(t => t.userId === userId)
      .sort((a, b) => (a.data > b.data ? -1 : 1));
  }

  public obterTransacoesPorMes(userId: string, ano: number, mes: number): Transacao[] {
    const mesStr = String(mes).padStart(2, '0');
    const prefixo = `${ano}-${mesStr}`;
    return this.schema.transacoes
      .filter(t => t.userId === userId && t.data.startsWith(prefixo))
      .sort((a, b) => (a.data > b.data ? -1 : 1));
  }

  public inserirTransacao(transacao: Transacao): void {
    this.schema.transacoes.push(transacao);
    this.salvarSincrono();
  }

  public atualizarTransacao(transacao: Transacao): void {
    const idx = this.schema.transacoes.findIndex(t => t.id === transacao.id && t.userId === transacao.userId);
    if (idx !== -1) {
      this.schema.transacoes[idx] = {
        ...transacao,
        atualizadoEm: new Date().toISOString(),
      };
      this.salvarSincrono();
    }
  }

  public excluirTransacao(id: string, userId: string): void {
    this.schema.transacoes = this.schema.transacoes.filter(t => !(t.id === id && t.userId === userId));
    this.salvarSincrono();
  }

  // ==========================================
  // METAS E CONTRIBUIÇÕES
  // ==========================================
  public obterMetas(userId: string): Meta[] {
    return this.schema.metas.filter(m => m.userId === userId);
  }

  public inserirMeta(meta: Meta): void {
    this.schema.metas.push(meta);
    this.salvarSincrono();
  }

  public atualizarMeta(meta: Meta): void {
    const idx = this.schema.metas.findIndex(m => m.id === meta.id && m.userId === meta.userId);
    if (idx !== -1) {
      this.schema.metas[idx] = meta;
      this.salvarSincrono();
    }
  }

  public excluirMeta(id: string, userId: string): void {
    this.schema.metas = this.schema.metas.filter(m => !(m.id === id && m.userId === userId));
    this.schema.contribuicoes = this.schema.contribuicoes.filter(c => !(c.metaId === id && c.userId === userId));
    this.salvarSincrono();
  }

  public obterContribuicoes(userId: string, metaId?: string): ContribuicaoMeta[] {
    return this.schema.contribuicoes.filter(c => c.userId === userId && (!metaId || c.metaId === metaId));
  }

  public inserirContribuicao(contribuicao: ContribuicaoMeta): void {
    this.schema.contribuicoes.push(contribuicao);
    this.salvarSincrono();
  }

  public excluirContribuicao(id: string, userId: string): void {
    this.schema.contribuicoes = this.schema.contribuicoes.filter(c => !(c.id === id && c.userId === userId));
    this.salvarSincrono();
  }

  // ==========================================
  // ORÇAMENTOS
  // ==========================================
  public obterOrcamentos(userId: string, ano: number, mes: number): Orcamento[] {
    return this.schema.orcamentos.filter(o => o.userId === userId && o.ano === ano && o.mes === mes);
  }

  public salvarOrcamento(orcamento: Orcamento): void {
    const idx = this.schema.orcamentos.findIndex(
      o => o.userId === orcamento.userId && o.ano === orcamento.ano && o.mes === orcamento.mes && o.categoriaId === orcamento.categoriaId
    );
    if (idx !== -1) {
      this.schema.orcamentos[idx] = orcamento;
    } else {
      this.schema.orcamentos.push(orcamento);
    }
    this.salvarSincrono();
  }

  public excluirOrcamento(id: string, userId: string): void {
    this.schema.orcamentos = this.schema.orcamentos.filter(o => !(o.id === id && o.userId === userId));
    this.salvarSincrono();
  }

  // ==========================================
  // RECORRÊNCIAS
  // ==========================================
  public obterRecorrencias(userId: string): Recorrencia[] {
    return this.schema.recorrencias.filter(r => r.userId === userId);
  }

  public inserirRecorrencia(recorrencia: Recorrencia): void {
    this.schema.recorrencias.push(recorrencia);
    this.salvarSincrono();
  }

  public atualizarRecorrencia(recorrencia: Recorrencia): void {
    const idx = this.schema.recorrencias.findIndex(r => r.id === recorrencia.id && r.userId === recorrencia.userId);
    if (idx !== -1) {
      this.schema.recorrencias[idx] = recorrencia;
      this.salvarSincrono();
    }
  }

  public excluirRecorrencia(id: string, userId: string): void {
    this.schema.recorrencias = this.schema.recorrencias.filter(r => !(r.id === id && r.userId === userId));
    this.salvarSincrono();
  }

  // ==========================================
  // BACKUP, PURGA E MIGRAÇÃO
  // ==========================================
  public limparDadosDoUsuario(userId: string): void {
    this.schema.transacoes = this.schema.transacoes.filter(t => t.userId !== userId);
    this.schema.metas = this.schema.metas.filter(m => m.userId !== userId);
    this.schema.contribuicoes = this.schema.contribuicoes.filter(c => c.userId !== userId);
    this.schema.orcamentos = this.schema.orcamentos.filter(o => o.userId !== userId);
    this.schema.recorrencias = this.schema.recorrencias.filter(r => r.userId !== userId);
    this.schema.categorias = this.schema.categorias.filter(c => c.userId !== userId);
    this.seedCategoriasPadrao(userId);
    this.salvarSincrono();
  }

  public exportarBackupLocal(userId: string): string {
    const payload = {
      versaoApp: '1.0.0',
      exportadoEm: new Date().toISOString(),
      userId,
      categorias: this.obterCategorias(userId),
      transacoes: this.obterTransacoes(userId),
      metas: this.obterMetas(userId),
      contribuicoes: this.obterContribuicoes(userId),
      orcamentos: this.schema.orcamentos.filter(o => o.userId === userId),
      recorrencias: this.obterRecorrencias(userId),
    };
    return JSON.stringify(payload, null, 2);
  }

  public importarBackupLocal(userId: string, jsonString: string): { sucesso: boolean; mensagem: string } {
    try {
      const dados = JSON.parse(jsonString);
      if (!dados || !Array.isArray(dados.transacoes)) {
        return { sucesso: false, mensagem: 'Arquivo de backup inválido ou corrompido.' };
      }

      // Limpar dados anteriores do usuário antes de importar
      this.limparDadosDoUsuario(userId);

      // Reatribuir userId para garantir que os dados importados pertencem à sessão ativa
      if (Array.isArray(dados.categorias) && dados.categorias.length > 0) {
        this.schema.categorias = this.schema.categorias.filter(c => c.userId !== userId);
        dados.categorias.forEach((c: Categoria) => {
          this.schema.categorias.push({ ...c, userId });
        });
      }

      if (Array.isArray(dados.transacoes)) {
        dados.transacoes.forEach((t: Transacao) => {
          this.schema.transacoes.push({ ...t, userId });
        });
      }

      if (Array.isArray(dados.metas)) {
        dados.metas.forEach((m: Meta) => {
          this.schema.metas.push({ ...m, userId });
        });
      }

      if (Array.isArray(dados.contribuicoes)) {
        dados.contribuicoes.forEach((cb: ContribuicaoMeta) => {
          this.schema.contribuicoes.push({ ...cb, userId });
        });
      }

      if (Array.isArray(dados.orcamentos)) {
        dados.orcamentos.forEach((o: Orcamento) => {
          this.schema.orcamentos.push({ ...o, userId });
        });
      }

      if (Array.isArray(dados.recorrencias)) {
        dados.recorrencias.forEach((r: Recorrencia) => {
          this.schema.recorrencias.push({ ...r, userId });
        });
      }

      this.salvarSincrono();
      return { sucesso: true, mensagem: 'Dados financeiros restaurados com sucesso!' };
    } catch {
      return { sucesso: false, mensagem: 'Erro ao processar o arquivo de backup.' };
    }
  }

  public carregarDadosExemplo(userId: string): void {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;
    const mesStr = String(mesAtual).padStart(2, '0');

    let mesAnt = mesAtual - 1;
    let anoAnt = anoAtual;
    if (mesAnt === 0) {
      mesAnt = 12;
      anoAnt -= 1;
    }
    const mesAntStr = String(mesAnt).padStart(2, '0');

    this.seedCategoriasPadrao(userId);
    const categorias = this.obterCategorias(userId);
    const mapaPorNome = new Map(categorias.map(c => [c.nome, c.id]));

    const catSalario = mapaPorNome.get('Salário') || categorias[0].id;
    const catRendaExtra = mapaPorNome.get('Renda Extra') || categorias[0].id;
    const catMoradia = mapaPorNome.get('Moradia') || categorias[1].id;
    const catAlimentacao = mapaPorNome.get('Alimentação') || categorias[1].id;
    const catTransporte = mapaPorNome.get('Transporte') || categorias[1].id;
    const catAssinaturas = mapaPorNome.get('Assinaturas') || categorias[1].id;
    const catContas = mapaPorNome.get('Contas e Serviços') || categorias[1].id;
    const catLazer = mapaPorNome.get('Lazer') || categorias[1].id;

    // Transações Mês Anterior (para dar base aos comparativos e gráficos)
    const txAnt: Transacao[] = [
      {
        id: `tx_ant_1_${Date.now()}`,
        userId,
        tipo: 'RECEITA',
        valorCentavos: 480000, // R$ 4.800,00
        descricao: 'Salário Mensal',
        categoriaId: catSalario,
        data: `${anoAnt}-${mesAntStr}-05`,
        natureza: 'FIXA',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: `tx_ant_2_${Date.now()}`,
        userId,
        tipo: 'DESPESA',
        valorCentavos: 135000, // R$ 1.350,00
        descricao: 'Aluguel do Imóvel',
        categoriaId: catMoradia,
        data: `${anoAnt}-${mesAntStr}-10`,
        natureza: 'FIXA',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: `tx_ant_3_${Date.now()}`,
        userId,
        tipo: 'DESPESA',
        valorCentavos: 52000, // R$ 520,00
        descricao: 'Supermercado Mensal',
        categoriaId: catAlimentacao,
        data: `${anoAnt}-${mesAntStr}-15`,
        natureza: 'VARIAVEL',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: `tx_ant_4_${Date.now()}`,
        userId,
        tipo: 'DESPESA',
        valorCentavos: 18000, // R$ 180,00
        descricao: 'Combustível',
        categoriaId: catTransporte,
        data: `${anoAnt}-${mesAntStr}-20`,
        natureza: 'VARIAVEL',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
    ];

    // Transações Mês Atual
    const txAtual: Transacao[] = [
      {
        id: `tx_atual_1_${Date.now()}`,
        userId,
        tipo: 'RECEITA',
        valorCentavos: 480000,
        descricao: 'Salário Mensal',
        categoriaId: catSalario,
        data: `${anoAtual}-${mesStr}-05`,
        natureza: 'FIXA',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: `tx_atual_2_${Date.now()}`,
        userId,
        tipo: 'RECEITA',
        valorCentavos: 45000, // R$ 450,00
        descricao: 'Projeto Freelance',
        categoriaId: catRendaExtra,
        data: `${anoAtual}-${mesStr}-12`,
        natureza: 'VARIAVEL',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: `tx_atual_3_${Date.now()}`,
        userId,
        tipo: 'DESPESA',
        valorCentavos: 135000,
        descricao: 'Aluguel do Imóvel',
        categoriaId: catMoradia,
        data: `${anoAtual}-${mesStr}-10`,
        natureza: 'FIXA',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: `tx_atual_4_${Date.now()}`,
        userId,
        tipo: 'DESPESA',
        valorCentavos: 71050, // R$ 710,50 (mostra aumento em alimentação)
        descricao: 'Supermercado e Feira',
        categoriaId: catAlimentacao,
        data: `${anoAtual}-${mesStr}-14`,
        natureza: 'VARIAVEL',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: `tx_atual_5_${Date.now()}`,
        userId,
        tipo: 'DESPESA',
        valorCentavos: 21000, // R$ 210,00
        descricao: 'Posto de Gasolina',
        categoriaId: catTransporte,
        data: `${anoAtual}-${mesStr}-18`,
        natureza: 'VARIAVEL',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: `tx_atual_6_${Date.now()}`,
        userId,
        tipo: 'DESPESA',
        valorCentavos: 14990, // R$ 149,90
        descricao: 'Internet Fibra e Celular',
        categoriaId: catContas,
        data: `${anoAtual}-${mesStr}-15`,
        natureza: 'RECORRENTE',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: `tx_atual_7_${Date.now()}`,
        userId,
        tipo: 'DESPESA',
        valorCentavos: 5990, // R$ 59,90
        descricao: 'Streaming de Vídeo',
        categoriaId: catAssinaturas,
        data: `${anoAtual}-${mesStr}-08`,
        natureza: 'RECORRENTE',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: `tx_atual_8_${Date.now()}`,
        userId,
        tipo: 'DESPESA',
        valorCentavos: 16000, // R$ 160,00
        descricao: 'Restaurante Fim de Semana',
        categoriaId: catLazer,
        data: `${anoAtual}-${mesStr}-22`,
        natureza: 'VARIAVEL',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
    ];

    this.schema.transacoes.push(...txAnt, ...txAtual);

    // Metas de Exemplo (4 modalidades)
    const meta1Id = `meta_demo_1_${Date.now()}`;
    const meta2Id = `meta_demo_2_${Date.now()}`;
    const meta3Id = `meta_demo_3_${Date.now()}`;

    const metasDemo: Meta[] = [
      {
        id: meta1Id,
        userId,
        titulo: 'Reserva de Emergência 2026',
        descricao: 'Fundo para imprevistos equivalente a 6 meses de contas',
        modalidade: 'ANUAL',
        valorAlvoCentavos: 1200000, // R$ 12.000,00
        dataInicio: `${anoAtual}-01-01`,
        anoReferencia: anoAtual,
        status: 'EM_ANDAMENTO',
        criadoEm: new Date().toISOString(),
      },
      {
        id: meta2Id,
        userId,
        titulo: `Meta Mensal de Poupança`,
        descricao: `Poupar ao menos R$ 600,00 neste mês`,
        modalidade: 'MENSAL',
        valorAlvoCentavos: 60000, // R$ 600,00
        dataInicio: `${anoAtual}-${mesStr}-01`,
        mesReferencia: mesAtual,
        anoReferencia: anoAtual,
        status: 'EM_ANDAMENTO',
        criadoEm: new Date().toISOString(),
      },
      {
        id: meta3Id,
        userId,
        titulo: 'Viagem de Férias Nordeste',
        descricao: 'Passagens e hospedagem planejadas',
        modalidade: 'PERSONALIZADA',
        valorAlvoCentavos: 350000, // R$ 3.500,00
        dataInicio: `${anoAtual}-${mesStr}-01`,
        dataFim: `${anoAtual}-12-20`,
        status: 'EM_ANDAMENTO',
        criadoEm: new Date().toISOString(),
      },
    ];

    this.schema.metas.push(...metasDemo);

    // Contribuições para as Metas
    const contribuicoesDemo: ContribuicaoMeta[] = [
      {
        id: `ctb_demo_1_${Date.now()}`,
        metaId: meta1Id,
        userId,
        valorCentavos: 450000, // R$ 4.500,00
        data: `${anoAtual}-${mesStr}-06`,
        observacao: 'Aporte inicial da reserva',
        criadoEm: new Date().toISOString(),
      },
      {
        id: `ctb_demo_2_${Date.now()}`,
        metaId: meta2Id,
        userId,
        valorCentavos: 40000, // R$ 400,00
        data: `${anoAtual}-${mesStr}-15`,
        observacao: 'Aporte quinzenal',
        criadoEm: new Date().toISOString(),
      },
      {
        id: `ctb_demo_3_${Date.now()}`,
        metaId: meta3Id,
        userId,
        valorCentavos: 120000, // R$ 1.200,00
        data: `${anoAtual}-${mesStr}-10`,
        observacao: 'Economia de fim de ano',
        criadoEm: new Date().toISOString(),
      },
    ];

    this.schema.contribuicoes.push(...contribuicoesDemo);

    // Orçamentos Mensais de Exemplo
    this.schema.orcamentos.push(
      {
        id: `orc_demo_geral_${Date.now()}`,
        userId,
        ano: anoAtual,
        mes: mesAtual,
        categoriaId: null,
        limiteCentavos: 320000, // R$ 3.200,00
        alertaPercentual: 80,
        criadoEm: new Date().toISOString(),
      },
      {
        id: `orc_demo_alim_${Date.now()}`,
        userId,
        ano: anoAtual,
        mes: mesAtual,
        categoriaId: catAlimentacao,
        limiteCentavos: 80000, // R$ 800,00
        alertaPercentual: 80,
        criadoEm: new Date().toISOString(),
      }
    );

    // Recorrências de Exemplo
    this.schema.recorrencias.push(
      {
        id: `rec_demo_1_${Date.now()}`,
        userId,
        descricao: 'Aluguel do Apartamento',
        valorPrevistoCentavos: 135000,
        categoriaId: catMoradia,
        periodicidade: 'MENSAL',
        dataInicio: `${anoAtual}-01-01`,
        proximaData: `${anoAtual}-${mesStr}-10`,
        ativo: true,
        criadoEm: new Date().toISOString(),
      },
      {
        id: `rec_demo_2_${Date.now()}`,
        userId,
        descricao: 'Internet Fibra 500MB',
        valorPrevistoCentavos: 14990,
        categoriaId: catContas,
        periodicidade: 'MENSAL',
        dataInicio: `${anoAtual}-01-01`,
        proximaData: `${anoAtual}-${mesStr}-15`,
        ativo: true,
        criadoEm: new Date().toISOString(),
      }
    );

    this.salvarSincrono();
  }

  public obterEstatisticasBanco(userId: string) {
    const transacoes = this.obterTransacoes(userId);
    const metas = this.obterMetas(userId);
    const recorrencias = this.obterRecorrencias(userId);
    const tamanhoBytes = new Blob([localStorage.getItem(DB_STORAGE_KEY) || '']).size;

    return {
      totalTransacoes: transacoes.length,
      totalMetas: metas.length,
      totalRecorrencias: recorrencias.length,
      tamanhoKb: (tamanhoBytes / 1024).toFixed(1),
    };
  }
}

export const dbLocal = new SQLiteEngineLocal();
