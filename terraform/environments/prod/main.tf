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
    bucket = "YOUR_TERRAFORM_STATE_BUCKET"
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

# base infrastructure setup
module "base_infrastructure" {
  source = "../../modules/base-infrastructure"

  project_id   = var.project_id
  region      = var.region
  environment = "prod"
}

# service account setup
module "service_account" {
  source = "../../modules/service-account"

  project_id   = var.project_id
  environment  = "prod"
  account_id   = "vmhub-sync-sa-prod"
}

# sync job resources - will be created by the application dynamically
# this is just an example for a single cnpj
module "sync_job" {
  source = "../../modules/sync-job"

  project_id       = var.project_id
  region          = var.region
  environment     = "prod"
  cnpj            = var.example_cnpj
  service_account = module.service_account.service_account_email

  # production-specific settings
  min_instances    = var.min_instances
  max_instances    = var.max_instances
  cpu_limit        = var.cpu_limit
  memory_limit     = var.memory_limit
  timeout_seconds  = var.timeout_seconds
  
  depends_on = [
    module.base_infrastructure,
    module.service_account
  ]
}