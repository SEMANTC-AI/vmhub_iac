"use strict";
// src/infrastructure.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfrastructureProvisioner = void 0;
const v2_1 = require("@google-cloud/run/build/src/v2");
const scheduler_1 = require("@google-cloud/scheduler");
const config_1 = require("./config");
/**
 * Provisioner class for handling GCP infrastructure setup
 */
class InfrastructureProvisioner {
    /**
     * Initialize the infrastructure provisioner
     */
    constructor() {
        this.projectId = config_1.config.projectId;
        this.environment = config_1.config.environment;
        this.cloudRun = new v2_1.JobsClient();
        this.scheduler = new scheduler_1.CloudSchedulerClient();
    }
    /**
     * Creates a Cloud Run job for data synchronization
     * @param {string} cnpj - Company identifier
     * @return {Promise<void>}
     */
    async createCloudRunJob(cnpj) {
        const name = `vmhub-sync-${cnpj}`;
        const parent = `projects/${this.projectId}/locations/${config_1.config.region}`;
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
                                    image: config_1.config.resourceDefaults.cloudRun.containerImage,
                                    env: [
                                        { name: "CNPJ", value: cnpj },
                                        { name: "ENVIRONMENT", value: this.environment },
                                        { name: "PROJECT_ID", value: this.projectId },
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
            console.error(`error creating Cloud Run job ${name}:`, error);
            throw this.handleError(error);
        }
    }
    /**
     * Creates a Cloud Scheduler job for periodic sync
     * @param {string} cnpj - Company identifier
     * @return {Promise<void>}
     */
    async createScheduler(cnpj) {
        const name = `vmhub-sync-schedule-${cnpj}`;
        const parent = `projects/${this.projectId}/locations/${config_1.config.region}`;
        const jobName = `vmhub-sync-${cnpj}`;
        const baseUri = `https://${config_1.config.region}-run.googleapis.com`;
        const apiPath = `apis/run.googleapis.com/v1/namespaces/${this.projectId}/jobs`;
        const runUri = `${baseUri}/${apiPath}/${jobName}:run`;
        try {
            const jobRequest = {
                parent,
                job: {
                    name: `${parent}/jobs/${name}`,
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
            await this.scheduler.createJob(jobRequest);
            console.log(`Cloud Scheduler job ${name} created successfully`);
        }
        catch (error) {
            console.error(`error creating Cloud Scheduler job ${name}:`, error);
            throw this.handleError(error);
        }
    }
    /**
     * Provisions Cloud Run and Scheduler jobs
     * @param {string} cnpj - Company identifier
     * @return {Promise<boolean>} Success status of the provisioning
     */
    async provision(cnpj) {
        console.log(`starting provisioning for CNPJ ${cnpj}`);
        try {
            await this.createCloudRunJob(cnpj);
            await this.createScheduler(cnpj);
            console.log(`completed provisioning for CNPJ ${cnpj}`);
            return true;
        }
        catch (error) {
            console.error(`failed to provision infrastructure for CNPJ ${cnpj}:`, error);
            throw this.handleError(error);
        }
    }
    /**
     * Handles error transformation
     * @param {unknown} error - Raw error to be processed
     * @return {InfrastructureError} Standardized error format
     */
    handleError(error) {
        if (error instanceof Error) {
            return Object.assign(Object.assign({}, error), { code: error.name, details: error.message });
        }
        return new Error("unknown error occurred");
    }
}
exports.InfrastructureProvisioner = InfrastructureProvisioner;
//# sourceMappingURL=infrastructure.js.map