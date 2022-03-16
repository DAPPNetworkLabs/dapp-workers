docker stop $(docker container ls -q -a)
docker rm $(docker container ls -q -a)
docker-compose -f test_compose.yaml up