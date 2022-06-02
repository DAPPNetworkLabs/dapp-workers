FROM ubuntu:18.04

USER root
RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get -y install curl gnupg wget make cmake
RUN curl -sL https://deb.nodesource.com/setup_17.x  | bash -
RUN apt-get -y install nodejs

WORKDIR /app/api
COPY package.json .
RUN npm install\
    && npm install typescript -g
COPY . .
RUN tsc