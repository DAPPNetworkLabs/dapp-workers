# FROM node:16-alpine AS builder
# WORKDIR /app
# COPY . .
# RUN npm rebuild node-sass
# RUN yarn run build

# FROM node:16-alpine
# RUN yarn global add serve
# WORKDIR /app
# COPY --from=builder /app/build .
# CMD ["serve", "-p", "80", "-s", "."]

FROM node:16-alpine
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install --silent
RUN npm install react-scripts@3.4.1 -g --silent

# add app
COPY . ./