# eval $(minikube docker-env)
docker build -t natpdev/nexus ./nexus
docker push natpdev/nexus
docker build -t natpdev/orchestrator ./services/orchestrator
docker push natpdev/orchestrator
docker build -t natpdev/api ./services/api
docker push natpdev/api