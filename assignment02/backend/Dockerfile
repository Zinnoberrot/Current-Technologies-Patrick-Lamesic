FROM node:22-alpine

WORKDIR /app

# erst abhängigkeiten, wegen layer cache
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js db.js questions.json ./

ENV NODE_ENV=production
EXPOSE 3000

# nicht als root
USER node

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
