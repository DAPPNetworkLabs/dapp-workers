docker image prune -f

minikube start --memory='8000MB' --mount --mount-string='/:/k8s' --cpus='4'

$PWD/scripts/k8s/build_deploy.sh

$PWD/scripts/deploy-roots.sh 

sudo kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

for file in $PWD/k8s/ropsten/* ; do
    envsubst < $file | sudo kubectl apply -f -
done

sleep 140

$PWD/scripts/k8s/logs.sh
