# terraform/functions/terraform/variables.tf

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

variable "region" {
  description = "THE GCP REGION FOR THE FUNCTION"
  type        = string
  default     = "us-central1"
}

variable "function_service_account" {
  description = "THE SERVICE ACCOUNT EMAIL TO RUN THE FUNCTION"
  type        = string
}