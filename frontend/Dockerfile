# Etapa 1: Build do React
FROM node:18-alpine AS build

WORKDIR /app

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Copia arquivos de dependências
COPY package*.json ./
RUN npm install

# Copia tudo que o build precisa
COPY . .

# Build do projeto (o bundle terá REACT_APP_API_URL)
RUN npm run build


FROM nginx:stable-alpine

# Copia o build final para o Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copia arquivo de configuração customizado (opcional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

