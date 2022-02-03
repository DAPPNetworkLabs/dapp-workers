docker stop $(docker container ls -q -a)
docker rm $(docker container ls -q -a)
COMPOSE_PROFILES=debug docker-compose -f compose.yaml up --build