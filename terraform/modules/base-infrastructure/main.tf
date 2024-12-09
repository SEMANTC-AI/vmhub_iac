# modules/base-infrastructure/main.tf

# enable required apis
resource "google_project_service" "required_apis" {
  for_each = toset([
    "cloudresourcemanager.googleapis.com",  # resource manager api
    "artifactregistry.googleapis.com",      # artifact registry api
    "cloudbuild.googleapis.com",            # cloud build api
    "cloudscheduler.googleapis.com",        # cloud scheduler api
    "bigquery.googleapis.com",              # bigquery api
    "storage.googleapis.com",               # cloud storage api
    "firestore.googleapis.com",             # firestore api
    "iam.googleapis.com"                    # iam api
  ])

  project = var.project_id
  service = each.value

  disable_dependent_services = false
  disable_on_destroy        = false
}

# artifact registry repository for container images
resource "google_artifact_registry_repository" "vmhub_sync" {
  project       = var.project_id
  location      = var.region
  repository_id = "vmhub-sync-${var.environment}"
  description   = "DOCKER REPOSITORY FOR VMHUB SYNC CONTAINERS"
  format        = "DOCKER"

  depends_on = [
    google_project_service.required_apis
  ]
}

# monitoring: logging bucket with 30-day retention
resource "google_logging_project_bucket_config" "main" {
  project        = var.project_id
  location       = var.region  
  retention_days = 30
  bucket_id      = "${var.environment}_logs"

  depends_on = [
    google_project_service.required_apis
  ]
}

# monitoring: create log metric for job failures
resource "google_logging_metric" "job_failures" {
  name    = "vmhub_sync_job_failures_${var.environment}"
  project = var.project_id
  filter  = "resource.type=\"cloud_run_job\" AND severity>=ERROR"

  label_extractors = {
    "environment" = "REGEXP_EXTRACT(resource.labels.job_name, \".*-(dev|prod)$\")"
    "cnpj"        = "REGEXP_EXTRACT(resource.labels.job_name, \"vmhub-sync-([0-9]+)\")"
  }

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"

    labels {
      key         = "environment"
      value_type  = "STRING"
      description = "Environment (dev/prod)"
    }
    labels {
      key         = "cnpj"
      value_type  = "STRING"
      description = "CNPJ identifier"
    }
  }
}

# monitoring: alert policy for job failures
resource "google_monitoring_alert_policy" "job_failures" {
  count        = var.enable_monitoring ? 1 : 0
  project      = var.project_id
  display_name = "VMHub Sync Job Failures - ${var.environment}"
  combiner     = "OR"

  conditions {
    display_name = "Job Failure Rate"
    condition_threshold {
      filter          = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.job_failures.name}\" AND resource.type=\"cloud_run_job\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0
      trigger {
        count = 1
      }
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_COUNT"
      }
    }
  }

  notification_channels = var.notification_channel_ids

  depends_on = [
    google_project_service.required_apis,
    google_logging_metric.job_failures
  ]
}

# vpc network for enhanced security (if needed)
resource "google_compute_network" "vpc" {
  count                   = var.create_vpc ? 1 : 0
  project                 = var.project_id
  name                    = "vmhub-sync-vpc-${var.environment}"
  auto_create_subnetworks = true

  depends_on = [
    google_project_service.required_apis
  ]
}