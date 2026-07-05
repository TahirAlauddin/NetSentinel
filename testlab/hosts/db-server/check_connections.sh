#!/bin/sh
# Prints the current connection count to the appdb database.
# Run by the Zabbix agent (system.run[]) against db-server over the network.
psql -h db-server -U postgres -d appdb -tAc \
    "SELECT count(*) FROM pg_stat_activity WHERE datname = 'appdb';" \
    | tr -d '[:space:]'
