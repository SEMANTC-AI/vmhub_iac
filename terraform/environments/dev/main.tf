# environments/dev/main.tf

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
    bucket = ""
    prefix = "terraform/state/dev"
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

  project_id          = var.project_id
  region             = var.region
  environment        = "dev"
}

# service account setup
module "service_account" {
  source = "../../modules/service-account"

  project_id   = var.project_id
  environment  = "dev"
  account_id   = "vmhub-sync-sa-dev"
}

# sync job resources - will be created by the application dynamically
# this is just an example for a single cnpj
module "sync_job" {
  source = "../../modules/sync-job"

  project_id        = var.project_id
  region           = var.region
  environment      = "dev"
  cnpj             = var.example_cnpj
  service_account  = module.service_account.service_account_email
  
  depends_on = [
    module.base_infrastructure,
    module.service_account
  ]
}