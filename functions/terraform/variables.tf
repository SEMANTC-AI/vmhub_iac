# functions/terraform/variables.tf

variable "project_id" {
    description = "THE GCP PROJECT ID"
    type        = string
}

variable "environment" {
    description = "ENVIRONMENT NAME (DEV/PROD)"
    type        = string
    validation {
        condition     = contains(["dev", "prod"], var.environment)
        error_message = "ENVIRONMENT MUST BE EITHER 'DEV' OR 'PROD'."
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

variable "admin_email" {
    description = "THE EMAIL ADDRESS OF THE SYSTEM ADMIN"
    type        = string
}