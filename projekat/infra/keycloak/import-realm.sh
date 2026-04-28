#!/bin/bash
set -e

mkdir -p /opt/keycloak/data/import
envsubst < /opt/keycloak/temp/realm-template.json > /opt/keycloak/data/import/realm.json
exec /opt/keycloak/bin/kc.sh start-dev --import-realm