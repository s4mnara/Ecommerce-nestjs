
# 🛒 Powerfit Suplementos - Plataforma de E-commerce

Esta plataforma é um sistema completo de e-commerce focado na venda de suplementos, construído com uma arquitetura moderna baseada em microserviços/monorepo utilizando **React** para o frontend e **NestJS** para o backend, orquestrados via **Docker**.

Desenvolvido por **Samara Araújo** e **Adriel Gomes**.

## 🛠️ Tecnologias Utilizadas

O projeto é dividido em duas partes principais:

### Backend (loja_api)
| Tecnologia | Descrição |
| :--- | :--- |
| **NestJS** | Framework Node.js para construção de APIs escaláveis. |
| **TypeORM** | Mapeador Objeto-Relacional (ORM) para interação com o banco de dados. |
| **TypeScript** | Linguagem principal para segurança e escalabilidade. |
| **Autenticação JWT** | Segurança baseada em tokens para acesso (Admin e Cliente). |

### Frontend (frontend)
| Tecnologia | Descrição |
| :--- | :--- |
| **React** | Biblioteca JavaScript para construção da interface do usuário. |
| **Vite / Create React App** | Ferramenta de build/bundling (depende da sua configuração local). |
| **Axios** | Cliente HTTP para comunicação com a API REST. |
| **Roteamento** | `react-router-dom` para navegação entre painéis. |
| **Layout & Estilo** | Arquivos `.css` customizados com layout responsivo e design preto/amarelo. |

### Orquestração
* **Docker & Docker Compose**: Gerenciamento e execução do ambiente de desenvolvimento/produção.

## 🚀 Como Executar o Projeto

Certifique-se de ter o **Docker** e o **Docker Compose** instalados em sua máquina.

### 1. Clonar o Repositório

```bash
git clone [https://github.com/s4mnara/Ecommerce-nestjs.git](https://github.com/s4mnara/Ecommerce-nestjs.git)
cd Ecommerce-nestjs
````

### 2\. Configurar o Ambiente

Crie um arquivo `.env` na raiz do projeto (ou nas pastas de cada serviço, se for um monorepo) com as variáveis de ambiente necessárias para o banco de dados, JWT, e portas.

### 3\. Subir os Contêineres

Execute o comando `docker-compose` para construir e iniciar todos os serviços (API e Frontend):

```bash
docker-compose up --build
```

**Nota sobre Memória (ENOMEM):** Se o serviço `loja_api` falhar com um erro `ENOMEM`, você precisa **aumentar a alocação de memória RAM** para o Docker Desktop (Configurações \> Recursos \> Memória).

### 4\. Acessar a Aplicação

O frontend estará disponível em:

  * **Acesso Cliente/Login:** `http://localhost:3000/login`

## 📦 Funcionalidades da Aplicação

### 1\. Autenticação & Usuários

  * **Login/Registro**: Páginas de acesso com validação de credenciais. O layout é centralizado e apresenta a logo "Powerfit Suplementos" e o campo de login alinhado à esquerda.
  * **Cargos**: O sistema diferencia entre `admin` e `cliente`.

### 2\. Painel Administrativo (`/dashboard`)

Acessível apenas por usuários com o cargo `admin`.

  * **Gerenciamento de Produtos**: CRUD (Criar, Ler, Atualizar, Deletar) de produtos, incluindo nome, descrição, preço, estoque e upload de imagem.
  * **Visualização de Clientes**: Lista de clientes e seus dados básicos (e-mail, pedidos, itens no carrinho).
  * **Pesquisa**: Barra de pesquisa unificada para produtos e clientes.

### 3\. Painel do Cliente (`/client`)

Acessível apenas por usuários com o cargo `cliente`.

  * **Visualização de Produtos**: Carrossel responsivo de produtos disponíveis para compra.
  * **Carrinho de Compras**: Funcionalidade para adicionar, remover e ajustar a quantidade de itens.
  * **Finalização de Pedido**: Processamento do carrinho para histórico de pedidos.
  * **Histórico de Pedidos**: Visualização dos pedidos finalizados.

## 🎨 Estrutura Visual

O design adota um tema de alto contraste utilizando:

  * **Fundo**: Gradiente suave de preto para amarelo.
  * **Cores de Ação**: Preto e amarelo (`--color-primary` e `--color-secondary`).
  * **Componentes**: Layout responsivo otimizado para visualização em desktop e mobile.

## 🤝 Contribuições

Sinta-se à vontade para abrir *issues* para relatar bugs ou sugerir melhorias. Se quiser contribuir, por favor, faça um *fork* do projeto e envie um *pull request*!
