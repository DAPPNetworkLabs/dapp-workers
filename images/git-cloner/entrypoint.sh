#!/bin/bash
set -e
ipfs get --api="/dns/$IPFS_HOST/tcp/5001" --output /tmp1 -- $1

cd /tmp1
git clone $(cat ./url.txt)

ipfs add -r --api="/dns/$IPFS_HOST/tcp/5001" /tmp1 -Q