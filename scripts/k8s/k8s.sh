./home/ubuntu/environment/dapp-workersscripts/deploy-roots.sh 
kubectl apply -f ipfs-data-persistentvolumeclaim.yaml,ipfs0-deployment.yaml,ipfs0-service.yaml
kubectl apply -f postgres-deployment.yaml,postgres-service.yaml
kubectl apply -f rust-compiler-deployment.yaml,git-cloner-deployment.yaml,monte-carlo-dice-deployment.yaml,runner-deployment.yaml,solidity-runner-deployment.yaml,wasi-service-deployment.yaml
kubectl apply -f eth-deployment.yaml,eth-service.yaml
kubectl apply -f orchestrator-deployment.yaml,orchestrator-service.yaml
kubectl apply -f nexus-deployment.yaml