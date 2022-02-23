SCRIPT_DIR="$( dirname $0 )"

docker volume rm dapp-workers_pg-data
docker-compose down -v
docker stop $(docker container ls -q -a)
docker rm $(docker container ls -q -a) -v
docker volume rm $(docker volume ls -q)
$SCRIPT_DIR/deploy-roots.sh
$SCRIPT_DIR/build-dockers.sh
$SCRIPT_DIR/run-local.sh