#!/bin/bash
set -e

# set envs

# run unpack ipfs
ipfs get --api="/dns/$IPFS_HOST/tcp/5001"  --output /tmp1 $1

source /root/.bashrc
# run command , with output to /tmp1/stdout and stderr

# pin and post ipfs
ipfs add -r --api="/dns/$IPFS_HOST/tcp/5001" /tmp1 -Q
