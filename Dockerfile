FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY client ./client
COPY server ./server
RUN npm --prefix client ci && npm --prefix server ci \
  && npm --prefix client run build \
  && npm --prefix server run build
ENV NODE_ENV=production
ENV PORT=3010
EXPOSE 3010
CMD ["node", "server/dist/server.js"]
