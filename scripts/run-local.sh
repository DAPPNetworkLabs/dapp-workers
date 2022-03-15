docker stop $(docker container ls -q -a)
docker rm $(docker container ls -q -a)
docker network prune -f
docker-compose -f local_compose.yaml up --build
docker build -t wasi-service ../images/wasi-service/