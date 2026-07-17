# Debian + real systemd as PID 1 — see hosts/app-server/Dockerfile for why.
# redis-server and the Zabbix agent both run as systemd services in this one
# OS instance, so `systemctl restart redis-server` works directly, no docker exec.
FROM debian:12-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
        systemd systemd-sysv redis-server curl gnupg ca-certificates \
    && curl -fsSL -o /tmp/zabbix-release.deb \
        https://repo.zabbix.com/zabbix/7.4/release/debian/pool/main/z/zabbix-release/zabbix-release_latest_7.4+debian12_all.deb \
    && dpkg -i /tmp/zabbix-release.deb \
    && apt-get update && apt-get install -y --no-install-recommends zabbix-agent2 \
    && apt-get purge -y curl gnupg && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/* /tmp/zabbix-release.deb \
    && systemctl mask systemd-udevd.service systemd-udevd-kernel.socket \
        systemd-udevd-control.socket getty.target systemd-remount-fs.service \
        dev-hugepages.mount sys-fs-fuse-connections.mount systemd-random-seed.service \
        systemd-journal-flush.service \
    && mkdir -p /etc/systemd/system/zabbix-agent2.service.d \
    && printf '[Service]\nUser=root\nGroup=root\n' \
        > /etc/systemd/system/zabbix-agent2.service.d/override.conf
    # zabbix-agent2's packaged unit runs as the unprivileged "zabbix" user, which
    # can't get polkit authorization to call systemctl on system units (no
    # dbus/policykit installed here) — remediation commands need root to reach
    # systemd's private socket directly. Test environment only.

COPY redis.conf /etc/redis/redis.conf
COPY redis-server.service /etc/systemd/system/redis-server.service
COPY zabbix_agent.conf /etc/zabbix/zabbix_agent2.conf
RUN systemctl enable redis-server.service zabbix-agent2.service

STOPSIGNAL SIGRTMIN+3
CMD ["/lib/systemd/systemd"]
