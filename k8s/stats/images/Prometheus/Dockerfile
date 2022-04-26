FROM centos:latest

COPY prometheus-2.35.0.linux-amd64.tar.gz  /

RUN tar -xvzf /prometheus-2.35.0.linux-amd64.tar.gz

EXPOSE 9090


CMD prometheus-2.35.0.linux-amd64/./prometheus  --config.file=prometheus-2.35.0.linux-amd64/prometheus.yml