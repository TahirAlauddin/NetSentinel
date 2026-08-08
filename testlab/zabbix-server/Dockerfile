FROM zabbix/zabbix-server-pgsql:alpine-7.4-latest

# Remediation scripts (playbook.py) run `docker restart/exec ...` on this
# container via script.execute against the mounted /var/run/docker.sock.
# The base image doesn't ship the docker CLI, so add it here.
USER root
RUN apk add --no-cache docker-cli
