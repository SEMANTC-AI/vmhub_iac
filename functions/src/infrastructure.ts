// functions/src/infrastructure.ts

import {Storage} from "@google-cloud/storage";
import {BigQuery} from "@google-cloud/bigquery";
import {JobsClient} from "@google-cloud/run/build/src/v2";
import {CloudSchedulerClient} from "@google-cloud/scheduler";
import {InfrastructureError} from "./types";
import config from "./config";

export class InfrastructureProvisioner {
  private projectId: string;
  private environment: string;
  private storage: Storage;
  private bigquery: BigQuery;
  private cloudRun: JobsClient;
  private scheduler: CloudSchedulerClient;

  constructor() {
    this.projectId = config.projectId;
    this.environment = config.environment;
    this.storage = new Storage();
    this.bigquery = new BigQuery();
    this.cloudRun = new JobsClient();
    this.scheduler = new CloudSchedulerClient();
  }

  async createBucket(cnpj: string, userEmail: string): Promise<void> {
    const bucketName = `vmhub-data-semantc-ai-${cnpj}-${this.environment}`;
    try {
      const [bucket] = await this.storage.createBucket(bucketName, {
        location: config.resourceDefaults.storage.location,
        uniformBucketLevelAccess: true,
        labels: {
          environment: this.environment,
          cnpj: cnpj,
        },
        lifecycle: {
          rule: [
            {
              action: {type: "Delete"},
              condition: {
                age: config.resourceDefaults.storage.retentionDays,
              },
            },
          ],
        },
      });

      await bucket.iam.setPolicy({
        bindings: [
          {
            role: "roles/storage.objectViewer",
            members: [`user:${userEmail}`],
          },
          {
            role: "roles/storage.admin",
            members: [`user:${config.adminEmail}`],
          },
        ],
      });

      // Create necessary folders
      await Promise.all([
        this.storage.bucket(bucketName).file("vendas/").save(""),
        this.storage.bucket(bucketName).file("clientes/").save(""),
      ]);

      console.log(`Bucket ${bucketName} created successfully`);
    } catch (error) {
      console.error(`Error creating bucket ${bucketName}:`, error);
      throw this.handleError(error);
    }
  }

  async createDataset(cnpj: string, userEmail: string): Promise<void> {
    const rawDatasetId = `CNPJ_${cnpj}_RAW`;
    const campaignDatasetId = `CNPJ_${cnpj}_CAMPAIGN`;

    try {
      // Create RAW dataset
      await this.bigquery.createDataset(rawDatasetId, {
        location: config.resourceDefaults.bigquery.location,
        labels: {
          environment: this.environment,
          cnpj: cnpj,
          type: "raw",
        },
      });

      // Set RAW dataset permissions
      const [rawDataset] = await this.bigquery.dataset(rawDatasetId).get();
      const rawMetadata = rawDataset.metadata;
      rawMetadata.access = [
        {
          role: "WRITER",
          userByEmail: config.adminEmail,
        },
        {
          role: "READER",
          userByEmail: userEmail,
        },
      ];
      await rawDataset.setMetadata(rawMetadata);

      // Create CAMPAIGN dataset
      await this.bigquery.createDataset(campaignDatasetId, {
        location: config.resourceDefaults.bigquery.location,
        labels: {
          environment: this.environment,
          cnpj: cnpj,
          type: "campaign",
        },
      });

      // Set CAMPAIGN dataset permissions
      const [campaignDataset] = await this.bigquery.dataset(campaignDatasetId).get();
      const campaignMetadata = campaignDataset.metadata;
      campaignMetadata.access = [
        {
          role: "WRITER",
          userByEmail: config.adminEmail,
        },
        {
          role: "READER",
          userByEmail: userEmail,
        },
      ];
      await campaignDataset.setMetadata(campaignMetadata);

      // Create tables
      await this.createTables(rawDatasetId, campaignDatasetId);

      console.log(`Datasets created successfully for CNPJ ${cnpj}`);
    } catch (error) {
      console.error(`Error creating datasets for CNPJ ${cnpj}:`, error);
      throw this.handleError(error);
    }
  }

