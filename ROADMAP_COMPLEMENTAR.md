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
- Status: `in-progress`
- Referencia principal: `E7 - Frontend Site (Cliente)` no `ROADMAP.md`

### C1.1 [Subtopico de E7] Separacao de fluxo em rotas
- [x] (`done`) [P0] Criar rotas publicas separadas: `/`, `/cardapio`, `/produto/:slug|id`, `/carrinho`, `/checkout`, `/pedido/:id`, `/acompanhar`.
- [x] (`done`) [P0] Remover acoplamento da `Home` como tela unica de cardapio+carrinho+checkout+tracking.
- [ ] (`todo`) [P1] Criar layout publico reutilizavel (header/footer) para paginas de fluxo.

### C1.2 [Subtopico de E7] Cardapio dinamico (refino)
- [x] (`done`) [P0] Mover carregamento de catalogo para pagina/servico dedicado.
- [x] (`done`) [P1] Adicionar estados robustos de `loading`, `erro` e `vazio` por pagina.
- [x] (`done`) [P1] Padronizar filtros por categoria via URL (query param).

### C1.3 [Subtopico de E7] Detalhe de produto com extras
- [ ] (`todo`) [P0] Converter modal atual para fluxo de pagina (ou modal com URL canônica).
- [ ] (`todo`) [P0] Exibir disponibilidade de extras e preco final do item configurado.
- [x] (`done`) [P1] Persistir configuracao de item de forma estruturada para pedido (nao apenas em `notes`).

### C1.4 [Subtopico de E7] Carrinho separado
- [x] (`done`) [P0] Criar pagina `/carrinho` com resumo de itens, extras e observacoes.
- [ ] (`todo`) [P0] Garantir edicao/remocao por item configurado (chave de composicao).
- [ ] (`todo`) [P1] Exibir validacoes de disponibilidade antes de ir ao checkout.

### C1.5 [Subtopico de E7] Checkout real
- [x] (`done`) [P0] Remover dependencia de `clientId` manual da tela publica.
- [x] (`done`) [P0] Coletar dados de cliente/telefone/endereco conforme contrato backend real.
- [ ] (`todo`) [P0] Integrar cupom com feedback de validacao claro ao usuario.
- [ ] (`todo`) [P1] Preparar ponto de extensao para forma de pagamento.

### C1.6 [Subtopico de E7] Tracking e pos-compra
- [x] (`done`) [P0] Pagina dedicada `/pedido/:id` com tracking primario.
- [x] (`done`) [P1] Manter `/acompanhar` como busca manual secundaria por numero.
- [ ] (`todo`) [P1] Integrar CTA de WhatsApp contextual na jornada pos-checkout.

---

## C2 - E5 (Clientes e Configuracoes) - Subtopicos de Backoffice/Checkout
- Status: `done`
- Referencia principal: `E5 - Clientes e Configuracoes de Loja` no `ROADMAP.md`

### C2.1 [Subtopico de E5] Cliente automatico no checkout
- [x] (`done`) [P0] Criar endpoint publico de checkout que aceite dados de cliente (telefone como chave de deduplicacao).
- [x] (`done`) [P0] Implementar upsert de cliente por telefone (`find-or-create` + atualizacao de dados mutaveis).
- [x] (`done`) [P0] Ajustar criacao de pedido para usar cliente resolvido automaticamente.

### C2.2 [Subtopico de E5] Historico e consulta de cliente
- [x] (`done`) [P1] Endpoint de historico de pedidos por cliente.
- [x] (`done`) [P1] Endpoint admin para consulta de cliente e dados consolidados.

### C2.3 [Subtopico de E5] Configuracoes operacionais de loja
- [x] (`done`) [P0] Entidade/config de delivery (taxa padrao, pedido minimo, area atendida).
- [x] (`done`) [P1] Entidade/config de horario operacional.
- [x] (`done`) [P1] Entidade/config institucional (nome, descricao, contato, politicas).

---

## C3 - E3/E4 (Pedidos e Preco) - Subtopicos de Modelo de Pedido
- Status: `in-progress`
- Referencia principal: `E3` e `E4` no `ROADMAP.md`

### C3.1 [Subtopico de E3] Pedido com itens configurados (extras estruturados)
- [x] (`done`) [P0] Evoluir DTO de criacao de pedido para aceitar extras por item.
- [x] (`done`) [P0] Criar persistencia de extras no item do pedido (tabela dedicada ou snapshot JSON estruturado).
- [x] (`done`) [P0] Ajustar calculo de subtotal/total incluindo extras.
- [x] (`done`) [P0] Ajustar baixa de estoque considerando extras com consumo de insumo.

### C3.2 [Subtopico de E4] Promocao com itens configurados
- [ ] (`todo`) [P1] Validar impacto de combo/cupom no novo modelo de item com extras.
- [ ] (`todo`) [P1] Garantir auditoria de desconto aplicado com snapshot completo.

---

## C4 - E8 (Frontend Admin) - Subtopicos de Modulos Reais
- Status: `in-progress`
- Referencia principal: `E8 - Frontend Admin` no `ROADMAP.md`

