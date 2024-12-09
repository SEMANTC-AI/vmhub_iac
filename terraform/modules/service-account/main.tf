# modules/service-account/main.tf

# main service account for vmhub sync operations
resource "google_service_account" "main" {
  project      = var.project_id
  account_id   = var.account_id
  display_name = "VMHub Sync Service Account - ${title(var.environment)}"
  description  = "service account for VMHub data synchronization operations in ${var.environment}"
}

# cloud run permissions
resource "google_project_iam_member" "cloud_run" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# cloud storage permissions
resource "google_project_iam_member" "storage" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# bigquery permissions
resource "google_project_iam_member" "bigquery" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# firestore permissions (for reading tokens)
resource "google_project_iam_member" "firestore" {
  project = var.project_id
  role    = "roles/datastore.viewer"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# cloud scheduler permissions
resource "google_project_iam_member" "scheduler" {
  project = var.project_id
  role    = "roles/cloudscheduler.jobRunner"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# allow cloud scheduler to invoke cloud run jobs
resource "google_project_iam_member" "scheduler_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# optional: secret manager access if needed
resource "google_project_iam_member" "secret_manager" {
  count   = var.enable_secret_manager_access ? 1 : 0
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# workload identity configuration if needed
resource "google_service_account_iam_binding" "workload_identity" {
  count              = var.workload_identity_users != null ? 1 : 0
  service_account_id = google_service_account.main.name
  role               = "roles/iam.workloadIdentityUser"
  members            = var.workload_identity_users
}