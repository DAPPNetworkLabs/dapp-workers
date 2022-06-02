minikube mount /home/ubuntu/environment/dapp-workers:/dapp-workers
sudo docker build -t natpdev/nexus . ; sudo docker push natpdev/nexus
sudo docker build -t natpdev/orchestrator . ; sudo docker push natpdev/orchestrator