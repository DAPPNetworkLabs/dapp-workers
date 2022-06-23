FROM golang:1.16.7-buster

RUN apt-get update -y && \
    apt-get install -y curl xz-utils fuse libssl-dev ca-certificates fuse && \
    rm -rf /var/apt/lists/* &&  \
    curl https://wasmtime.dev/install.sh -sSf | bash && \
    apt-get remove --purge

RUN wget https://dist.ipfs.io/go-ipfs/v0.9.1/go-ipfs_v0.9.1_linux-amd64.tar.gz && \
    tar -xvzf go-ipfs_v0.9.1_linux-amd64.tar.gz && \
    cd go-ipfs && \
    bash install.sh && \
    cd .. && \
    rm -rf go-ipfs && \
    rm go-ipfs_v0.9.1_linux-amd64.tar.gz
RUN ipfs init
ADD entrypoint.sh /

ENTRYPOINT [ "/entrypoint.sh" ]