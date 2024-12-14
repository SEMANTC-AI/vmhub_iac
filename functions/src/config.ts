// src/config.ts

import { ConfigType } from "./types";

export const config: ConfigType = {
  projectId: process.env.PROJECT_ID || "",
  environment: process.env.ENVIRONMENT || "dev",
  region: "us-central1",
  adminEmail: process.env.ADMIN_EMAIL || "",
  resourceDefaults: {
    cloudRun: {
      containerImage: `us-central1-docker.pkg.dev/${process.env.PROJECT_ID}/vmhub-api/vmhub-sync:latest`,
      cpu: "1000m",
      memory: "512Mi",
      timeoutSeconds: 600,
      maxRetries: 3,
    },
    scheduler: {
      schedule: "0 */4 * * *",
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
