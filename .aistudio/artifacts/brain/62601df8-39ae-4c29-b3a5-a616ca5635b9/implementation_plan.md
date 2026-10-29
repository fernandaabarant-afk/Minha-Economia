# Aplicativo de Economia Pessoal — Arquitetura 100% Local e Sem Cobranças

Aplicativo financeiro pessoal para Android, iOS e Web, com arquitetura **100% local (offline-first)**, **totalmente gratuito (zero cobranças ou assinaturas)** e **sem qualquer serviço na nuvem**. Tanto a autenticação/gestão de perfis quanto todas as transações, metas, orçamentos e relatórios residem exclusivamente no armazenamento interno do dispositivo via banco de dados relacional SQLite, assegurando privacidade soberana ao usuário.

---

## Decisões Confirmadas e Ajustes Solicitados (Revisão)

> [!IMPORTANT]
> **Ajustes Estritos Incorporados a Pedido do Usuário:**
> 1. **Zero Cobranças (100% Gratuito)**: Não há planos pagos, assinaturas, compras no aplicativo ou cobranças ocultas. Todas as funcionalidades são desbloqueadas e livres.
> 2. **Zero Nuvem (Sem Firebase ou Servidores Externos)**: Eliminada qualquer dependência de nuvem. A autenticação de usuário (cadastro de perfil, login, proteção por senha ou PIN) é realizada **exclusivamente no próprio dispositivo**, utilizando criptografia/hash seguro (`WebCrypto` / SHA-256 / PBKDF2) armazenado na tabela local de usuários no SQLite.
> 3. **Independência Total e Funcionamento Offline**: O aplicativo não necessita de conexão com a internet para funcionar. Todos os dados permanecem intactos e restritos à memória física do dispositivo do usuário.

- **Plataforma**: React Native / Expo Web com interface de alta resolução para smartphone e opção de expansão para tela cheia.
- **Armazenamento**: Motor relacional SQLite local com persistência no IndexedDB do navegador e suporte direto para builds nativos (Expo SQLite).
- **Precisão Financeira**: Todos os cálculos são feitos em **centavos inteiros** (`INTEGER`), impedindo perdas por imprecisão de ponto flutuante.
- **Recomendações Determinísticas**: Regras matemáticas e estatísticas em JavaScript puro executadas no processador do próprio celular/dispositivo, sem consumo de APIs externas.

---

## 1. Visão Geral e Princípios Fundamentais

- **O que faz**: Permite cadastrar receitas e despesas, acompanhar a saúde financeira em gráficos interativos, planejar 4 modalidades de metas com aportes, configurar limites de orçamento mensal, prever despesas recorrentes e receber dicas automáticas inteligentes.
- **Privacidade Soberana**: O usuário tem a certeza absoluta de que nenhum extrato, saldo, e-mail ou senha sai do seu dispositivo. Não há telemetria nem servidores intermediários.
- **Custo Zero**: Software limpo, sem anúncios invasivos, sem mensalidades e sem exigência de cartões de crédito.

---

## 2. Experiência do Usuário e Telas

### Fluxo de Perfil e Acesso 100% Local

1. **Primeiro Acesso / Criação de Perfil Local**:
   - Tela de boas-vindas com mensagem clara: *"Seus dados nunca saem deste aparelho"*.
   - Criação de perfil com Nome, E-mail (usado apenas como identificador local) e Senha/PIN de 4 a 6 dígitos.
   - Hash seguro com salt gerado e armazenado na tabela local `usuarios_locais`.
2. **Tela de Desbloqueio / Login Local**:
   - Entrada rápida por PIN ou senha.
   - Proteção com bloqueio temporário após 5 tentativas incorretas.
   - Pergunta de segurança secreta local configurada pelo usuário para recuperação de acesso offline.

### Navegação Principal (5 Abas Inferiores)

- **Aba 1: Início (Painel Consolidado)**:
  - Saldo Total Líquido Disponível.
  - Receitas e Despesas do mês selecionado com indicador de superávit/déficit.
  - Distinção visual explícita entre Saldo Livre, Valores Reservados em Metas e Despesas Efetivas.
  - Seletor de mês e ano (`← Outubro 2026 →`).
  - Widget de metas ativas e barra de consumo do orçamento.
  - Cartão de recomendação determinística com ação de economia imediata.
  - Botão flutuante central ou atalhos para lançar Receita e Despesa rapidamente.
  - Extrato rápido com os lançamentos mais recentes.

- **Aba 2: Lançamentos (Histórico Completo)**:
  - Campo de busca instantânea por descrição.
  - Filtros: Tipo (Todas, Receitas, Despesas), Categorias (Moradia, Alimentação, etc.) e Período.
  - Ordenação por data ou valor.
  - Ações em cada item: Editar, Duplicar e Excluir (com diálogo modal de confirmação).
  - Gerenciador de Categorias (edição e criação de categorias personalizadas).

