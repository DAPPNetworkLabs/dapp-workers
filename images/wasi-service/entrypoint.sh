#!/bin/bash
set -e
# run unpack ipfs
ipfs get --api="/dns/$IPFS_HOST/tcp/5001"  --output /tmp1 $ARG_0

source /root/.bashrc

node ./dist/index.js /tmp1/$ARG_1.wasm # > /tmp1/stdout.txt

# pin and post ipfs
ipfs add -r --api="/dns/$IPFS_HOST/tcp/5001" /tmp1 -Q
