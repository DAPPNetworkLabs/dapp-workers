#! /bin/bash
read -p 'Which version to run? (local, test, ropsten, production): ' option

$PWD/scripts/k8s/k8s_stop.sh

docker image prune -f

minikube start --memory='8000MB' --mount --mount-string='/:/k8s' --cpus='4'

envsubst < ./k8s/$option/ipfs.yaml | sudo kubectl apply -f -

minikube tunnel > /dev/null 2>&1 &

sleep 10

export IPFS_HOST=$(kubectl get services ipfs -o jsonpath="{.spec.clusterIP}")

$PWD/scripts/k8s/utils/build_deploy.sh
$PWD/scripts/k8s/deploy-roots.sh

for file in $PWD/k8s/$option/* ; do
    envsubst < $file | sudo kubectl apply -f -
done

sleep 140

$PWD/scripts/k8s/logs.sh