- **Aba 3: Análises (Gráficos Interativos)**:
  - Gráfico de Rosca (Donut): Distribuição de despesas por categoria. Tocar no segmento exibe o valor em reais, o percentual e lista as despesas daquela categoria.
  - Gráfico de Barras: Comparativo mensal de Receitas vs. Despesas ao longo do tempo.
  - Indicador de Tendência: Variação de gastos em relação ao mês anterior (quais categorias subiram ou desceram).
  - Filtros: Semana, Mês, Ano ou Período Personalizado.
  - Mensagens amigáveis para estados sem dados (sem números inventados).

- **Aba 4: Metas (Planejamento de Poupança)**:
  - 4 Modalidades estruturadas:
    1. *Mensal*: Alvo a poupar no mês corrente.
    2. *Anual*: Alvo para o ano civil com sugestão de aporte mensal.
    3. *Personalizada*: Com data inicial, valor alvo e data final opcional (ex: "Reserva de Emergência", "Troca de Carro").
    4. *Sem Prazo*: Objetivo contínuo de acumulação livre.
  - Registro de contribuições/retiradas com histórico próprio. O valor acumulado não é subtraído como despesa de consumo nem contado duas vezes.

- **Aba 5: Orçamento (Controle de Limites)**:
  - Orçamento geral do mês e tetos individuais por categoria.
  - Alertas visuais automáticos: Normal (verde), Atenção $\ge 80\%$ (laranja) e Estourado $> 100\%$ (vermelho carmim).
  - Comparativo com histórico orçamentário de meses anteriores.

- **Módulo de Despesas Recorrentes (Acessível pelo Painel / Orçamento)**:
  - Cadastro de contas regulares (Aluguel, Internet, Academia).
  - Frequências: Semanal, Mensal ou Anual.
  - Baixa manual simples para efetivar no mês vigente sem duplicar transações.

- **Perfil, Segurança e Gerenciamento de Dados**:
  - Alteração de nome, PIN de acesso e pergunta de recuperação.
  - Indicador de tamanho e integridade da base SQLite local.
  - Exportação e importação de backup em arquivo JSON local (permitindo que o usuário guarde cópia onde desejar, como em pendrive ou e-mail pessoal).
  - Limpeza total de dados locais com confirmação dupla de segurança.

---

## 3. Identidade Visual (Azul & Branco)

- **Fundo**: `#F4F7FC` (suave e limpo para descanso visual) e `#FFFFFF` (cartões e modais).
- **Azul Principal**: `#567FB5` (ícones, seleção de abas e detalhes).
- **Azul de Destaque**: `#365E91` (botões primários de ação, cabeçalhos principais).
- **Azul Secundário**: `#DCE7F5` (fundos sutis, trilhas de progresso e chips de filtro).
- **Textos**: `#26364A` (títulos e valores) e `#718096` (legendas e metadados).
- **Sinais Semânticos Controlados**:
  - Receita / Sucesso: `#2E7D32`
  - Atenção / Alerta: `#E65100`
  - Despesa / Estouro: `#C62828`
- **Tipografia e Padrões**:
  - Fonte com números tabulares (`tabular-nums`) para perfeita legibilidade contábil.
  - Formatação oficial brasileira: Moeda em `R$ 1.250,50` e datas em `DD/MM/AAAA`.
  - Zero pílulas estáticas; alvos de toque $\ge 44 \times 44\text{px}$.

---

## 4. Arquitetura Técnica e Modelo de Dados (SQLite 100% Local)

### Diagrama Arquitetural Sem Nuvem

```
┌────────────────────────────────────────────────────────────────────────┐
│               APLICATIVO DE ECONOMIA PESSOAL (OFFLINE)                 │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Autenticação Local                           │  │
│  │   • Cadastro de Perfil Offline (Nome, PIN/Senha com Hash Local)  │  │
│  │   • Pergunta Secreta de Recuperação Offline                      │  │
│  │   • ZERO NUVEM / ZERO REQUISIÇÕES EXTERNAS                       │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │                     Navegação & Telas                            │  │
│  │   [Início]  [Lançamentos]  [Análises]  [Metas]  [Orçamento]      │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │               Camada de Negócio e Cálculos Locais                │  │
│  │   • Conversão em Centavos Inteiros (Zero Ponto Flutuante)        │  │
│  │   • Motor Determinístico de Recomendações (Regras em JS)         │  │
│  │   • Exportação / Importação de Backup Local (JSON)               │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │                    Banco SQLite Relacional Local                 │  │
│  │   • Tabela usuarios_locais (credenciais com hash seguro)         │  │
│  │   • Tabela transacoes (centavos inteiros e índices por data)     │  │
│  │   • Tabela categorias (padrão pt-BR e personalizadas)            │  │
│  │   • Tabela metas e contribuicoes_metas (4 modalidades)           │  │
│  │   • Tabela orcamentos (tetos gerais e por categoria)             │  │
│  │   • Tabela recorrencias (previsões sem duplicação)               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Esquema do Banco de Dados Local (SQLite)

```sql
-- Usuários e Perfis Locais (Autenticação Offline no Aparelho)
CREATE TABLE IF NOT EXISTS usuarios_locais (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT,
    pin_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    pergunta_recuperacao TEXT,
    resposta_hash TEXT,
    criado_em TEXT NOT NULL
);

