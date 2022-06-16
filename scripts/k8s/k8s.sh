docker image prune -f

minikube start --memory='5000MB' --mount --mount-string='/:/k8s' --cpus='4'

$PWD/scripts/k8s/build_deploy.sh

$PWD/scripts/deploy-roots.sh 

kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

for file in $PWD/k8s/test/* ; do
    envsubst < $file | kubectl apply -f -
done

sleep 140

$PWD/scripts/k8s/logs.sh