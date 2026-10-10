"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const api_1 = require("@opentelemetry/api");
// Optional diagnostic logging if OTEL_DIAG_LOGS is enabled
if (process.env.OTEL_DIAG_LOGS === 'true') {
    api_1.diag.setLogger(new api_1.DiagConsoleLogger(), api_1.DiagLogLevel.INFO);
}
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, '')}/v1/traces`
    : 'http://alloy:4318/v1/traces';
// Check if tracing is enabled (defaults to true in production or if OTEL endpoint configured)
const isTracingEnabled = process.env.ENABLE_TRACING !== 'false';
let sdk = null;
if (isTracingEnabled) {
    try {
        const traceExporter = new exporter_trace_otlp_http_1.OTLPTraceExporter({
            url: otlpEndpoint,
            headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
                ? Object.fromEntries(process.env.OTEL_EXPORTER_OTLP_HEADERS.split(',').map((kv) => kv.split('=')))
                : {},
        });
        sdk = new sdk_node_1.NodeSDK({
            serviceName: process.env.OTEL_SERVICE_NAME || 'lvms-api',
            traceExporter,
            instrumentations: [
                (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)({
                    // Disable filesystem instrumentation to avoid heavy trace overhead on every read/write
                    '@opentelemetry/instrumentation-fs': { enabled: false },
                    '@opentelemetry/instrumentation-express': { enabled: true },
                    '@opentelemetry/instrumentation-http': { enabled: true },
                }),
            ],
        });
        sdk.start();
        console.log(`📡 OpenTelemetry initialized for lvms-api -> exporting traces to ${otlpEndpoint}`);
        // Graceful shutdown
        const shutdownHandler = async () => {
            try {
                if (sdk) {
                    await sdk.shutdown();
                    console.log('📡 OpenTelemetry SDK terminated successfully');
                }
            }
            catch (err) {
                console.error('Error shutting down OpenTelemetry SDK', err);
            }
        };
        process.on('SIGTERM', shutdownHandler);
        process.on('SIGINT', shutdownHandler);
    }
    catch (error) {
        console.warn('⚠️ Failed to initialize OpenTelemetry SDK (continuing without tracing):', error);
    }
}
exports.default = sdk;
