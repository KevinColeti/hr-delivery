# HRNachapa - Projeto Angular com Docker e PostgreSQL

## Tecnologias

- **Angular 21** - Framework frontend
- **TailwindCSS** - Framework CSS utility-first
- **PostgreSQL 16** - Banco de dados
- **Docker** - Containerização
- **Nginx** - Servidor web para produção

## Estrutura do Projeto

```
hrnachapa/
├── hrnachapa-app/          # Aplicação Angular
│   ├── src/                # Código fonte
│   ├── Dockerfile          # Dockerfile da aplicação
│   ├── .dockerignore       # Arquivos ignorados no build
│   └── tailwind.config.js  # Configuração do TailwindCSS
└── docker-compose.yml      # Orquestração dos containers
```

## Pré-requisitos

- Node.js 22+
- npm 10+
- Docker e Docker Compose

## Desenvolvimento Local (sem Docker)

1. Instalar dependências:
```bash
cd hrnachapa-app
npm install
```

2. Executar em modo desenvolvimento:
```bash
npm start
```

A aplicação estará disponível em `http://localhost:4200`

## Executar com Docker

1. Build e iniciar os containers:
```bash
docker compose up --build
```

2. Acessar a aplicação:
- **Frontend**: http://localhost:4200
- **PostgreSQL**: localhost:5432

### Credenciais do PostgreSQL

- **Database**: hrnachapa_db
- **User**: hrnachapa_user
- **Password**: hrnachapa_pass

## Comandos Úteis

### Docker

```bash
# Iniciar containers
docker compose up

# Iniciar em background
docker compose up -d

# Parar containers
docker compose down

# Rebuild containers
docker compose up --build

# Ver logs
docker compose logs -f

# Acessar PostgreSQL
docker exec -it hrnachapa-postgres psql -U hrnachapa_user -d hrnachapa_db
```

### Angular

```bash
# Desenvolvimento
npm start

# Build de produção
npm run build

# Testes
npm test

# Linting
npm run lint
```

## TailwindCSS

O TailwindCSS está configurado e pronto para uso. Você pode usar as classes utilitárias diretamente nos templates HTML:

```html
<div class="bg-blue-500 text-white p-4 rounded-lg">
  Hello TailwindCSS!
</div>
```

## Próximos Passos

1. Instalar Docker Desktop (se ainda não tiver)
2. Configurar conexão com PostgreSQL na aplicação Angular
3. Criar models e services para comunicação com o backend
4. Desenvolver componentes e páginas da aplicação
