#!/bin/bash
set -e
ipfs get --api="/dns/$IPFS_HOST/tcp/5001" --output /tmp1 -- $1

cd /tmp1/$2
cp /.config.json .

npm i
npm run-script worker