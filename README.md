# HRNachapa

Projeto de sistema para hamburgueria com:
- Site cliente para pedidos de delivery
- Painel administrativo para operacao da loja
- Controle de estoque por insumos
- Promocoes, clientes e integracao WhatsApp

## Status atual do repositorio

O que ja existe hoje:
- Frontend Angular base do site publico com catalogo mock
- Estrutura inicial de `/admin` (apenas esboco visual)
- Docker com frontend + PostgreSQL

O que ainda nao existe:
- Backend/API real
- Fluxo real de pedidos
- Persistencia de dados de negocio (alem do banco subir via Docker)
- Tempo real de pedidos/cozinha

## Visao da Fase 1 (MVP)

Escopo fechado para primeira entrega:
1. Operacao apenas `delivery`
2. Perfis `admin` e `cozinha`
3. Pedidos com atualizacao em tempo real
4. Estoque por insumos com baixa automatica por receita/extras
5. Cupons e combos automaticos (incluindo primeiro pedido e valor minimo)
6. Integracao WhatsApp para eventos essenciais do pedido

## Fase 1 - Modulos do Admin

1. Dashboard operacional
2. Pedidos (gestao completa de status)
3. Tela cozinha (modo monitor + marcar pronto)
4. Cardapio (produtos, categorias, receitas e extras)
5. Estoque (insumos, movimentacoes e alertas)
6. Promocoes (cupons e combos)
7. Clientes (historico e dados)
8. Configuracoes de loja/delivery
9. Usuarios e permissoes (admin/cozinha)

## Fase 1 - Modulos do Site Cliente

1. Home com cardapio dinamico
2. Detalhe de produto com extras/observacoes
3. Carrinho com calculo completo
4. Checkout de delivery (dados cliente/endereco/pagamento/cupom)
5. Criacao de pedido e retorno de numero
6. Acompanhamento de status do pedido
7. Contato/atualizacoes via WhatsApp

## Estrutura do projeto

```text
hrnachapa/
|- hrnachapa-app/        # Frontend Angular (site + esboco admin)
|- docker-compose.yml    # Frontend + PostgreSQL
|- README.md
|- ROADMAP.md            # Plano de execucao da Fase 1
```

## Stack atual

- Angular 21
- TailwindCSS v3
- PostgreSQL 16
- Docker / Docker Compose
- Nginx (container de producao do frontend)

## Como rodar o projeto atual

### Sem Docker

```bash
cd hrnachapa-app
npm install
npm start
```

App em: `http://localhost:4200`

### Com Docker

```bash
docker compose up --build
```

Servicos:
- Frontend: `http://localhost:4200`
- PostgreSQL: `localhost:5432`

Credenciais do banco (ambiente local atual):
- Database: `hrnachapa_db`
- User: `hrnachapa_user`
- Password: `hrnachapa_pass`

## Planejamento

O plano detalhado por epicos, stories, prioridade e status esta em:
- `ROADMAP.md`

## Proximos passos imediatos (P0)

1. Definir e iniciar backend/API
2. Modelar banco para pedidos, produtos, insumos, promocoes e clientes
3. Implementar autenticacao/autorizacao por perfil
4. Implementar fluxo de pedidos + tempo real
5. Integrar frontend (site/admin) com API
