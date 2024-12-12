# modules/service-account/outputs.tf

output "service_account_email" {
  description = "THE EMAIL ADDRESS OF THE SERVICE ACCOUNT"
  value       = google_service_account.main.email
}

output "service_account_id" {
  description = "THE ID OF THE SERVICE ACCOUNT"
  value       = google_service_account.main.id
}

output "service_account_name" {
  description = "THE FULLY-QUALIFIED NAME OF THE SERVICE ACCOUNT"
  value       = google_service_account.main.name
}

output "service_account_unique_id" {
  description = "THE UNIQUE ID OF THE SERVICE ACCOUNT"
  value       = google_service_account.main.unique_id
}