// tracing.js

'use strict'

const process = require('process');
const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');

const traceExporter = new OTLPTraceExporter({
    url: "https://ingest.lightstep.com/traces/otlp/v0.9", // US data center
    // url: "https://ingest.eu.lightstep.com/traces/otlp/v0.9", // EU data center
    headers: {
        "lightstep-access-token": process.env.LIGHTSTEP_ACCESS_TOKEN,
    }
});
const sdk = new opentelemetry.NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'train-service',
  }),
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()]
});

// initialize the SDK and register with the OpenTelemetry API
// this enables the API to record telemetry
// console.log(sdk)
try {
    sdk.start();
    console.log("Tracing Initialized.")
} catch (error) {
    console.error('Failed to start SDK', error);
}

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
