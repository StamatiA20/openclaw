#!/bin/sh
set -e

# Fix /data volume permissions for the non-root node user (uid 1000).
# Railway bind-mounts volumes as root, so the node user cannot write
# to /data without this ownership fix.
if [ -d /data ] && [ "$(id -u)" = "0" ]; then
  chown -R node:node /data
fi

# Drop to the node user and exec the CMD.
exec gosu node "$@"
