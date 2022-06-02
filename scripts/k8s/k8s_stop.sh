kubectl delete -f $PWD/k8s/test/ipfs-data-persistentvolumeclaim.yaml,$PWD/k8s/test/ipfs0-deployment.yaml,$PWD/k8s/test/ipfs0-service.yaml
kubectl delete -f $PWD/k8s/test/postgres-deployment.yaml,$PWD/k8s/test/postgres-service.yaml
kubectl delete -f $PWD/k8s/test/rust-compiler-deployment.yaml,$PWD/k8s/test/git-cloner-deployment.yaml,$PWD/k8s/test/monte-carlo-dice-deployment.yaml,$PWD/k8s/test/runner-deployment.yaml,$PWD/k8s/test/solidity-runner-deployment.yaml,$PWD/k8s/test/wasi-service-deployment.yaml
kubectl delete -f $PWD/k8s/test/eth-deployment.yaml,$PWD/k8s/test/eth-service.yaml
kubectl delete -f $PWD/k8s/test/orchestrator-deployment.yaml
kubectl delete -f $PWD/k8s/test/api-service.yaml
kubectl delete -f $PWD/k8s/test/nexus-deployment.yaml