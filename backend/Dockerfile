
FROM node:18-alpine


WORKDIR /app


COPY package*.json ./


RUN npm ci --only=production


COPY src/ ./src/


RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001


RUN chown -R nodejs:nodejs /app
USER nodejs


EXPOSE 3001


HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"


CMD ["npm", "start"] 