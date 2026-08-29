#!/bin/sh
set -eu

service=${1:?service name is required}

if [ "${NODE_ENV:-development}" != "development" ] && [ "${NODE_ENV:-development}" != "production" ]; then
  echo "NODE_ENV must be development or production" >&2
  exit 1
fi

case "${service}" in
  api)
    if [ "${NODE_ENV:-development}" = "production" ]; then
      if [ "${API_SESSION_SECRET_EXTERNAL:-}" != "true" ] || [ -z "${API_SESSION_SECRET:-}" ]; then
        echo "API_SESSION_SECRET must be explicitly configured in production" >&2
        exit 1
      fi
      pnpm --filter @school-erp/database db:generate
      pnpm --filter @school-erp/domain build
      pnpm --filter @school-erp/application build
      pnpm --filter @school-erp/database build
      pnpm --filter @school-erp/api build
      exec pnpm --filter @school-erp/api start
    fi

    pnpm --filter @school-erp/database db:generate
    pnpm --filter @school-erp/domain build
    pnpm --filter @school-erp/application build
    pnpm --filter @school-erp/database build
    exec pnpm --filter @school-erp/api dev
    ;;
  web)
    if [ "${NODE_ENV:-development}" = "production" ]; then
      if [ "${API_SESSION_TOKEN_EXTERNAL:-}" != "true" ] || [ -z "${API_SESSION_TOKEN:-}" ]; then
        echo "API_SESSION_TOKEN must be explicitly configured in production" >&2
        exit 1
      fi
      pnpm --filter @school-erp/web build
      exec pnpm --filter @school-erp/web start
    fi

    API_SESSION_TOKEN=$(node scripts/create-local-session.mjs)
    export API_SESSION_TOKEN
    [ -n "${API_SESSION_TOKEN}" ]
    exec pnpm --filter @school-erp/web dev
    ;;
  *)
    echo "Unsupported service: ${service}" >&2
    exit 1
    ;;
esac
