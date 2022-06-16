FROM node:16

ARG IPFS_HOST=$IPFS_HOST
ENV IPFS_HOST=$IPFS_HOST
RUN wget https://dist.ipfs.io/go-ipfs/v0.9.1/go-ipfs_v0.9.1_linux-amd64.tar.gz && \
    tar -xvzf go-ipfs_v0.9.1_linux-amd64.tar.gz && \
    cd go-ipfs && \
    /bin/bash install.sh && \
    cd .. && \
    rm -rf go-ipfs && \
    rm go-ipfs_v0.9.1_linux-amd64.tar.gz
RUN ipfs init

ADD entrypoint.sh /

ENTRYPOINT [ "/entrypoint.sh" ]