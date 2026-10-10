# LVMS Observability & Monitoring Platform

This directory provides the complete, production-grade observability configuration for the **Loan Verification Management System (LVMS)**.

## Architecture

```
[ Browser / Field Agents / Admin ]
               │
               ▼ (Web Vitals, Errors, Pageviews, Faro SDK)
       [ Nginx Reverse Proxy ]
               │
       ┌───────┴───────┐
       ▼               ▼
[ Next.js Frontend ]  [ Express API (prom-client, OTel, Pino) ]
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
          [ PostgreSQL ]    [ Redis ]   [ Grafana Alloy ]
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
             [ Grafana Cloud ]                               [ Local Docker Stack ]
      (Metrics, Loki, Tempo, Alerts)                   (Prometheus, Grafana, Exporters)
```

## Directory Structure

```
observability/
├── alloy/
│   └── config.alloy        # Grafana Alloy pipeline for traces, metrics, and Docker logs
├── alerts/
│   └── rules.yml           # Prometheus & Grafana alerting rules (SLOs, latency, saturation)
├── runbooks/
│   └── alert_runbooks.md   # Step-by-step incident response procedures
├── dashboards/             # Grafana production dashboards (v9+ schema)
│   ├── 1_infrastructure_health.json
│   ├── 2_api_performance.json
│   ├── 3_page_usage_experience.json
│   ├── 4_db_and_redis.json
│   ├── 5_business_workflows.json
│   └── 6_traces_and_dependencies.json
└── README.md
```

## Environment Configuration

Store these credentials in `.env` on your VPS (never commit secret values):

```env
# --- Grafana Cloud Telemetry Export (Optional / Production) ---
GRAFANA_CLOUD_OTLP_ENDPOINT=https://otlp-gateway-prod-us-east-0.grafana.net/otlp
GRAFANA_CLOUD_OTLP_AUTH_HEADER="Basic <base64-encoded-user-and-token>"
GRAFANA_CLOUD_PROMETHEUS_REMOTE_WRITE_URL=https://prometheus-prod-01-eu-west-0.grafana.net/api/prom/push
GRAFANA_CLOUD_PROMETHEUS_USERNAME=123456
GRAFANA_CLOUD_PROMETHEUS_API_KEY=glc_...
GRAFANA_CLOUD_LOKI_URL=https://logs-prod3.grafana.net/loki/api/v1/push
GRAFANA_CLOUD_LOKI_USERNAME=123456
GRAFANA_CLOUD_LOKI_API_KEY=glc_...

# --- OpenTelemetry Node.js Settings ---
OTEL_SERVICE_NAME=lvms-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://alloy:4318
ENABLE_TRACING=true

# --- Frontend Grafana Faro (Optional) ---
NEXT_PUBLIC_FARO_URL=https://faro-collector-prod-us-east-0.grafana.net/collect/...
NEXT_PUBLIC_FARO_APP_NAME=lvms-frontend
```

## Security & PII Redaction Guardrails

1. **Borrower Privacy Guarantee**: Aadhaar numbers, PAN cards, phone numbers, home addresses, borrower full names, and raw GPS trails are strictly redacted from structured logs (`pino`) and OpenTelemetry traces.
2. **Prometheus Cardinality Control**: All dynamic route identifiers (e.g., `/api/cases/335fd809...` or `/api/agents/42`) are strictly normalized to `/api/cases/:id` and `/api/agents/:id` before emitting metrics.
3. **Internal Network Isolation**: `/metrics`, `node_exporter` (9100), `cadvisor` (8080), `postgres-exporter` (9187), and `redis-exporter` (9121) are strictly isolated to the private Docker bridge network (`lvms-network`) and never bound to public host ports.
