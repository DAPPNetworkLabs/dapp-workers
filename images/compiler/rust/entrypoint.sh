#!/bin/bash
set -e
ipfs get --api="/dns/$IPFS_HOST/tcp/5001" --output /tmp1 -- $1
cd /tmp1
cargo build --target wasm32-wasi --release

ipfs add -r --api="/dns/$IPFS_HOST/tcp/5001" /tmp1 -Q
