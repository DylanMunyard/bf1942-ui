# Application Insights Integration

Azure Application Insights is integrated for client-side telemetry (page views, errors, custom events). The connection string is supplied at **runtime** in production so it can be stored in a Kubernetes Secret.

## Behaviour

- **Development**: Connection string comes from **`VITE_APPLICATIONINSIGHTS_CONNECTION_STRING`** in `.env.development`. The variable name must start with `VITE_` so Vite exposes it to the client. Restart the dev server (`npm run dev`) after changing `.env.development`. The app also tries to load `/config.json`; if missing (as in dev), it uses the env value.
- **Production (container)**: The container entrypoint writes `/config.json` from the `APPLICATIONINSIGHTS_CONNECTION_STRING` environment variable (injected from a Kubernetes Secret). The SPA fetches `/config.json` on load and initializes Application Insights from it.

## Development troubleshooting

- **No telemetry in Azure**: In the browser console you should see `[Application Insights] Initializing from env (VITE_APPLICATIONINSIGHTS_CONNECTION_STRING)` when the connection string is loaded. If you see the "No connection string" warning instead, ensure:
  1. The variable in `.env.development` is exactly **`VITE_APPLICATIONINSIGHTS_CONNECTION_STRING`** (not `APPLICATIONINSIGHTS_CONNECTION_STRING`).
  2. You restarted the dev server after editing `.env.development`.
- Telemetry is batched; the app flushes after 2 seconds in dev so the first page view appears in the portal within a few seconds. You can also close the tab to trigger an immediate flush.

## Deployment: Secret

The deployment expects a Secret named `bfstats-ui-secrets` in namespace `bfstats-ui` with at least:

- `APPLICATIONINSIGHTS_CONNECTION_STRING`: Azure Application Insights connection string (e.g. from the resource’s “Connection string” in the portal).

Create or update the secret:

```bash
kubectl create secret generic bfstats-ui-secrets \
  --from-literal=APPLICATIONINSIGHTS_CONNECTION_STRING='InstrumentationKey=xxx;IngestionEndpoint=https://...' \
  --namespace bfstats-ui --dry-run=client -o yaml | kubectl apply -f -
```

Or apply the Secret manifest in `deploy/app/deployment.yaml` and set `stringData.APPLICATIONINSIGHTS_CONNECTION_STRING` to your connection string (plain text; Kubernetes will store it encoded).

## Files

- **App**: `src/config/runtimeConfig.ts` (loads `/config.json`), `src/main.ts` (async bootstrap using runtime config or `import.meta.env`), `src/services/appInsightsService.ts` (Application Insights SDK wrapper).
- **Container**: `docker-entrypoint.sh` writes `/usr/share/nginx/html/config.json` from env before starting nginx; Dockerfile uses this script as `ENTRYPOINT`.
- **Kubernetes**: `deploy/app/deployment.yaml` defines the Secret (optional placeholder) and the Deployment uses `envFrom: secretRef: name: bfstats-ui-secrets` so the connection string is available as `APPLICATIONINSIGHTS_CONNECTION_STRING` in the container.
