for file in $PWD/k8s/test/* ; do
    kubectl delete -f $file
done

for file in $PWD/k8s/test/images/* ; do
    kubectl delete -f $file
done

minikube stop
minikube delete