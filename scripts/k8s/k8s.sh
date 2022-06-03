$PWD/scripts/deploy-roots.sh 
for file in $PWD/k8s/test/* ; do
    kubectl apply -f $file
done

for file in $PWD/k8s/test/images/* ; do
    kubectl apply -f $file
done
