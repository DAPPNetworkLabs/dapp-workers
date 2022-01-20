FROM node:alpine
WORKDIR /app/orchestrator
COPY package.json .
RUN npm install\
    && npm install typescript -g
COPY . .
RUN tsc
RUN chmod +x /app/orchestrator/wait-for-it.sh
RUN apk update && apk add bash