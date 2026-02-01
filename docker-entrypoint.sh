#!/bin/sh
set -e

# Write runtime config from environment (e.g. Kubernetes Secret) so the SPA can read it.
CONFIG_FILE="/usr/share/nginx/html/config.json"
if [ -n "$APPLICATIONINSIGHTS_CONNECTION_STRING" ]; then
  escaped=$(echo "$APPLICATIONINSIGHTS_CONNECTION_STRING" | sed 's/\\/\\\\/g; s/"/\\"/g')
  printf '{"applicationInsightsConnectionString":"%s"}\n' "$escaped" > "$CONFIG_FILE"
else
  echo '{}' > "$CONFIG_FILE"
fi

exec "$@"
