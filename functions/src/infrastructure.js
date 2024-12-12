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

    async createBucket(cnpj, userEmail) {
        const bucketName = `vmhub-data-semantc-ai-${cnpj}-${this.environment}`;
        try {
            const [bucket] = await this.storage.createBucket(bucketName, {
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

            // Set IAM policy
            await bucket.iam.setPolicy({
                bindings: [
                    {
                        role: 'roles/storage.objectViewer',
                        members: [`user:${userEmail}`]
                    },
                    {
                        role: 'roles/storage.admin',
                        members: [`user:${config.adminEmail}`]
                    }
                ]
            });

            console.log(`Bucket ${bucketName} created successfully`);
        } catch (error) {
            console.error(`Error creating bucket ${bucketName}:`, error);
            throw error;
        }
    }

    async createDataset(cnpj, userEmail) {
        const datasetId = `CNPJ_${cnpj}_RAW`;
        try {
            await this.bigquery.createDataset(datasetId, {
                location: config.resourceDefaults.bigquery.location,
                labels: {
                    environment: this.environment,
                    cnpj: cnpj
                },
                access: [
                    {
                        role: config.resourceDefaults.bigquery.defaultRoles.admin,
                        userByEmail: config.adminEmail
                    },
                    {
                        role: config.resourceDefaults.bigquery.defaultRoles.user,
                        userByEmail: userEmail
                    }
                ]
            });
            console.log(`Dataset ${datasetId} created successfully`);
        } catch (error) {
            console.error(`Error creating dataset ${datasetId}:`, error);
            throw error;
        }
    }

    // ... rest of your existing methods (createCloudRunJob, createScheduler) ...

    async provision(cnpj, userEmail) {
        console.log(`Starting provisioning for CNPJ ${cnpj}`);
        try {
            await this.createBucket(cnpj, userEmail);
            await this.createDataset(cnpj, userEmail);
            await this.createCloudRunJob(cnpj);
            await this.createScheduler(cnpj);
            await this.triggerInitialSync(cnpj);
            console.log(`Completed provisioning for CNPJ ${cnpj}`);
            return true;
        } catch (error) {
            console.error(`Failed to provision infrastructure for CNPJ ${cnpj}:`, error);
            throw error;
        }
    }

    // ... rest of your existing methods ...
}

module.exports = InfrastructureProvisioner;