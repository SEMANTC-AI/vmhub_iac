# environments/prod/variables.tf

variable "project_id" {
  description = "THE GCP PROJECT ID"
  type        = string
}

variable "region" {
  description = "THE GCP REGION FOR RESOURCES"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "THE GCP ZONE FOR RESOURCES"
  type        = string
  default     = "us-central1-a"
}

variable "example_cnpj" {
  description = "EXAMPLE CNPJ FOR TESTING SYNC JOB MODULE"
  type        = string
}

variable "container_image" {
  description = "CONTAINER IMAGE FOR THE SYNC JOB"
  type        = string
  default     = "us-central1-docker.pkg.dev/PROJECT_ID/vmhub-api/vmhub-sync:latest"
}

variable "scheduler_timezone" {
  description = "TIMEZONE FOR CLOUD SCHEDULER JOBS"
  type        = string
  default     = "America/Sao_Paulo"
}

# production-specific defaults
variable "min_instances" {
  description = "MINIMUM NUMBER OF INSTANCES FOR CLOUD RUN JOBS"
  type        = number
  default     = 1  # higher minimum for production
}

variable "max_instances" {
  description = "MAXIMUM NUMBER OF INSTANCES FOR CLOUD RUN JOBS"
  type        = number
  default     = 20  # higher maximum for production
}

variable "cpu_limit" {
  description = "CPU LIMIT FOR CLOUD RUN JOBS"
  type        = string
  default     = "2000m"  # more CPU for production
}

variable "memory_limit" {
  description = "MEMORY LIMIT FOR CLOUD RUN JOBS"
  type        = string
  default     = "1024Mi"  # more memory for production
}

variable "timeout_seconds" {
  description = "TIMEOUT IN SECONDS FOR CLOUD RUN JOBS"
  type        = number
  default     = 900  # longer timeout for production
}

variable "enable_monitoring" {
  description = "ENABLE DETAILED MONITORING AND ALERTING"
  type        = bool
  default     = true
}