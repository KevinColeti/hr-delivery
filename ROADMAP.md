# ROADMAP - HRNachapa

## Como usar este arquivo
- Status disponiveis: `todo`, `in-progress`, `done`
- Prioridade: `P0` (critico), `P1` (importante), `P2` (melhoria)
- Este roadmap cobre `Admin Panel` e `Site Cliente` da Fase 1 (MVP)

## Baseline atual (ja feito no repositorio)
- [x] (`done`) [P0] Base frontend Angular com home publica e catalogo mock
- [x] (`done`) [P1] Layout inicial de `/admin` com dashboard de exemplo
- [x] (`done`) [P0] Docker compose com frontend + PostgreSQL
- [x] (`done`) [P0] Backend/API real inicial criada (NestJS + TypeORM)
- [x] (`done`) [P0] Fluxo inicial de pedido no backend criado (orders + status + baixa de estoque)

## Visao geral da Fase 1
- Operacao inicial: `delivery`
- Perfis: `admin` e `cozinha`
- Tempo real obrigatorio para pedidos/cozinha
- Estoque por insumos (baixa automatica por receita/extras)
- Promocoes: cupons + combos automaticos + primeiro pedido + valor minimo
- Integracao WhatsApp

## Sprints sugeridas (4-6 semanas)
1. Semana 1: Fundacao tecnica + inicio cardapio/estoque
2. Semana 2: Pedidos backend + status + baixa de estoque
3. Semana 3: Site cliente (compra) + admin pedidos/cozinha
4. Semana 4: Promocoes + clientes + configuracoes
5. Semana 5: WhatsApp + refinamentos de UX + hardening
6. Semana 6: Qualidade final + deploy/go-live

---

## E1 - Fundacao Tecnica
- Status: `in-progress`
- [x] (`done`) [P0] Stack frontend + Postgres via Docker operacional
- [x] (`done`) [P0] Definir arquitetura backend (NestJS + TypeORM + modulo auth)
- [x] (`done`) [P0] Configurar backend base com migracoes e seed inicial
- [x] (`done`) [P0] Implementar autenticacao JWT
- [x] (`done`) [P0] Implementar autorizacao por perfil (`admin`, `cozinha`)
- [x] (`done`) [P0] Configurar tempo real para eventos de pedido
- [x] (`done`) [P1] Configurar tratamento global de validacoes (ValidationPipe)
- [x] (`done`) [P1] Configurar logs estruturados e rastreabilidade

## E2 - Cardapio e Estoque (Insumos)
- Status: `in-progress`
- [x] (`done`) [P0] CRUD de categorias
- [x] (`done`) [P0] CRUD de produtos finais
- [x] (`done`) [P0] CRUD de insumos
- [x] (`done`) [P0] Receita por produto (insumos obrigatorios + quantidade/unidade)
- [x] (`done`) [P0] Extras com impacto em estoque
- [x] (`done`) [P0] Disponibilidade automatica por estoque
- [x] (`done`) [P1] Historico de movimentacao de estoque
- [x] (`done`) [P1] Alertas de estoque minimo

## E3 - Pedidos e Operacao
- Status: `in-progress`
- [x] (`done`) [P0] Endpoint de criacao de pedido (site -> backend)
- [x] (`done`) [P0] Fluxo de status: `novo`, `confirmado`, `em preparo`, `pronto`, `saiu para entrega`, `entregue`, `cancelado`
- [x] (`done`) [P0] Auditoria por mudanca de status (quem/quando)
- [x] (`done`) [P0] Baixa automatica de estoque ao confirmar pedido
- [x] (`done`) [P0] Lista admin de pedidos com filtros
- [x] (`done`) [P0] Tela cozinha (modo monitor) com acao `marcar pronto`
- [x] (`done`) [P0] Atualizacao em tempo real de pedidos/cozinha

## E4 - Promocoes e Motor de Preco
- Status: `todo`
- [ ] (`todo`) [P0] Cupons com validade, valor minimo e limites de uso
- [ ] (`todo`) [P0] Regra de primeiro pedido
- [ ] (`todo`) [P0] Combos automaticos por combinacao de itens/categorias
- [ ] (`todo`) [P1] Politica de acumulo de promocoes
- [ ] (`todo`) [P0] Motor de calculo final (itens + extras + taxa + desconto)
- [ ] (`todo`) [P1] Registro da promocao aplicada no pedido

