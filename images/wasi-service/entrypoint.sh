#!/bin/bash
set -e
# run unpack ipfs
ipfs get --api="/dns/ipfs.liquidapps.io/tcp/5001"  --output /tmp1 $1

source /root/.bashrc

node ./dist/index.js /tmp1/$2.wasm # > /tmp1/stdout.txt

# pin and post ipfs
ipfs add -r --api="/dns/ipfs.liquidapps.io/tcp/5001" /tmp1 -Q
