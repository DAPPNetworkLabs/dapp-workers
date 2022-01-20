FROM node:16-alpine
WORKDIR /app/nexus
COPY . .
RUN npm i
# ADD wait-for-it.sh /
RUN chmod +x /app/nexus/wait-for-it.sh
RUN apk update && apk add bash
# ENTRYPOINT [ "/wait-for-it.sh", "--timeout=5", "eth:8545", "--", "npx", "hardhat", "test", "--network", "tests" ]