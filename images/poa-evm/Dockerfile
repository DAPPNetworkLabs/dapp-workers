FROM ubuntu:18.04

RUN apt-get update
RUN apt-get install wget -y

ADD entrypoint.sh /

RUN apt-get install jq -y
RUN apt-get update
RUN apt-get install software-properties-common -y
RUN add-apt-repository -y ppa:ethereum/ethereum
RUN apt-get update
RUN apt-get install ethereum -y

COPY genesis.json .

ENTRYPOINT [ "/entrypoint.sh" ]