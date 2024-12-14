export interface ConfigType {
  projectId: string;
  environment: string;
  region: string;
  adminEmail: string;
  resourceDefaults: {
      cloudRun: CloudRunConfig;
      scheduler: SchedulerConfig;
      storage: StorageConfig;
      bigquery: BigQueryConfig;
  };
}

interface CloudRunConfig {
  containerImage: string;
  cpu: string;
  memory: string;
  timeoutSeconds: number;
  maxRetries: number;
}

interface SchedulerConfig {
  schedule: string;
  timezone: string;
  retryCount: number;
  maxRetryDuration: string;
}

interface StorageConfig {
  location: string;
  retentionDays: number;
}

interface BigQueryConfig {
  location: string;
  defaultRoles: {
      admin: string;
      user: string;
  };
}

export interface UserData {
  email: string;
  status: "pending_setup" | "provisioning" | "provisioned" | "error";
}

export interface InfrastructureError extends Error {
  code?: string;
  details?: any;
}

export interface CloudRunJob {
  name: string;
  template: {
      template: {
          containers: Array<{
              image: string;
              env: Array<{
                  name: string;
                  value: string;
              }>;
              resources: {
                  limits: {
                      cpu: string;
                      memory: string;
                  };
              };
          }>;
          maxRetries: number;
          timeout: string;
      };
  };
  labels: {
      environment: string;
      cnpj: string;
  };
}

export interface SchedulerJob {
  name: string;
  schedule: string;
  timeZone: string;
  httpTarget: {
      uri: string;
      httpMethod: string;
  };
  retryConfig: {
      retryCount: number;
      maxRetryDuration: string;
  };
}
