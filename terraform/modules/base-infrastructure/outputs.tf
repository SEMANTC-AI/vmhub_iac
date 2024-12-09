# modules/base-infrastructure/outputs.tf

output "artifact_registry_repository_id" {
  description = "THE ID OF THE ARTIFACT REGISTRY REPOSITORY"
  value       = google_artifact_registry_repository.vmhub_sync.id
}

output "artifact_registry_repository_name" {
  description = "THE NAME OF THE ARTIFACT REGISTRY REPOSITORY"
  value       = google_artifact_registry_repository.vmhub_sync.name
}

output "vpc_network_id" {
  description = "THE ID OF THE VPC NETWORK"
  value       = var.create_vpc ? google_compute_network.vpc[0].id : null
}

output "vpc_network_name" {
  description = "THE NAME OF THE VPC NETWORK"
  value       = var.create_vpc ? google_compute_network.vpc[0].name : null
}

output "log_bucket_id" {
  description = "THE ID OF THE LOGGING BUCKET"
  value       = google_logging_project_bucket_config.main.bucket_id
}