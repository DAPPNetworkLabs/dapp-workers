docker stop $(docker container ls -q -a)
docker rm $(docker container ls -q -a)
docker-compose -f compose.yaml up --build