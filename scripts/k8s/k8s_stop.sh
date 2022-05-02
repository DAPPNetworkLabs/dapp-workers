kubectl delete -f ipfs-data-persistentvolumeclaim.yaml,ipfs0-deployment.yaml,ipfs0-service.yaml
kubectl delete -f postgres-deployment.yaml,postgres-service.yaml
kubectl delete -f eth-deployment.yaml,eth-service.yaml
kubectl delete -f orchestrator-deployment.yaml
kubectl delete -f nexus-deployment.yaml