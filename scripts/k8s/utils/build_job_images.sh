eval $(minikube docker-env)
read -p 'Push boxes to docker hub? t/f: ' push_docker_hub
for file in $PWD/images/* ; do
    f="$(basename -- $file)"
    echo $f
    docker build --no-cache -t natpdev/$f ./images/$f > /dev/null
    if test "$push_docker_hub" = "t"
        then docker push natpdev/$f | grep digest
    fi
done

docker build --no-cache -t natpdev/rust-compiler ./images/compiler/rust > /dev/null
docker build --no-cache -t natpdev/wasienv-compiler ./images/compiler/wasienv > /dev/null
if test "$push_docker_hub" = "t"
    then echo "rust-compiler"; docker push natpdev/rust-compiler | grep digest; echo "wasienv-compiler"; docker push natpdev/wasienv-compiler | grep digest
fi