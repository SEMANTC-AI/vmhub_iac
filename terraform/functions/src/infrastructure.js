// terraform/functions/src/infrastructure.js

const {Storage} = require('@google-cloud/storage');
const {BigQuery} = require('@google-cloud/bigquery');
const {CloudRunClient} = require('@google-cloud/run');
const {CloudSchedulerClient} = require('@google-cloud/scheduler');
const config = require('./config');

class InfrastructureProvisioner {
  constructor() {
    this.projectId = config.projectId;
    this.environment = config.environment;
    this.storage = new Storage();
    this.bigquery = new BigQuery();
    this.cloudRun = new CloudRunClient();
    this.scheduler = new CloudSchedulerClient();
  }

  async createBucket(cnpj) {
    const bucketName = `vmhub-data-semantc-ai-${cnpj}-${this.environment}`;
    try {
      await this.storage.createBucket(bucketName, {
        location: config.resourceDefaults.storage.location,
        uniformBucketLevelAccess: true,
        labels: {
          environment: this.environment,
          cnpj: cnpj
        },
        lifecycle: {
          rule: [
            {
              action: { type: 'Delete' },
              condition: {
                age: config.resourceDefaults.storage.retentionDays
              }
            }
          ]
        }
      });
      console.log(`bucket ${bucketName} created successfully`);
    } catch (error) {
      console.error(`error creating bucket ${bucketName}:`, error);
      throw error;
    }
  }

  async createDataset(cnpj) {
    const datasetId = `CNPJ_${cnpj}_RAW`;
    try {
      await this.bigquery.createDataset(datasetId, {
        location: config.resourceDefaults.storage.location,
        labels: {
          environment: this.environment,
          cnpj: cnpj
        }
      });
      console.log(`dataset ${datasetId} created successfully`);
    } catch (error) {
      console.error(`error creating dataset ${datasetId}:`, error);
      throw error;
    }
  }

  async createCloudRunJob(cnpj) {
    const name = `vmhub-sync-${cnpj}`;
    const job = {
      name: `projects/${this.projectId}/locations/${config.region}/jobs/${name}`,
      template: {
        template: {
          containers: [{
            image: config.resourceDefaults.cloudRun.containerImage,
            env: [
              { name: 'CNPJ', value: cnpj },
              { name: 'ENVIRONMENT', value: this.environment },
              { name: 'GCP_PROJECT_ID', value: this.projectId }
            ],
            resources: {
              limits: {
                cpu: config.resourceDefaults.cloudRun.cpu,
                memory: config.resourceDefaults.cloudRun.memory
              }
            }
          }],
          maxRetries: config.resourceDefaults.cloudRun.maxRetries,
          timeout: `${config.resourceDefaults.cloudRun.timeoutSeconds}s`
        }
      },
      labels: {
        environment: this.environment,
        cnpj: cnpj
      }
    };

    try {
      await this.cloudRun.createJob({
        parent: `projects/${this.projectId}/locations/${config.region}`,
        job
      });
      console.log(`cloud Run job ${name} created successfully`);
    } catch (error) {
      console.error(`error creating Cloud Run job ${name}:`, error);
      throw error;
    }
  }

  async createScheduler(cnpj) {
    const name = `vmhub-sync-schedule-${cnpj}`;
    const job = {
      name: `projects/${this.projectId}/locations/${config.region}/jobs/${name}`,
      schedule: config.resourceDefaults.scheduler.schedule,
      timeZone: config.resourceDefaults.scheduler.timezone,
      httpTarget: {
        uri: `https://${config.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${this.projectId}/jobs/vmhub-sync-${cnpj}:run`,
        httpMethod: 'POST'
      },
      retryConfig: {
        retryCount: config.resourceDefaults.scheduler.retryCount,
        maxRetryDuration: config.resourceDefaults.scheduler.maxRetryDuration
      }
    };

    try {
      await this.scheduler.createJob({
        parent: `projects/${this.projectId}/locations/${config.region}`,
        job
      });
      console.log(`cloud Scheduler job ${name} created successfully`);
    } catch (error) {
      console.error(`error creating Cloud Scheduler job ${name}:`, error);
      throw error;
    }
  }

  async provision(cnpj) {
    console.log(`starting provisioning for CNPJ ${cnpj}`);
    try {
      await this.createBucket(cnpj);
      await this.createDataset(cnpj);
      await this.createCloudRunJob(cnpj);
      await this.createScheduler(cnpj);
      await this.triggerInitialSync(cnpj);
      console.log(`completed provisioning for CNPJ ${cnpj}`);
      return true;
    } catch (error) {
      console.error(`failed to provision infrastructure for CNPJ ${cnpj}:`, error);
      throw error;
    }
  }

  async triggerInitialSync(cnpj) {
    const jobName = `vmhub-sync-${cnpj}`;
    try {
      await this.cloudRun.runJob({
        name: `projects/${this.projectId}/locations/${config.region}/jobs/${jobName}`
      });
      console.log(`initial sync triggered for ${jobName}`);
    } catch (error) {
      console.error(`error triggering initial sync for ${jobName}:`, error);
      throw error;
    }
  }
}

module.exports = InfrastructureProvisioner;