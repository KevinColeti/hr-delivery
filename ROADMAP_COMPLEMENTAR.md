# ROADMAP COMPLEMENTAR - FLUXO ESTRUTURADO (SEM SUBSTITUIR O ROADMAP ATUAL)

## Objetivo deste arquivo
- Este roadmap **complementa** o `ROADMAP.md`.
- Nenhum item antigo foi removido; aqui entram **subtopicos** e detalhamento de execucao.
- Use este arquivo para evolucao do fluxo real de produto (site + admin + operacao).

## Regras de leitura
- Status: `todo`, `in-progress`, `done`
- Prioridade: `P0` (critico), `P1` (importante), `P2` (melhoria)
- Cada item abaixo referencia um bloco existente no roadmap atual.

---

## C1 - E7 (Site Cliente) - Subtopicos de Fluxo Real
- Status: `todo`
- Referencia principal: `E7 - Frontend Site (Cliente)` no `ROADMAP.md`

### C1.1 [Subtopico de E7] Separacao de fluxo em rotas
- [ ] (`todo`) [P0] Criar rotas publicas separadas: `/`, `/cardapio`, `/produto/:slug|id`, `/carrinho`, `/checkout`, `/pedido/:id`, `/acompanhar`.
- [ ] (`todo`) [P0] Remover acoplamento da `Home` como tela unica de cardapio+carrinho+checkout+tracking.
- [ ] (`todo`) [P1] Criar layout publico reutilizavel (header/footer) para paginas de fluxo.

### C1.2 [Subtopico de E7] Cardapio dinamico (refino)
- [ ] (`todo`) [P0] Mover carregamento de catalogo para pagina/servico dedicado.
- [ ] (`todo`) [P1] Adicionar estados robustos de `loading`, `erro` e `vazio` por pagina.
- [ ] (`todo`) [P1] Padronizar filtros por categoria via URL (query param).

### C1.3 [Subtopico de E7] Detalhe de produto com extras
- [ ] (`todo`) [P0] Converter modal atual para fluxo de pagina (ou modal com URL canônica).
- [ ] (`todo`) [P0] Exibir disponibilidade de extras e preco final do item configurado.
- [ ] (`todo`) [P1] Persistir configuracao de item de forma estruturada para pedido (nao apenas em `notes`).

### C1.4 [Subtopico de E7] Carrinho separado
- [ ] (`todo`) [P0] Criar pagina `/carrinho` com resumo de itens, extras e observacoes.
- [ ] (`todo`) [P0] Garantir edicao/remocao por item configurado (chave de composicao).
- [ ] (`todo`) [P1] Exibir validacoes de disponibilidade antes de ir ao checkout.

### C1.5 [Subtopico de E7] Checkout real
- [ ] (`todo`) [P0] Remover dependencia de `clientId` manual da tela publica.
- [ ] (`todo`) [P0] Coletar dados de cliente/telefone/endereco conforme contrato backend real.
- [ ] (`todo`) [P0] Integrar cupom com feedback de validacao claro ao usuario.
- [ ] (`todo`) [P1] Preparar ponto de extensao para forma de pagamento.

### C1.6 [Subtopico de E7] Tracking e pos-compra
- [ ] (`todo`) [P0] Pagina dedicada `/pedido/:id` com tracking primario.
- [ ] (`todo`) [P1] Manter `/acompanhar` como busca manual secundaria por numero.
- [ ] (`todo`) [P1] Integrar CTA de WhatsApp contextual na jornada pos-checkout.

---

## C2 - E5 (Clientes e Configuracoes) - Subtopicos de Backoffice/Checkout
- Status: `todo`
- Referencia principal: `E5 - Clientes e Configuracoes de Loja` no `ROADMAP.md`

### C2.1 [Subtopico de E5] Cliente automatico no checkout
- [ ] (`todo`) [P0] Criar endpoint publico de checkout que aceite dados de cliente (telefone como chave de deduplicacao).
- [ ] (`todo`) [P0] Implementar upsert de cliente por telefone (`find-or-create` + atualizacao de dados mutaveis).
- [ ] (`todo`) [P0] Ajustar criacao de pedido para usar cliente resolvido automaticamente.

### C2.2 [Subtopico de E5] Historico e consulta de cliente
- [ ] (`todo`) [P1] Endpoint de historico de pedidos por cliente.
- [ ] (`todo`) [P1] Endpoint admin para consulta de cliente e dados consolidados.

### C2.3 [Subtopico de E5] Configuracoes operacionais de loja
- [ ] (`todo`) [P0] Entidade/config de delivery (taxa padrao, pedido minimo, area atendida).
- [ ] (`todo`) [P1] Entidade/config de horario operacional.
- [ ] (`todo`) [P1] Entidade/config institucional (nome, descricao, contato, politicas).

