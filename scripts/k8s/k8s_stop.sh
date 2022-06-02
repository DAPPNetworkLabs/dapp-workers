kubectl delete -f ipfs-data-persistentvolumeclaim.yaml,ipfs0-deployment.yaml,ipfs0-service.yaml --all=true
kubectl delete -f postgres-deployment.yaml,postgres-service.yaml --all=true
kubectl delete -f rust-compiler-deployment.yaml,git-cloner-deployment.yaml,monte-carlo-dice-deployment.yaml,runner-deployment.yaml,solidity-runner-deployment.yaml,wasi-service-deployment.yaml --all=true
kubectl delete -f eth-deployment.yaml,eth-service.yaml --all=true
kubectl delete -f orchestrator-deployment.yaml,orchestrator-service.yaml --all=true
kubectl delete -f api-deployment.yaml,api-service.yaml --all=true
kubectl delete -f nexus-deployment.yaml --all=true