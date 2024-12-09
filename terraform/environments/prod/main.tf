# environments/prod/main.tf

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 4.0"
    }
  }

  backend "gcs" {
    bucket = "tf-state-semantc-ai-prod"
    prefix = "terraform/state/prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

module "base_infrastructure" {
  source = "../../modules/base-infrastructure"

  project_id   = var.project_id
  region      = var.region
  environment = "prod"
}

module "service_account" {
  source = "../../modules/service-account"

  project_id   = var.project_id
  environment  = "prod"
  account_id   = "vmhub-sync-sa-prod"
}

module "sync_job" {
  source = "../../modules/sync-job"

  project_id       = var.project_id
  region          = var.region
  environment     = "prod"
  cnpj            = var.example_cnpj
  service_account = module.service_account.service_account_email
  container_image = var.container_image
  
  # production-specific overrides
  cpu_limit        = var.cpu_limit
  memory_limit     = var.memory_limit
  timeout_seconds  = var.timeout_seconds
}