## E5 - Clientes e Configuracoes de Loja
- Status: `todo`
- [ ] (`todo`) [P0] Cadastro/atualizacao automatica de cliente no checkout
- [ ] (`todo`) [P0] Deduplicacao por telefone
- [ ] (`todo`) [P1] Historico de pedidos por cliente
- [ ] (`todo`) [P0] Configuracoes de delivery (taxa, pedido minimo, area atendida)
- [ ] (`todo`) [P1] Configuracoes de horario e operacao
- [ ] (`todo`) [P1] Configuracoes institucionais da loja

## E6 - Integracao WhatsApp
- Status: `todo`
- [ ] (`todo`) [P0] Definir provedor de envio (API/servico)
- [ ] (`todo`) [P0] Implementar mensagens de confirmacao e status do pedido
- [ ] (`todo`) [P1] Implementar templates configuraveis
- [ ] (`todo`) [P1] Logs de envio e retry em falha

## E7 - Frontend Site (Cliente)
- Status: `in-progress`
- [x] (`done`) [P1] Base visual publica com categorias/cards (mock)
- [ ] (`todo`) [P0] Cardapio dinamico consumindo API
- [ ] (`todo`) [P0] Detalhe de produto com extras e observacoes
- [ ] (`todo`) [P0] Carrinho (edicao de itens, totais e descontos)
- [ ] (`todo`) [P0] Checkout (cliente, endereco, pagamento, cupom)
- [ ] (`todo`) [P0] Criacao de pedido e retorno com numero de acompanhamento
- [ ] (`todo`) [P0] Tela de acompanhamento de status do pedido
- [ ] (`todo`) [P1] Botao/fluxo de contato via WhatsApp

## E8 - Frontend Admin
- Status: `in-progress`
- [x] (`done`) [P2] Esboco inicial de layout `/admin` (sidebar/header/footer/dashboard)
- [ ] (`todo`) [P0] Redesenhar `/admin` para o fluxo real da operacao
- [ ] (`todo`) [P0] Modulo de pedidos (admin)
- [ ] (`todo`) [P0] Modulo cozinha (visualizacao para monitor)
- [ ] (`todo`) [P0] Modulo cardapio (produtos/categorias/receitas/extras)
- [ ] (`todo`) [P0] Modulo estoque (insumos + movimentacoes + alertas)
- [ ] (`todo`) [P0] Modulo promocoes (cupons + combos)
- [ ] (`todo`) [P1] Modulo clientes
- [ ] (`todo`) [P1] Modulo configuracoes
- [ ] (`todo`) [P0] Guards por perfil e protecao de rotas

## E9 - Qualidade e Go-live
- Status: `todo`
- [ ] (`todo`) [P0] Testes unitarios de dominios criticos
- [ ] (`todo`) [P0] Testes de integracao (pedido, estoque, promocoes)
- [ ] (`todo`) [P1] Teste E2E do fluxo completo (site -> admin -> cozinha -> entrega)
- [ ] (`todo`) [P0] Checklist de producao (migrations, backup, observabilidade)
- [ ] (`todo`) [P0] Deploy final e smoke test pos-deploy

---

## Dependencias principais
- E1 antes de E3/E4/E5/E6
- E2 antes de disponibilidade real no E7
- E3 antes da tela cozinha completa no E8
- E4 influencia fechamento do checkout no E7
- E9 depende de todos os anteriores

## Criterios de conclusao do MVP
- [ ] (`todo`) [P0] Cliente consegue fechar pedido completo pelo site
- [ ] (`todo`) [P0] Pedido aparece em tempo real no admin/cozinha
- [ ] (`todo`) [P0] Cozinha consegue marcar pedido como pronto
- [ ] (`todo`) [P0] Estoque de insumos e baixado corretamente
- [ ] (`todo`) [P0] Cupons e combos aplicam regras corretamente
- [ ] (`todo`) [P1] Cliente e historico ficam salvos
- [ ] (`todo`) [P0] WhatsApp envia confirmacao e atualizacoes essenciais

---

## Plano de execucao P0 (solo iniciante)

