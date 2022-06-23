eval $(minikube docker-env)
read -p 'Push boxes to docker hub? t/f: ' push_docker_hub
for file in $PWD/images/* ; do
    echo $file
    f="$(basename -- $file)"
    echo $f
    docker build -t natpdev/$f ./images/$f
    if test "$push_docker_hub" = "t"
        then docker push natpdev/$f
    fi
done

docker build -t natpdev/rust-compiler ./images/compiler/rust
docker build -t natpdev/wasienv-compiler ./images/compiler/wasienv
if test "$push_docker_hub" = "t"
    then docker push natpdev/rust-compiler; docker push natpdev/wasienv-compiler
fi