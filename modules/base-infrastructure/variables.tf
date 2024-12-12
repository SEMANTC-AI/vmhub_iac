# modules/base-infrastructure/variables.tf

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

variable "enable_monitoring" {
  description = "ENABLE MONITORING AND ALERTING"
  type        = bool
  default     = false
}

variable "create_vpc" {
  description = "CREATE A VPC NETWORK"
  type        = bool
  default     = false
}

variable "notification_channel_ids" {
  description = "LIST OF NOTIFICATION CHANNEL IDS FOR ALERTS"
  type        = list(string)
  default     = []
}