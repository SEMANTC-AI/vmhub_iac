"use strict";
// src/infrastructure.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfrastructureProvisioner = void 0;
const v2_1 = require("@google-cloud/run/build/src/v2");
const scheduler_1 = require("@google-cloud/scheduler");
const config_1 = require("./config");
/**
 * provisioning GCP infrastructure resources
 */
class InfrastructureProvisioner {
    /**
     * Initializes the InfrastructureProvisioner with project configuration
     */
    constructor() {
        if (!config_1.config.projectId) {
            throw new Error("Project ID is not configured");
        }
        this.projectId = config_1.config.projectId;
        this.environment = config_1.config.environment;
        const clientConfig = {
            projectId: this.projectId,
            // Include only GCP APIs you're explicitly using
            scopes: [
                "https://www.googleapis.com/auth/cloud-platform",
                "https://www.googleapis.com/auth/cloudscheduler",
            ],
        };
        this.cloudRun = new v2_1.JobsClient(clientConfig);
        this.scheduler = new scheduler_1.CloudSchedulerClient(clientConfig);
        console.log("Infrastructure Provisioner initialized with:", {
            projectId: this.projectId,
            environment: this.environment,
            region: config_1.config.region,
        });
    }
    /**
     * Creates a Cloud Run job for data synchronization
     * @param {string} cnpj - Company identifier
     * @param {string} userId - Firestore user ID
     * @return {Promise<void>}
     */
    async createCloudRunJob(cnpj, userId) {
        const name = `vmhub-sync-${cnpj}-${this.environment}`;
        const parent = `projects/${this.projectId}/locations/${config_1.config.region}`;
        const fullJobName = `${parent}/jobs/${name}`;
        try {
            console.log("Creating Cloud Run job with:", {
                name: fullJobName,
                projectId: this.projectId,
                region: config_1.config.region,
            });
            const job = {
                parent,
                jobId: name,
                job: {
                    name: fullJobName,
                    labels: {
                        environment: this.environment,
                        cnpj: cnpj,
                        managedBy: "vmhub",
                    },
                    template: {
                        taskCount: 1,
                        template: {
                            containers: [{
                                    image: config_1.config.resourceDefaults.cloudRun.containerImage,
                                    env: [
                                        { name: "CNPJ", value: cnpj },
                                        { name: "ENVIRONMENT", value: this.environment },
                                        { name: "PROJECT_ID", value: this.projectId },
                                        { name: "USER_ID", value: userId },
                                    ],
                                    resources: {
                                        limits: {
                                            cpu: config_1.config.resourceDefaults.cloudRun.cpu,
                                            memory: config_1.config.resourceDefaults.cloudRun.memory,
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
        }
        catch (error) {
            console.error(`Error creating Cloud Run job ${name}:`, error);
            throw this.handleError(error);
        }
    }
    /**
     * Creates a Cloud Scheduler job to run the Cloud Run job periodically
     * @param {string} cnpj - Company identifier
     * @return {Promise<void>}
     */
    async createScheduler(cnpj) {
        const name = `vmhub-sync-schedule-${cnpj}-${this.environment}`;
        const parent = `projects/${this.projectId}/locations/${config_1.config.region}`;
        const jobName = `vmhub-sync-${cnpj}-${this.environment}`;
        const fullJobName = `${parent}/jobs/${name}`;
        const baseUri = `https://${config_1.config.region}-run.googleapis.com`;
        const apiPath = `apis/run.googleapis.com/v1/namespaces/${this.projectId}/jobs`;
        const runUri = `${baseUri}/${apiPath}/${jobName}:run`;
        try {
            console.log("Creating Cloud Scheduler job with:", {
                name: fullJobName,
                uri: runUri,
                projectId: this.projectId,
                region: config_1.config.region,
            });
            const jobRequest = {
                parent,
                job: {
                    name: fullJobName,
                    schedule: config_1.config.resourceDefaults.scheduler.schedule,
                    timeZone: config_1.config.resourceDefaults.scheduler.timezone,
                    httpTarget: {
                        uri: runUri,
                        httpMethod: "POST",
                        headers: {
                            "User-Agent": "Google-Cloud-Scheduler",
                        },
                    },
                    retryConfig: {
                        retryCount: config_1.config.resourceDefaults.scheduler.retryCount,
                        maxRetryDuration: {
                            seconds: parseInt(config_1.config.resourceDefaults.scheduler.maxRetryDuration),
                        },
                    },
                },
            };
            const [response] = await this.scheduler.createJob(jobRequest);
            console.log(`Cloud Scheduler job ${name} created successfully:`, response);
        }
        catch (error) {
            console.error(`Error creating Cloud Scheduler job ${name}:`, error);
            throw this.handleError(error);
        }
    }
    /**
     * Provisions Cloud Run and Scheduler jobs
     * @param {string} cnpj - Company identifier
     * @param {string} userId - Firestore user ID
     * @return {Promise<boolean>} Whether the provisioning succeeded
     */
    async provision(cnpj, userId) {
        console.log(`Starting provisioning for CNPJ ${cnpj} (User: ${userId})`);
        try {
            await this.createCloudRunJob(cnpj, userId);
            await this.createScheduler(cnpj);
            console.log(`Completed provisioning for CNPJ ${cnpj}`);
            return true;
        }
        catch (error) {
            console.error(`Failed to provision infrastructure for CNPJ ${cnpj}:`, error);
            throw this.handleError(error);
        }
    }
    /**
     * Handles errors and returns a standardized InfrastructureError
     * @param {unknown} error - The original error
     * @return {InfrastructureError} A standardized error object
     */
    handleError(error) {
        if (error instanceof Error) {
            const gcloudError = error;
            return Object.assign(Object.assign({}, error), { code: gcloudError.code || error.name, details: gcloudError.details || error.message });
        }
        return new Error("unknown error occurred");
    }
}
exports.InfrastructureProvisioner = InfrastructureProvisioner;
//# sourceMappingURL=infrastructure.js.map