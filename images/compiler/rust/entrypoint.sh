#!/bin/bash
set -e
ipfs get --api="/dns/ipfs.liquidapps.io/tcp/5001" --output /tmp1 -- $1
cd /tmp1
cargo build --target wasm32-wasi --release

ipfs add -r --api="/dns/ipfs.liquidapps.io/tcp/5001" /tmp1 -Q
