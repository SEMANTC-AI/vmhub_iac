// src/infrastructure.ts

import { JobsClient } from "@google-cloud/run/build/src/v2";
import { CloudSchedulerClient } from "@google-cloud/scheduler";
import { InfrastructureError } from "./types";
import { config } from "./config";

/**
 * Provisioner class for handling GCP infrastructure setup
 */
export class InfrastructureProvisioner {
  private projectId: string;
  private environment: string;
  private cloudRun: JobsClient;
  private scheduler: CloudSchedulerClient;

  /**
   * Initialize the infrastructure provisioner
   */
  constructor() {
    this.projectId = config.projectId;
    this.environment = config.environment;
    this.cloudRun = new JobsClient();
    this.scheduler = new CloudSchedulerClient();
  }

  /**
   * Creates a Cloud Run job for data synchronization
   * @param {string} cnpj - Company identifier
   * @returns {Promise<void>}
   */
  async createCloudRunJob(cnpj: string): Promise<void> {
    const name = `vmhub-sync-${cnpj}`;
    const parent = `projects/${this.projectId}/locations/${config.region}`;

    try {
      const job = {
        parent,
        job: {
          name: `${parent}/jobs/${name}`,
          labels: {
            environment: this.environment,
            cnpj: cnpj,
          },
          template: {
            taskCount: 1,
            template: {
              containers: [{
                image: config.resourceDefaults.cloudRun.containerImage,
                env: [
                  { name: "CNPJ", value: cnpj },
                  { name: "ENVIRONMENT", value: this.environment },
                  { name: "PROJECT_ID", value: this.projectId },
                ],
                resources: {
                  limits: {
                    cpu: config.resourceDefaults.cloudRun.cpu,
                    memory: config.resourceDefaults.cloudRun.memory,
                  },
                },
              }],
            },
          },
        },
      };

      const [operation] = await this.cloudRun.createJob(job);
      const [response] = await operation.promise();

      console.log(`Cloud Run job ${name} created successfully:`, response);
    } catch (error) {
      console.error(`error creating Cloud Run job ${name}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Creates a Cloud Scheduler job for periodic sync
   * @param {string} cnpj - Company identifier
   * @returns {Promise<void>}
   */
  async createScheduler(cnpj: string): Promise<void> {
    const name = `vmhub-sync-schedule-${cnpj}`;
    const parent = `projects/${this.projectId}/locations/${config.region}`;
    const jobName = `vmhub-sync-${cnpj}`;
    
    const baseUri = `https://${config.region}-run.googleapis.com`;
    const apiPath = `apis/run.googleapis.com/v1/namespaces/${this.projectId}/jobs`;
    const runUri = `${baseUri}/${apiPath}/${jobName}:run`;

    try {
      const jobRequest = {
        parent,
        job: {
          name: `${parent}/jobs/${name}`,
          schedule: config.resourceDefaults.scheduler.schedule,
          timeZone: config.resourceDefaults.scheduler.timezone,
          httpTarget: {
            uri: runUri,
            httpMethod: "POST" as const,
            headers: {
              "User-Agent": "Google-Cloud-Scheduler",
            },
          },
          retryConfig: {
            retryCount: config.resourceDefaults.scheduler.retryCount,
            maxRetryDuration: {
              seconds: parseInt(config.resourceDefaults.scheduler.maxRetryDuration),
            },
          },
        },
      };

      await this.scheduler.createJob(jobRequest);
      console.log(`Cloud Scheduler job ${name} created successfully`);
    } catch (error) {
      console.error(`error creating Cloud Scheduler job ${name}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Provisions Cloud Run and Scheduler jobs
   * @param {string} cnpj - Company identifier
   * @returns {Promise<boolean>} Success status of the provisioning
   */
  async provision(cnpj: string): Promise<boolean> {
    console.log(`starting provisioning for CNPJ ${cnpj}`);
    try {
      await this.createCloudRunJob(cnpj);
      await this.createScheduler(cnpj);
      console.log(`completed provisioning for CNPJ ${cnpj}`);
      return true;
    } catch (error) {
      console.error(`failed to provision infrastructure for CNPJ ${cnpj}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Handles error transformation
   * @param {unknown} error - Raw error to be processed
   * @returns {InfrastructureError} Standardized error format
   */
  private handleError(error: unknown): InfrastructureError {
    if (error instanceof Error) {
      return {
        ...error,
        code: error.name,
        details: error.message,
      };
    }
    return new Error("unknown error occurred");
  }
}
