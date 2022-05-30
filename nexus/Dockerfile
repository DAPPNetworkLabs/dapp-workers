FROM node:16-alpine
WORKDIR /app/nexus
COPY . .
RUN npm i
RUN chmod +x /app/nexus/wait-for-it.sh
RUN apk update && apk add bash