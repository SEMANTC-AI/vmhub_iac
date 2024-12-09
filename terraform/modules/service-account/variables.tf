# modules/service-account/variables.tf

variable "project_id" {
  description = "THE GCP PROJECT ID"
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

variable "account_id" {
  description = "THE ID FOR THE SERVICE ACCOUNT"
  type        = string
  default     = null
}

variable "enable_secret_manager_access" {
  description = "WHETHER TO ENABLE SECRET MANAGER ACCESS"
  type        = bool
  default     = false
}

variable "workload_identity_users" {
  description = "LIST OF USERS/SAS TO ALLOW WORKLOAD IDENTITY FEDERATION"
  type        = list(string)
  default     = null
}

variable "labels" {
  description = "LABELS TO APPLY TO THE SERVICE ACCOUNT"
  type        = map(string)
  default     = {}
}