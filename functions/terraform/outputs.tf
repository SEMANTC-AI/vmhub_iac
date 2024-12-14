# functions/terraform/outputs.tf

output "function_name" {
  description = "THE NAME OF THE DEPLOYED FUNCTION"
  value       = google_cloudfunctions_function.provisioner.name
}

output "function_uri" {
  description = "THE URI OF THE DEPLOYED FUNCTION"
  value       = google_cloudfunctions_function.provisioner.https_trigger_url
}

output "bucket_name" {
  description = "THE NAME OF THE FUNCTION SOURCE BUCKET"
  value       = google_storage_bucket.function_bucket.name
}