FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --production=false
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --production
EXPOSE 3000
CMD ["npm", "start"]