Objetivo: entregar o MVP funcional sem travar em complexidade desnecessaria.

### Regras de trabalho para este projeto
- Trabalhar em blocos pequenos e testaveis.
- Fechar uma feature por vez (fim a fim) antes da proxima.
- Evitar refatoracao grande no inicio.
- Sempre manter sistema executavel ao final do dia.

### Semana 1 - Base backend e autenticacao
- [x] (`done`) Dia 1: criar backend base, estrutura de pastas e conexao com PostgreSQL
- [x] (`done`) Dia 2: criar migracoes iniciais (usuarios, clientes, categorias, produtos, insumos)
- [x] (`done`) Dia 3: implementar login JWT e perfil `admin`
- [x] (`done`) Dia 4: implementar perfil `cozinha` e protecao de rotas no backend
- [x] (`done`) Dia 5: criar endpoints basicos de teste e documentar no README tecnico

Saida da semana:
- Backend sobe localmente
- Login funciona
- Banco com estrutura inicial pronta

### Semana 2 - Cardapio + estoque por insumos
- [x] (`done`) Dia 1: CRUD de categorias
- [x] (`done`) Dia 2: CRUD de insumos
- [x] (`done`) Dia 3: CRUD de produtos
- [x] (`done`) Dia 4: receita do produto (insumos + quantidade + unidade)
- [x] (`done`) Dia 5: extras e regra de disponibilidade por estoque

Saida da semana:
- Produto final pode ser criado com receita e extras
- Estoque passa a determinar disponibilidade

### Semana 3 - Pedido fim a fim (site -> admin)
- [ ] (`todo`) Dia 1: carrinho no site (estado local)
- [ ] (`todo`) Dia 2: checkout com cliente/endereco/pagamento
- [x] (`done`) Dia 3: endpoint de criacao de pedido
- [x] (`done`) Dia 4: lista de pedidos no admin
- [ ] (`todo`) Dia 5: fluxo de status basico (`novo` -> `confirmado` -> `em preparo` -> `pronto`)

Saida da semana:
- Pedido real criado no site e visivel no admin

### Semana 4 - Cozinha em tempo real + baixa de estoque
- [x] (`done`) Dia 1: tela cozinha simplificada (apenas o essencial)
- [x] (`done`) Dia 2: acao `marcar pronto`
- [x] (`done`) Dia 3: atualizacao em tempo real de pedidos/cozinha
- [x] (`done`) Dia 4: baixa automatica de estoque ao confirmar pedido
- [ ] (`todo`) Dia 5: ajustes de erros e validacoes de transicao de status

Saida da semana:
- Fluxo operacional principal funciona para cozinha

### Semana 5 - Promocoes P0 + WhatsApp
- [ ] (`todo`) Dia 1: cupons (validade, minimo, limite)
- [ ] (`todo`) Dia 2: regra de primeiro pedido
- [ ] (`todo`) Dia 3: combos automaticos (versao simples)
- [ ] (`todo`) Dia 4: integracao WhatsApp (confirmacao + atualizacao de status)
- [ ] (`todo`) Dia 5: logs de envio e tratamento de falhas simples

Saida da semana:
- Pedido com desconto validado e comunicacao basica via WhatsApp

### Semana 6 - Fechamento MVP
- [ ] (`todo`) Dia 1: testes dos fluxos criticos (pedido, estoque, promocao)
- [ ] (`todo`) Dia 2: correcao de bugs de ponta a ponta
- [ ] (`todo`) Dia 3: revisar permissao por perfil (`admin`/`cozinha`)
- [ ] (`todo`) Dia 4: checklist de deploy e backup
- [ ] (`todo`) Dia 5: go-live controlado + smoke test

Saida da semana:
- MVP pronto para operacao inicial

### Ordem tecnica recomendada (sempre que bater duvida)
1. Dados e regras no backend
2. Endpoint testado via ferramenta de API
3. Integracao no frontend
4. Validacao manual do fluxo completo

### Escopo de simplificacao recomendado (para nao travar)
- Tela cozinha minimalista primeiro, visual refinado depois.
- Promocoes com regras basicas primeiro, regras avancadas depois.
- Sem multi-loja, sem app nativo, sem BI na Fase 1.
