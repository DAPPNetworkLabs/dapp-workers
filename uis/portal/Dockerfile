FROM node:16-alpine AS builder
WORKDIR /app
COPY . .
RUN npm rebuild node-sass
RUN yarn run build

FROM node:16-alpine
RUN yarn global add serve
WORKDIR /app
COPY --from=builder /app/build .
CMD ["serve", "-p", "80", "-s", "."]