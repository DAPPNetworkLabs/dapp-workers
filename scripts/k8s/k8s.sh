$PWD/scripts/deploy-roots.sh 
kubectl apply -f $PWD/k8s/test/ipfs.yaml
kubectl apply -f $PWD/k8s/test/postgres.yaml
kubectl apply -f $PWD/k8s/test/eth.yaml
kubectl apply -f $PWD/k8s/test/orchestrator.yaml
kubectl apply -f $PWD/k8s/test/api.yaml
kubectl apply -f $PWD/k8s/test/nexus.yaml