FROM ubuntu:18.04

USER root
RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get -y install curl gnupg wget make cmake
RUN curl -fsSL https://get.docker.com -o get-docker.sh
RUN sh get-docker.sh

ADD entrypoint.sh /

ENTRYPOINT [ "/entrypoint.sh" ]