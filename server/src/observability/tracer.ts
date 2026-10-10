import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// Optional diagnostic logging if OTEL_DIAG_LOGS is enabled
if (process.env.OTEL_DIAG_LOGS === 'true') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
}

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, '')}/v1/traces`
  : 'http://alloy:4318/v1/traces';

// Check if tracing is enabled (defaults to true in production or if OTEL endpoint configured)
const isTracingEnabled = process.env.ENABLE_TRACING !== 'false';

let sdk: NodeSDK | null = null;

if (isTracingEnabled) {
  try {
    const traceExporter = new OTLPTraceExporter({
      url: otlpEndpoint,
      headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
        ? Object.fromEntries(
            process.env.OTEL_EXPORTER_OTLP_HEADERS.split(',').map((kv) => kv.split('='))
          )
        : {},
    });

    sdk = new NodeSDK({
      serviceName: process.env.OTEL_SERVICE_NAME || 'lvms-api',
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
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
      } catch (err) {
        console.error('Error shutting down OpenTelemetry SDK', err);
      }
    };

    process.on('SIGTERM', shutdownHandler);
    process.on('SIGINT', shutdownHandler);
  } catch (error) {
    console.warn('⚠️ Failed to initialize OpenTelemetry SDK (continuing without tracing):', error);
  }
}

export default sdk;
