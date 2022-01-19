FROM node:alpine
WORKDIR /app/orchestrator
COPY package.json .
RUN npm install\
    && npm install typescript -g
COPY . .
RUN tsc
# ADD wait-for-it.sh /
RUN chmod +x /app/orchestrator/wait-for-it.sh
# ENTRYPOINT [ "/wait-for-it.sh", "--timeout=5", "eth:8545", "--", "node", "./dist/index.js" ]