# modules/service-account/main.tf

# main service account for vmhub sync operations
resource "google_service_account" "main" {
  project      = var.project_id
  account_id   = var.account_id
  display_name = "VMHub Sync Service Account - ${title(var.environment)}"
  description  = "service account for VMHub data synchronization operations in ${var.environment}"
}

# cloud functions permissions
resource "google_project_iam_member" "cloud_functions" {
  project = var.project_id
  role    = "roles/cloudfunctions.developer"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# Service Account User permissions
resource "google_project_iam_member" "service_account_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# Cloud Run permissions
resource "google_project_iam_member" "cloud_run" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# Cloud Run Developer permissions
resource "google_project_iam_member" "cloud_run_developer" {
  project = var.project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# Cloud Scheduler permissions
resource "google_project_iam_member" "scheduler" {
  project = var.project_id
  role    = "roles/cloudscheduler.jobRunner"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# Allow Cloud Scheduler to invoke Cloud Run jobs
resource "google_project_iam_member" "scheduler_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# Firestore permissions
resource "google_project_iam_member" "firestore" {
  project = var.project_id
  role    = "roles/datastore.viewer"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# Optional: Secret Manager access
resource "google_project_iam_member" "secret_manager" {
  count   = var.enable_secret_manager_access ? 1 : 0
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.main.email}"
}

# Workload identity configuration if needed
resource "google_service_account_iam_binding" "workload_identity" {
  count              = var.workload_identity_users != null ? 1 : 0
  service_account_id = google_service_account.main.name
  role               = "roles/iam.workloadIdentityUser"
  members            = var.workload_identity_users
}