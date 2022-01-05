FROM node:16-alpine
WORKDIR /app
COPY . .
RUN npm i
CMD ["npx", "hardhat", "test"]