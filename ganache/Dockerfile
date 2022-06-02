FROM ubuntu:18.04

USER root
RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get -y install curl gnupg wget make cmake
RUN curl -sL https://deb.nodesource.com/setup_14.x  | bash -
RUN apt-get -y install nodejs

WORKDIR /ganache
COPY package.json .
RUN npm install
CMD ["npx", "ganache", "-h","0.0.0.0","-p","8545","--server.ws","-f","https://eth-mainnet.alchemyapi.io/v2/KEY_GOES_HERE", "-m", "cruel rebel frown short month love belt weather sense hood cage pact","--chain.allowUnlimitedContractSize"]