  private async createTables(rawDatasetId: string, campaignDatasetId: string): Promise<void> {
    const rawDataset = this.bigquery.dataset(rawDatasetId);
    const campaignDataset = this.bigquery.dataset(campaignDatasetId);

    try {
      // Create tables in RAW dataset
      await rawDataset.createTable("clientes", {
        schema: {
          fields: [
            {name: "id", type: "STRING"},
            {name: "nome", type: "STRING"},
            {name: "dataNascimento", type: "TIMESTAMP"},
            {name: "cpf", type: "STRING"},
            {name: "telefone", type: "STRING"},
            {name: "email", type: "STRING"},
            {name: "genero", type: "STRING"},
            {name: "dataCadastro", type: "TIMESTAMP"},
            {name: "primeiraCompra", type: "TIMESTAMP"},
            {name: "source_system", type: "STRING"},
          ],
        },
      });

      await rawDataset.createTable("vendas", {
        schema: {
          fields: [
            {name: "data", type: "TIMESTAMP"},
            {name: "cpfCliente", type: "STRING"},
            {name: "valor", type: "FLOAT"},
            {name: "status", type: "STRING"},
            {name: "tipoPagamento", type: "STRING"},
            {name: "cupom", type: "STRING"},
            {name: "source_system", type: "STRING"},
          ],
        },
      });

      // Create tables in CAMPAIGN dataset
      await campaignDataset.createTable("message_history", {
        schema: {
          fields: [
            {name: "user_id", type: "STRING"},
            {name: "campaign_type", type: "STRING"},
            {name: "sent_at", type: "TIMESTAMP"},
            {name: "status", type: "STRING"},
            {name: "message_content", type: "STRING"},
            {name: "phone", type: "STRING"},
          ],
        },
      });
    } catch (error) {
      console.error("Error creating tables:", error);
      throw this.handleError(error);
    }
  }

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
                image: config.resourceDefaults.cloudRun.containerImage.replace("PROJECT_ID", this.projectId),
                env: [
                  {name: "CNPJ", value: cnpj},
                  {name: "ENVIRONMENT", value: this.environment},
                  {name: "PROJECT_ID", value: this.projectId},
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
      console.error(`Error creating Cloud Run job ${name}:`, error);
      throw this.handleError(error);
    }
  }

  async createScheduler(cnpj: string): Promise<void> {
    const name = `vmhub-sync-schedule-${cnpj}`;
    const parent = `projects/${this.projectId}/locations/${config.region}`;

    try {
      const jobRequest = {
        parent,
        job: {
          name: `${parent}/jobs/${name}`,
          schedule: config.resourceDefaults.scheduler.schedule,
          timeZone: config.resourceDefaults.scheduler.timezone,
          httpTarget: {
            uri: `https://${config.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${this.projectId}/jobs/vmhub-sync-${cnpj}:run`,
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
      console.error(`Error creating Cloud Scheduler job ${name}:`, error);
      throw this.handleError(error);
    }
  }

  async triggerInitialSync(cnpj: string): Promise<void> {
    const name = `projects/${this.projectId}/locations/${config.region}/jobs/vmhub-sync-${cnpj}`;

    try {
      const request = {
        name,
      };

      const [operation] = await this.cloudRun.runJob(request);
      const [response] = await operation.promise();

      console.log(`Initial sync triggered for ${name}:`, response);
    } catch (error) {
      console.error(`Error triggering initial sync for ${name}:`, error);
      throw this.handleError(error);
    }
  }

  async provision(cnpj: string, userEmail: string): Promise<boolean> {
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
      throw this.handleError(error);
    }
  }

  private handleError(error: any): InfrastructureError {
    if (error instanceof Error) {
      return {
        ...error,
        code: error.name,
        details: error.message,
      };
    }
    return new Error("Unknown error occurred");
  }
}