-- Categorias de Receita e Despesa
CREATE TABLE IF NOT EXISTS categorias (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('RECEITA', 'DESPESA')),
    icone TEXT NOT NULL,
    cor TEXT NOT NULL,
    padrao INTEGER DEFAULT 0
);

-- Transações Financeiras (Valores em Centavos Inteiros)
CREATE TABLE IF NOT EXISTS transacoes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('RECEITA', 'DESPESA')),
    valor_centavos INTEGER NOT NULL CHECK(valor_centavos > 0),
    descricao TEXT NOT NULL,
    categoria_id TEXT NOT NULL,
    data TEXT NOT NULL, -- Formato ISO AAAA-MM-DD
    natureza TEXT NOT NULL DEFAULT 'VARIAVEL' CHECK(natureza IN ('FIXA', 'VARIAVEL', 'RECORRENTE')),
    recorrencia_id TEXT,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    FOREIGN KEY(categoria_id) REFERENCES categorias(id)
);
CREATE INDEX IF NOT EXISTS idx_transacoes_user_data ON transacoes(user_id, data);
CREATE INDEX IF NOT EXISTS idx_transacoes_categoria ON transacoes(categoria_id);

-- Metas de Economia (4 Modalidades)
CREATE TABLE IF NOT EXISTS metas (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    modalidade TEXT NOT NULL CHECK(modalidade IN ('MENSAL', 'ANUAL', 'PERSONALIZADA', 'SEM_PRAZO')),
    valor_alvo_centavos INTEGER NOT NULL CHECK(valor_alvo_centavos > 0),
    data_inicio TEXT NOT NULL,
    data_fim TEXT,
    mes_referencia INTEGER,
    ano_referencia INTEGER,
    status TEXT NOT NULL DEFAULT 'EM_ANDAMENTO' CHECK(status IN ('EM_ANDAMENTO', 'CONCLUIDA', 'PAUSADA')),
    criado_em TEXT NOT NULL
);

-- Contribuições e Aportes para Metas
CREATE TABLE IF NOT EXISTS contribuicoes_metas (
    id TEXT PRIMARY KEY,
    meta_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    valor_centavos INTEGER NOT NULL,
    data TEXT NOT NULL,
    observacao TEXT,
    criado_em TEXT NOT NULL,
    FOREIGN KEY(meta_id) REFERENCES metas(id) ON DELETE CASCADE
);

-- Orçamentos Mensais
CREATE TABLE IF NOT EXISTS orcamentos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    categoria_id TEXT,
    limite_centavos INTEGER NOT NULL CHECK(limite_centavos > 0),
    alerta_percentual INTEGER DEFAULT 80,
    criado_em TEXT NOT NULL,
    UNIQUE(user_id, ano, mes, categoria_id)
);

-- Despesas Recorrentes (Assinaturas e Fixas)
CREATE TABLE IF NOT EXISTS recorrencias (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor_previsto_centavos INTEGER NOT NULL,
    categoria_id TEXT NOT NULL,
    periodicidade TEXT NOT NULL CHECK(periodicidade IN ('SEMANAL', 'MENSAL', 'ANUAL')),
    data_inicio TEXT NOT NULL,
    proxima_data TEXT NOT NULL,
    data_fim TEXT,
    ativo INTEGER DEFAULT 1,
    criado_em TEXT NOT NULL,
    FOREIGN KEY(categoria_id) REFERENCES categorias(id)
);
```

---

## 5. Próximos Passos (Após Aprovação)

- **Fase 3**: Construção da interface com layout de smartphone, barra de navegação tátil (5 abas), paleta azul/branco e componentes de interface.
- **Fase 4**: Sistema de perfil local com PIN/senha criptografada e inicialização da base SQLite local estruturada.
- **Fase 5**: Criação, edição, busca e filtros de transações com teclado numérico formatado em `R$` e precisão de centavos.
- **Fase 6**: 4 modalidades de metas, orçamentos com alertas visuais e despesas recorrentes.
- **Fase 7**: Gráficos analíticos interativos (rosca e barras) e motor determinístico de recomendações de economia em pt-BR.
- **Fase 8**: Central de backup local (JSON), configurações de segurança e testes de aceitação.
