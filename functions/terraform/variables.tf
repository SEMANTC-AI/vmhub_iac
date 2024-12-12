# terraform/functions/terraform/variables.tf

variable "project_id" {
    description = "The GCP project ID"
    type        = string
}

variable "environment" {
    description = "Environment name (dev/prod)"
    type        = string
    validation {
        condition     = contains(["dev", "prod"], var.environment)
        error_message = "Environment must be either 'dev' or 'prod'."
    }
}

variable "region" {
    description = "The GCP region for the function"
    type        = string
    default     = "us-central1"
}

variable "function_service_account" {
    description = "The service account email to run the function"
    type        = string
}

variable "admin_email" {
    description = "The email address of the system admin"
    type        = string
}