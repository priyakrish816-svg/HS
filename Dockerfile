FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data

COPY server.js ./
COPY public ./public
COPY private ./private

# /data holds users.json; mount a persistent volume here
RUN mkdir -p /data && chown -R node:node /data
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
CMD ["node", "server.js"]
