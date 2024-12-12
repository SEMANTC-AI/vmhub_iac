# environments/dev/variables.tf

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

variable "min_instances" {
  description = "MINIMUM NUMBER OF INSTANCES FOR CLOUD RUN JOBS"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "MAXIMUM NUMBER OF INSTANCES FOR CLOUD RUN JOBS"
  type        = number
  default     = 10
}

variable "cpu_limit" {
  description = "CPU LIMIT FOR CLOUD RUN JOBS"
  type        = string
  default     = "1000m"
}

variable "memory_limit" {
  description = "MEMORY LIMIT FOR CLOUD RUN JOBS"
  type        = string
  default     = "512Mi"
}

variable "timeout_seconds" {
  description = "TIMEOUT IN SECONDS FOR CLOUD RUN JOBS"
  type        = number
  default     = 600
}