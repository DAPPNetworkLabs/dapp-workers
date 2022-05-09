#!/bin/bash
set -e

mkdir tmp1
cd /tmp1
mv ../genesis.json .
mkdir node1
echo 'passwordnode1' > node1/password.txt
geth account new --datadir node1 --password node1/password.txt
export SEAL_ADDRESS=$(echo ./node1/keystore/*)
export SEAL_ADDRESS=${SEAL_ADDRESS: -40}
export POA_ADDRESS=$3
export EXTRA_DATA=0x0000000000000000000000000000000000000000000000000000000000000000${SEAL_ADDRESS}0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
echo "$(jq '.alloc[$POA_ADDRESS] = { "balance": "0x200000000000000000000000000000000000000000000000000000000000000" }' --arg POA_ADDRESS "$POA_ADDRESS" genesis.json)" > genesis.json
echo "$(jq '.extraData = $EXTRA_DATA' --arg EXTRA_DATA "$EXTRA_DATA" genesis.json)" > genesis.json
geth init genesis.json --datadir node1/
geth --datadir node1/ --syncmode 'full' --networkid 888 --http --http.addr 0.0.0.0 --http.api "personal,eth,net,web3" --http.corsdomain "*" --http.vhosts "*" --miner.threads 1 --unlock $SEAL_ADDRESS --password node1/password.txt --mine --allow-insecure-unlock