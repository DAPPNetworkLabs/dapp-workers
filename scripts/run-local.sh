docker stop $(docker container ls -q -a)
docker rm $(docker container ls -q -a)
docker-compose -f local_compose.yaml up --build