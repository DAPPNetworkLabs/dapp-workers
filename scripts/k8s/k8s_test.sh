docker image prune -f

minikube start --memory='8000MB' --mount --mount-string='/:/k8s' --cpus='4'

envsubst < ./k8s/test/ipfs.yaml | sudo kubectl apply -f -

minikube tunnel > /dev/null 2>&1 &

sleep 10

export IPFS_HOST=$(kubectl get services ipfs -o jsonpath="{.spec.clusterIP}")

$PWD/scripts/k8s/build_deploy.sh

$PWD/scripts/deploy-roots.sh

for file in $PWD/k8s/test/* ; do
    envsubst < $file | sudo kubectl apply -f -
done

sleep 140

$PWD/scripts/k8s/logs.sh
