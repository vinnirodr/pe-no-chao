FROM node:18

WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala TODAS as dependências (incluindo dev), mas depois remove nodemon
RUN npm install && npm uninstall nodemon --save-dev || true

# Copia o restante do código
COPY . .

# Porta do backend
ENV PORT=3001

EXPOSE 3001

# Inicia o backend
CMD ["node", "index.js"]
