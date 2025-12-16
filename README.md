# 🛒 Powerfit Suplementos - Plataforma de E-commerce

Esta plataforma é um sistema completo de e-commerce focado na venda de suplementos, construído com uma arquitetura moderna baseada em **monorepo/microserviços**, utilizando **React** no frontend e **NestJS** no backend, orquestrados via **Docker**.

Desenvolvido por **Samara Araújo** e **Adriel Gomes**.

---

## 🛠️ Tecnologias Utilizadas

O projeto é dividido em duas partes principais:

### Backend (`loja_api`)

| Tecnologia     | Descrição                                                          |
| :------------- | :----------------------------------------------------------------- |
| **NestJS**     | Framework Node.js para construção de APIs escaláveis e modulares.  |
| **TypeORM**    | ORM para mapeamento objeto-relacional e persistência de dados.     |
| **TypeScript** | Linguagem principal, garantindo tipagem forte e escalabilidade.    |
| **PostgreSQL** | Banco de dados relacional.                                         |
| **Redis**      | Cache em memória para alta performance (produtos, carrinho, etc.). |
| **JWT**        | Autenticação e autorização baseada em tokens (Admin e Cliente).    |
| **Docker**     | Containerização do backend e serviços de infraestrutura.           |

### Frontend (`frontend`)

| Tecnologia           | Descrição                                                           |
| :------------------- | :------------------------------------------------------------------ |
| **React**            | Biblioteca JavaScript para construção da interface do usuário.      |
| **Vite / CRA**       | Ferramenta de build e bundling (conforme configuração local).       |
| **Axios**            | Cliente HTTP para comunicação com a API REST.                       |
| **React Router DOM** | Roteamento entre telas e painéis.                                   |
| **CSS Puro**         | Estilização customizada com layout responsivo e tema preto/amarelo. |

### Orquestração

* **Docker & Docker Compose**: Gerenciamento do ambiente de desenvolvimento e produção.

---

## 🚀 Como Executar o Projeto

> Pré-requisitos: **Docker** e **Docker Compose** instalados.

### 1️⃣ Clonar o Repositório

```bash
git clone https://github.com/s4mnara/Ecommerce-nestjs.git
cd Ecommerce-nestjs
```

### 2️⃣ Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (ou nos serviços correspondentes) com as variáveis necessárias:

```env
# Backend
DB_HOST=loja_db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=loja_db

JWT_SECRET=sua_chave_secreta

# Redis
REDIS_HOST=loja_redis
REDIS_PORT=6379
```

### 3️⃣ Subir os Contêineres

```bash
docker-compose up --build
```

⚠️ **Nota sobre Memória (ENOMEM)**
Se o serviço `loja_api` falhar com erro `ENOMEM`, aumente a memória do Docker Desktop:

> Configurações → Recursos → Memória (recomendado ≥ 4GB)

### 4️⃣ Acessar a Aplicação

* **Frontend / Login do Cliente:**
  👉 `http://localhost:3000/login`

* **API Backend:**
  👉 `http://localhost:8080`

---

## 📦 Funcionalidades da Aplicação

### 🔐 Autenticação & Usuários

* Login e registro de usuários
* Autenticação JWT
* Controle de acesso por cargo (`admin` e `cliente`)

### 🧑‍💼 Painel Administrativo (`/dashboard`)

Acessível apenas para usuários com papel **admin**:

* CRUD completo de produtos
* Upload de imagens de produtos
* Visualização de clientes
* Pesquisa global (produtos e usuários)
* logs dos usuários

### 🛍️ Painel do Cliente (`/client`)

Acessível para usuários **cliente**:

* Listagem e visualização de produtos
* Carrinho de compras
* Atualização de quantidades
* Finalização de pedidos
* Histórico de pedidos

---

## ⚡ Cache & Performance

O sistema utiliza **Redis** para cache em memória, garantindo alta performance:

* Cache de produtos (`produtos:all`, `produtos:{id}`)
* Cache de carrinho por usuário (`carrinho:{usuarioId}`)
* Invalidação automática ao criar, atualizar ou remover dados

Todas as chaves podem ser visualizadas via:

```bash
docker exec -it loja_redis redis-cli
keys *
```

---

## 🎨 Estrutura Visual

O design segue uma identidade visual moderna com alto contraste:

* **Cores principais:** Preto e Amarelo
* **Tema:** Powerfit Suplementos
* **Estilo:** Minimalista e focado em conversão

---



## 👩‍💻 Autores

* **Samara Araújo**
* **Adriel Gomes**

---

⭐ Se este projeto te ajudou, considere deixar uma estrela no repositório!
