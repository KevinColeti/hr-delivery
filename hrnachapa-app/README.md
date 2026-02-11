# HRNachapa - Projeto Angular com Docker e PostgreSQL

## Tecnologias

- **Angular 21** - Framework frontend
- **TailwindCSS v3** - Framework CSS utility-first
- **PostgreSQL 16** - Banco de dados
- **Docker** - Containerização
- **Nginx** - Servidor web para produção

## Estrutura do Projeto

```
hrnachapa/
├── hrnachapa-app/          # Aplicação Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── header/           # Header com logo e navegação
│   │   │   │   ├── footer/           # Footer com contatos e redes sociais
│   │   │   │   ├── product-card/     # Card de produto
│   │   │   │   └── category-section/ # Seção de categoria
│   │   │   └── data/
│   │   │       └── products.ts       # Dados de produtos (mock)
│   ├── Dockerfile          # Dockerfile da aplicação
│   ├── .dockerignore       # Arquivos ignorados no build
│   └── tailwind.config.js  # Configuração do TailwindCSS
├── docker-compose.yml      # Orquestração dos containers
└── .vscode/
    └── settings.json       # Configuração do Tailwind IntelliSense
```

## Funcionalidades Implementadas

### Interface do Usuário
- ✅ Header responsivo com logo, nome da loja e menu hambúrguer (mobile)
- ✅ Catálogo de produtos organizado por categorias
- ✅ Cards de produtos com imagem, descrição e preço
- ✅ Footer com informações de contato e redes sociais
- ✅ Design mobile-first com TailwindCSS

### Dados Dinâmicos (Preparados para API)

Os seguintes dados estão atualmente em mock, mas preparados para serem substituídos por chamadas de API:

#### Header (`HeaderComponent`)
- `storeName` - Nome da loja
- `logoUrl` - URL da logo

#### Footer (`FooterComponent`)
- `storeName` - Nome da loja
- `address` - Endereço completo
- `phone` - Telefone de contato
- `email` - Email de contato
- `instagramUrl` - Link do Instagram
- `whatsappUrl` - Link do WhatsApp
- `currentYear` - Ano atual (gerado automaticamente)

#### Produtos (`products.ts`)
- `products[]` - Array de produtos com:
  - `id` - ID único
  - `name` - Nome do produto
  - `description` - Descrição
  - `price` - Preço
  - `image` - URL da imagem
  - `category` - Categoria do produto
- `categories[]` - Array de categorias disponíveis

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

O TailwindCSS v3 está configurado e pronto para uso. O IntelliSense está habilitado para arquivos `.html` e `.ts`.

```html
<div class="bg-blue-500 text-white p-4 rounded-lg">
  Hello TailwindCSS!
</div>
```

## Próximos Passos

### Backend Integration
1. Criar API REST ou GraphQL para servir dados dinâmicos
2. Implementar serviços Angular para consumir a API:
   - `ProductService` - Gerenciar produtos e categorias
   - `StoreService` - Gerenciar informações da loja (header/footer)
3. Conectar PostgreSQL com o backend
4. Substituir dados mock por chamadas de API

### Funcionalidades Futuras
- Sistema de carrinho de compras
- Autenticação de usuários
- Painel administrativo
- Sistema de pedidos
- Integração com pagamento

## Desenvolvido por

[KelvinColeti](https://kelvincoleti.com)
