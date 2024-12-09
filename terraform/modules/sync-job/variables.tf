# modules/sync-job/variables.tf

variable "project_id" {
  description = "THE GCP PROJECT ID"
  type        = string
}

variable "region" {
  description = "THE GCP REGION FOR RESOURCES"
  type        = string
}

variable "environment" {
  description = "ENVIRONMENT NAME (DEV/PROD)"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be either 'dev' or 'prod'."
  }
}

variable "cnpj" {
  description = "CNPJ IDENTIFIER (NUMBERS ONLY)"
  type        = string
  validation {
    condition     = can(regex("^[0-9]{14}$", var.cnpj))
    error_message = "CNPJ must be exactly 14 digits."
  }
}

variable "service_account" {
  description = "SERVICE ACCOUNT EMAIL TO RUN THE JOB"
  type        = string
}

variable "container_image" {
  description = "CONTAINER IMAGE FOR THE SYNC JOB"
  type        = string
}

variable "storage_retention_days" {
  description = "NUMBER OF DAYS TO RETAIN DATA IN CLOUD STORAGE"
  type        = number
  default     = 30
}

variable "cpu_limit" {
  description = "CPU LIMIT FOR CLOUD RUN JOB"
  type        = string
  default     = "1000m"
}

variable "memory_limit" {
  description = "MEMORY LIMIT FOR CLOUD RUN JOB"
  type        = string
  default     = "512Mi"
}

variable "timeout_seconds" {
  description = "TIMEOUT IN SECONDS FOR CLOUD RUN JOB"
  type        = number
  default     = 600
}

variable "schedule" {
  description = "CRON SCHEDULE FOR THE SYNC JOB"
  type        = string
  default     = "0 */4 * * *"  # Every 4 hours
}

variable "scheduler_timezone" {
  description = "TIMEZONE FOR CLOUD SCHEDULER"
  type        = string
  default     = "America/Sao_Paulo"
}