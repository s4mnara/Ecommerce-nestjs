# Etapa 1: Build do React
FROM node:18-alpine AS build

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./
RUN npm install

# Copia **tudo** que o build precisa
COPY . .

# Build do projeto
RUN npm run build


FROM nginx:stable-alpine

# Copia o build final para o Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copia arquivo de configuração customizado (opcional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
