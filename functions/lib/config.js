"use strict";
// src/config.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    projectId: process.env.GCLOUD_PROJECT || "", // Firebase automatically sets this
    environment: process.env.ENVIRONMENT || "dev",
    region: "us-central1",
    adminEmail: process.env.ADMIN_EMAIL || "",
    resourceDefaults: {
        cloudRun: {
            containerImage: `us-central1-docker.pkg.dev/${process.env.GCLOUD_PROJECT}/vmhub-api/vmhub-sync:latest`,
            cpu: "1000m",
            memory: "512Mi",
            timeoutSeconds: 600,
            maxRetries: 3,
        },
        scheduler: {
            schedule: "0 5 * * *", // Runs at 5:00 AM every day
            timezone: "America/Sao_Paulo",
            retryCount: 3,
            maxRetryDuration: "30s",
        },
        campaignScheduler: {
            schedule: "30 6 * * *", // Runs at 6:30 AM every day
            timezone: "America/Sao_Paulo",
            retryCount: 3,
            maxRetryDuration: "30s",
        },
        storage: {
            location: "US-CENTRAL1",
            retentionDays: 30,
        },
        bigquery: {
            location: "US-CENTRAL1",
            defaultRoles: {
                admin: "OWNER",
                user: "READER",
            },
        },
    },
};
//# sourceMappingURL=config.js.map