FROM ubuntu:18.04

USER root
RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get -y install curl gnupg wget make cmake
RUN curl -sL https://deb.nodesource.com/setup_17.x  | bash -
RUN apt-get -y install nodejs
RUN curl -fsSL https://get.docker.com -o get-docker.sh
RUN sh get-docker.sh

WORKDIR /app/orchestrator
COPY package.json .
RUN npm install\
    && npm install typescript -g
COPY . .
RUN tsc
RUN chmod +x /app/orchestrator/wait-for-it.sh