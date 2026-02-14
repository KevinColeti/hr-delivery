# AI Context - HRNaChapa

## Objetivo do projeto
Sistema para hamburgueria com:
- Site cliente (delivery)
- Painel administrativo (operacao)
- Controle de estoque por insumos
- Fluxo de pedidos com status

---

## Stack tecnologica

### Frontend
- Angular 21 (standalone components)
- TailwindCSS v3
- TypeScript

### Backend
- NestJS 11
- TypeORM 0.3.x
- PostgreSQL 16
- JWT auth (roles: `admin`, `kitchen`)

### Infra
- Docker Compose
  - `postgres` (banco)
  - `angular-app` (frontend)

---

## Estrutura de pastas (alto nivel)

```text
hrnachapa/
|- hrnachapa-app/                 # Frontend Angular
|  |- src/app/
|  |  |- components/              # Site publico (header/home/footer/cards)
|  |  |- admin/                   # UI admin (esboco inicial)
|  |  |- data/                    # Mocks de frontend
|  |- public/                     # Assets publicos (logo etc)
|
|- backend/                       # API NestJS
|  |- src/
|  |  |- auth/                    # Login JWT, guards, roles
|  |  |- users/                   # Servico de usuarios
|  |  |- categories/              # CRUD categorias
|  |  |- ingredients/             # CRUD insumos
|  |  |- products/                # CRUD produtos + disponibilidade
|  |  |- product-ingredients/     # Receita por produto
|  |  |- product-extras/          # Extras por produto
|  |  |- orders/                  # Pedidos e transicao de status
|  |  |- entities/                # Entidades TypeORM
|  |  |- database/
|  |  |  |- migrations/           # Migracoes versionadas
|  |  |  |- data-source.ts        # Config TypeORM CLI
|
|- ROADMAP.md                     # Planejamento e progresso
|- README.md                      # Documentacao do projeto
|- docker-compose.yml
```

---

## Filosofia de design (site)

Direcao visual atual:
- Estilo: **rustico artesanal**
- Tom: **premium**
- Prioridade: **mobile-first**
- Marca: **HR Na Chapa**

Principios adotados:
1. Atmosfera quente (tons terrosos, acento cobre/dourado).
2. Tipografia com personalidade (titulo mais artesanal, texto legivel).
3. Layout simples para compra rapida (cardapio -> carrinho -> checkout -> acompanhamento).
4. Visual de prototipo apresentavel ao cliente, mesmo sem backend completo.
5. Sem excesso de efeitos; animacoes leves e funcionais.

---

## Filosofia de implementacao (backend)

1. Implementar por modulos pequenos, fim a fim.
2. Evitar "gambiarras": usar padrao oficial de Nest/TypeORM.
3. Validar regras de negocio no backend antes da integracao no frontend.
4. Migracoes sempre versionadas e aplicadas por comando.
5. Controle de acesso por perfil desde o inicio.

---

## Estado atual (resumo)

Ja implementado:
- Auth JWT + roles (`admin`, `kitchen`)
- CRUD de categorias, insumos e produtos
- Receita por produto (`product_ingredients`)
- Extras por produto (`product_extras`)
- Pedidos base com status
- Baixa automatica de estoque ao confirmar pedido
- Disponibilidade de produto baseada em estoque/receita

Pendencias importantes:
- Historico de movimentacao de estoque
- Alertas de estoque minimo
- Tempo real para cozinha/pedidos
- Frontend conectado na API real

---

## Como retomar a sessao (checklist rapido)

### 1) Subir banco
```bash
cd g:\PROJETOS\hrnachapa
docker compose up -d postgres
```

### 2) Rodar backend
```bash
cd g:\PROJETOS\hrnachapa\backend
npm install
npm run migration:run
npm run start:dev
```

### 3) Rodar frontend
```bash
cd g:\PROJETOS\hrnachapa\hrnachapa-app
npm install
npm start
```

### 4) Verificacoes basicas
- Health backend: `GET http://localhost:3000/health`
- Login: `POST http://localhost:3000/auth/login`
- Frontend: `http://localhost:4200`

### 5) Arquivos guia da sessao
- `ROADMAP.md` (prioridades e progresso)
- `AI_CONTEXT.md` (contexto tecnico e design)