### C4.1 [Subtopico de E8] Redesenho de IA de navegacao
- [ ] (`todo`) [P0] Definir mapa final de navegacao do admin (pedidos, cozinha, cardapio, estoque, promocoes, clientes, configuracoes).
- [ ] (`todo`) [P0] Remover placeholders por modulo real de forma incremental.
- [x] (`done`) [P0] Substituir placeholders de `pedidos` e `cozinha` por modulos funcionais iniciais.

### C4.2 [Subtopico de E8] Modulo de pedidos (admin)
- [x] (`done`) [P0] Listagem com filtros por status/data.
- [x] (`done`) [P0] Detalhe do pedido com timeline de status e auditoria.
- [x] (`done`) [P0] Acoes de transicao de status conforme role.
- [x] (`done`) [P0] Fluxo de cancelamento com confirmacao, mensagem ao cliente, nota interna e reversao de cancelamento.

### C4.3 [Subtopico de E8] Modulo cozinha
- [x] (`done`) [P0] Board operacional consumindo `/orders/kitchen/board`.
- [x] (`done`) [P0] Atualizacao em tempo real via `/orders/kitchen/stream`.
- [x] (`done`) [P0] Acoes rapidas de preparo/pronto.
- [x] (`done`) [P1] Atualizacao automatica por polling curto como etapa intermedia ate stream SSE dedicado no front admin.

### C4.4 [Subtopico de E8] Modulo cardapio e estoque
- [ ] (`todo`) [P0] CRUD completo de categorias/produtos/receitas/extras no admin.
- [ ] (`todo`) [P0] Tela de movimentacoes e alertas de estoque minimo.

### C4.5 [Subtopico de E8] Modulos promocoes, clientes e configuracoes
- [ ] (`todo`) [P0] Tela de cupons e combos com validacoes.
- [x] (`done`) [P1] Tela de clientes com historico de pedidos.
- [x] (`done`) [P1] Tela de configuracoes de loja.

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

---

## Plano de execucao em 5 dias (prioridade imediata)

### Dia 1 - Checkout real com cliente automatico (backend)
- [x] (`done`) [P0] Criar endpoint publico de checkout sem `clientId` manual.
- [x] (`done`) [P0] Implementar upsert de cliente por telefone (deduplicacao).
- [x] (`done`) [P0] Ajustar criacao de pedido para usar cliente resolvido.
- [ ] (`todo`) [P0] Testar via Insomnia: novo cliente, cliente existente, telefone invalido.
- Saida esperada:
  - Site nao precisa mais enviar `clientId`.
  - Pedido passa a nascer com cliente correto automaticamente.

### Dia 2 - Pedido com extras estruturados (backend)
- [x] (`done`) [P0] Evoluir contrato de pedido para aceitar extras por item.
- [x] (`done`) [P0] Persistir extras no item do pedido com snapshot consistente.
- [x] (`done`) [P0] Ajustar calculo de total incluindo extras.
- [x] (`done`) [P0] Ajustar baixa de estoque de extras vinculados a insumo.
- [x] (`done`) [P0] Testar fluxo completo: pedido com e sem extras.
- Saida esperada:
  - Extras deixam de depender de texto em `notes`.
  - Total e estoque refletem personalizacao real do pedido.

### Dia 3 - Quebra de fluxo no frontend publico
- [x] (`done`) [P0] Criar rotas: `/cardapio`, `/carrinho`, `/checkout`, `/pedido/:id`, `/acompanhar`.
- [x] (`done`) [P0] Reduzir `Home` para papel de landing e atalhos.
- [x] (`done`) [P0] Mover estado para servicos por dominio (catalogo, carrinho, checkout, tracking).
- [x] (`done`) [P1] Garantir navegacao sem perda de estado entre paginas.
- Saida esperada:
  - Fluxo visivel e limpo: cardapio -> carrinho -> checkout -> acompanhamento.

### Dia 4 - Integracao frontend com novo contrato de pedido
- [x] (`done`) [P0] Checkout enviar dados de cliente (telefone/endereco) e itens com extras estruturados.
- [x] (`done`) [P0] Pagina de detalhe do produto montar payload real de extras.
- [x] (`done`) [P0] Pagina `/pedido/:id` ser destino principal apos checkout.
- [x] (`done`) [P1] Manter `/acompanhar` como busca manual secundaria.
- Saida esperada:
  - Front e back alinhados no contrato final de pedido.
  - Jornada de compra completa sem campo tecnico.

### Dia 5 - Admin operacional minimo (pedidos + cozinha)
- [x] (`done`) [P0] Implementar modulo admin de pedidos (lista + detalhe + mudanca de status).
- [x] (`done`) [P0] Implementar modulo cozinha (board + stream + acao pronto).
- [x] (`done`) [P0] Validar regras de role entre `admin` e `kitchen`.
- [ ] (`todo`) [P0] Teste manual ponta a ponta: site -> admin -> cozinha -> tracking.
- Saida esperada:
  - Operacao real minima funcionando no admin.
  - Base pronta para avancar em estoque/promocoes/clientes/configuracoes.

### Regra de fechamento diario (execucao)
- Ao final de cada dia:
  - Atualizar status dos itens deste arquivo.
  - Atualizar `ROADMAP.md` apenas no macro-item correspondente.
  - Fazer commit separado por dia concluido.
