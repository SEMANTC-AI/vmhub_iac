// terraform/functions/src/config.js

const config = {
    projectId: process.env.PROJECT_ID,
    environment: process.env.ENVIRONMENT || 'dev',
    region: 'us-central1',
    resourceDefaults: {
        cloudRun: {
            containerImage: `us-central1-docker.pkg.dev/${process.env.PROJECT_ID}/vmhub-api/vmhub-sync:latest`,
            cpu: '1000m',
            memory: '512Mi',
            timeoutSeconds: 600,
            maxRetries: 3
        },
        scheduler: {
            schedule: '0 */4 * * *',
            timezone: 'America/Sao_Paulo',
            retryCount: 3,
            maxRetryDuration: '30s'
        },
        storage: {
            location: 'US-CENTRAL1',
            retentionDays: 30
        }
    }
};

module.exports = config;