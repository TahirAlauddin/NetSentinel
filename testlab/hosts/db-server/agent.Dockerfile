FROM zabbix/zabbix-agent2:alpine-7.4-latest

USER root
RUN apk update && apk add --no-cache postgresql16-client

COPY zabbix_agent.conf /etc/zabbix/zabbix_agent2.conf
COPY check_connections.sh /usr/local/bin/check_connections.sh
RUN chmod +x /usr/local/bin/check_connections.sh

USER zabbix
