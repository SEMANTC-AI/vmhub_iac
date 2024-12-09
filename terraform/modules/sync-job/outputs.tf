# modules/sync-job/outputs.tf

output "storage_bucket_name" {
  description = "THE NAME OF THE CREATED STORAGE BUCKET"
  value       = google_storage_bucket.data_bucket.name
}

output "bigquery_dataset_id" {
  description = "THE ID OF THE CREATED BIGQUERY DATASET"
  value       = google_bigquery_dataset.main.dataset_id
}

output "cloud_run_job_name" {
  description = "THE NAME OF THE CREATED CLOUD RUN JOB"
  value       = google_cloud_run_v2_job.sync_job.name
}

output "scheduler_job_name" {
  description = "THE NAME OF THE CREATED CLOUD SCHEDULER JOB"
  value       = google_cloud_scheduler_job.sync_schedule.name
}

output "resource_names" {
  description = "MAP OF ALL CREATED RESOURCE NAMES"
  value = {
    bucket     = google_storage_bucket.data_bucket.name
    dataset    = google_bigquery_dataset.main.dataset_id
    cloud_run  = google_cloud_run_v2_job.sync_job.name
    scheduler  = google_cloud_scheduler_job.sync_schedule.name
  }
}