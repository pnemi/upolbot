#!/bin/sh
# wait-for-postgres.sh

set -e

host="$1"
port="$2"
shift 2
cmd="$@"

until nc -z "$host" "$port"; do
  >&2 echo "Waiting for Postgres"
  sleep 1
done

>&2 echo "Postgres is up"
exec $cmd