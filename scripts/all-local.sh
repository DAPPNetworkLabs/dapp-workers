SCRIPT_DIR="$( dirname $0 )"

docker volume rm dapp-workers_pg-data
docker-compose down -v
docker stop $(docker container ls -q -a)
docker rm $(docker container ls -q -a) -v
docker volume rm $(docker volume ls -q)
$SCRIPT_DIR/deploy-roots.sh
COMPOSE_PROFILES=images docker-compose -f local_compose.yaml build
$SCRIPT_DIR/run-local.sh