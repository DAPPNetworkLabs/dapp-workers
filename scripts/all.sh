SCRIPT_DIR="$( dirname $0 )"

docker-compose down -v
docker volume rm $(docker volume ls -q)
docker stop $(docker container ls -q -a)
docker rm $(docker container ls -q -a) -v
$SCRIPT_DIR/deploy-roots.sh
$SCRIPT_DIR/build-dockers.sh
$SCRIPT_DIR/run-local.sh