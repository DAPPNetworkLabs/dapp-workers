SCRIPT_DIR="$( dirname $0 )"

docker image prune
docker volume rm dapp-workers_pg-data
docker-compose down -v
docker stop $(docker container ls -q -a)
docker rm $(docker container ls -q -a) -v
docker volume rm $(docker volume ls -q)
$SCRIPT_DIR/deploy-roots.sh
$SCRIPT_DIR/run-production.sh