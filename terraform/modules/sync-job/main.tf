# modules/sync-job/main.tf

# cloud storage bucket for raw data
resource "google_storage_bucket" "data_bucket" {
  name                        = "vmhub-data-semantic-ai-${var.cnpj}-${var.environment}"
  location                    = var.region
  project                     = var.project_id
  uniform_bucket_level_access = true
  force_destroy              = var.environment == "dev" ? true : false

  lifecycle_rule {
    condition {
      age = var.storage_retention_days
    }
    action {
      type = "Delete"
    }
  }

  labels = {
    environment = var.environment
    cnpj        = var.cnpj
  }
}

# bigquery dataset
resource "google_bigquery_dataset" "main" {
  dataset_id                 = "CNPJ_${var.cnpj}_RAW"
  project                   = var.project_id
  location                  = var.region
  delete_contents_on_destroy = var.environment == "dev" ? true : false

  labels = {
    environment = var.environment
    cnpj        = var.cnpj
  }

  access {
    role          = "OWNER"
    user_by_email = var.service_account
  }
}

# cloud run job
resource "google_cloud_run_v2_job" "sync_job" {
  name     = "vmhub-sync-${var.cnpj}"
  location = var.region
  project  = var.project_id

  template {
    task_count = 1  # number of tasks to run in parallel
    template {
      max_retries = 3
      
      containers {
        image = var.container_image

        resources {
          limits = {
            cpu    = var.cpu_limit
            memory = var.memory_limit
          }
        }

        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }
        env {
          name  = "GCS_BUCKET_NAME"
          value = google_storage_bucket.data_bucket.name
        }
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
        env {
          name  = "CNPJ"
          value = var.cnpj
        }
      }

      service_account = var.service_account
      timeout = "${var.timeout_seconds}s"
    }
  }

  labels = {
    environment = var.environment
    cnpj        = var.cnpj
  }
}

# cloud scheduler job
resource "google_cloud_scheduler_job" "sync_schedule" {
  name     = "vmhub-sync-schedule-${var.cnpj}"
  project  = var.project_id
  region   = var.region
  schedule = var.schedule
  time_zone = var.scheduler_timezone

  retry_config {
    retry_count = 3
    min_backoff_duration = "1s"
    max_backoff_duration = "10s"
    max_retry_duration = "30s"
    max_doublings = 2
  }

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${google_cloud_run_v2_job.sync_job.name}:run"

    oauth_token {
      service_account_email = var.service_account
    }
  }
}