---

## C3 - E3/E4 (Pedidos e Preco) - Subtopicos de Modelo de Pedido
- Status: `todo`
- Referencia principal: `E3` e `E4` no `ROADMAP.md`

### C3.1 [Subtopico de E3] Pedido com itens configurados (extras estruturados)
- [ ] (`todo`) [P0] Evoluir DTO de criacao de pedido para aceitar extras por item.
- [ ] (`todo`) [P0] Criar persistencia de extras no item do pedido (tabela dedicada ou snapshot JSON estruturado).
- [ ] (`todo`) [P0] Ajustar calculo de subtotal/total incluindo extras.
- [ ] (`todo`) [P0] Ajustar baixa de estoque considerando extras com consumo de insumo.

### C3.2 [Subtopico de E4] Promocao com itens configurados
- [ ] (`todo`) [P1] Validar impacto de combo/cupom no novo modelo de item com extras.
- [ ] (`todo`) [P1] Garantir auditoria de desconto aplicado com snapshot completo.

---

## C4 - E8 (Frontend Admin) - Subtopicos de Modulos Reais
- Status: `todo`
- Referencia principal: `E8 - Frontend Admin` no `ROADMAP.md`

### C4.1 [Subtopico de E8] Redesenho de IA de navegacao
- [ ] (`todo`) [P0] Definir mapa final de navegacao do admin (pedidos, cozinha, cardapio, estoque, promocoes, clientes, configuracoes).
- [ ] (`todo`) [P0] Remover placeholders por modulo real de forma incremental.

### C4.2 [Subtopico de E8] Modulo de pedidos (admin)
- [ ] (`todo`) [P0] Listagem com filtros por status/data.
- [ ] (`todo`) [P0] Detalhe do pedido com timeline de status e auditoria.
- [ ] (`todo`) [P0] Acoes de transicao de status conforme role.

### C4.3 [Subtopico de E8] Modulo cozinha
- [ ] (`todo`) [P0] Board operacional consumindo `/orders/kitchen/board`.
- [ ] (`todo`) [P0] Atualizacao em tempo real via `/orders/kitchen/stream`.
- [ ] (`todo`) [P0] Acoes rapidas de preparo/pronto.

### C4.4 [Subtopico de E8] Modulo cardapio e estoque
- [ ] (`todo`) [P0] CRUD completo de categorias/produtos/receitas/extras no admin.
- [ ] (`todo`) [P0] Tela de movimentacoes e alertas de estoque minimo.

### C4.5 [Subtopico de E8] Modulos promocoes, clientes e configuracoes
- [ ] (`todo`) [P0] Tela de cupons e combos com validacoes.
- [ ] (`todo`) [P1] Tela de clientes com historico de pedidos.
- [ ] (`todo`) [P1] Tela de configuracoes de loja.

---

## C5 - E6 (WhatsApp) - Subtopicos Operacionais
- Status: `todo`
- Referencia principal: `E6 - Integracao WhatsApp` no `ROADMAP.md`

### C5.1 [Subtopico de E6] Provedor real
- [ ] (`todo`) [P0] Escolher provedor oficial (ex.: Z-API, Meta Cloud API, Twilio).
- [ ] (`todo`) [P0] Definir contrato de autenticacao e limites operacionais.

### C5.2 [Subtopico de E6] Templates e governanca
- [ ] (`todo`) [P1] Implementar templates versionados por evento.
- [ ] (`todo`) [P1] Criar configuracao admin para ativar/desativar templates por ambiente.

---

## C6 - E9 (Qualidade e Go-live) - Subtopicos de Fechamento
- Status: `todo`
- Referencia principal: `E9 - Qualidade e Go-live` no `ROADMAP.md`

### C6.1 [Subtopico de E9] Testes
- [ ] (`todo`) [P0] Testes unitarios de dominio: pedido, estoque, promocoes.
- [ ] (`todo`) [P0] Testes de integracao API: checkout, confirmacao, baixa, tracking.
- [ ] (`todo`) [P1] E2E do fluxo completo: cliente -> admin -> cozinha -> entrega.

### C6.2 [Subtopico de E9] Producao
- [ ] (`todo`) [P0] Checklist de migracoes, backup e observabilidade.
- [ ] (`todo`) [P0] Plano de deploy + smoke tests pos-deploy.
- [ ] (`todo`) [P1] Revisao final de permissao por perfil.

---

## Ordem pratica recomendada (complementar)
1. C2.1 (checkout com cliente automatico) + C3.1 (itens com extras estruturados).
2. C1 (quebra de fluxo do site em rotas reais).
3. C4.2 e C4.3 (admin pedidos e cozinha).
4. C4.4 e C4.5 (restante admin).
5. C5 e C6 (operacao WhatsApp e fechamento go-live).

