minikube start --memory='5000MB' --mount --mount-string='/:/k8s' --cpus='4'

$PWD/scripts/k8s/build_deploy.sh

$PWD/scripts/deploy-roots.sh 

for file in $PWD/k8s/test/* ; do
    envsubst < $file | kubectl apply -f -
done

sleep 150

$PWD/scripts/k8s/logs.sh