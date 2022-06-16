#!/bin/bash
set -e
ipfs get --api="/dns/$IPFS_HOST/tcp/5001" --output /tmp1 -- $ARG_0

cd /tmp1/$ARG_1

node index.js