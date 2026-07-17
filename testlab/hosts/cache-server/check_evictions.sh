#!/bin/sh
# Prints Redis's cumulative evicted_keys counter from INFO stats.
# Run by the Zabbix agent (system.run[]) directly against the co-located Redis.
redis-cli INFO stats | grep '^evicted_keys:' | cut -d: -f2 | tr -d '\r'
