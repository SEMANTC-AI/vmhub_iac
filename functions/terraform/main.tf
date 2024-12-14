# functions/terraform/main.tf

resource "google_storage_bucket" "function_bucket" {
  name                        = "vmhub-functions-${var.environment}"
  location                    = var.region
  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }
}

data "archive_file" "function_zip" {
  type        = "zip"
  source_dir  = "../src"
  output_path = "function.zip"
}

resource "google_storage_bucket_object" "function_code" {
  name   = "function-${data.archive_file.function_zip.output_md5}.zip"
  bucket = google_storage_bucket.function_bucket.name
  source = data.archive_file.function_zip.output_path
}

resource "google_cloudfunctions_function" "provisioner" {
  name                  = "vmhub-provisioner-${var.environment}"
  runtime               = "nodejs18"
  service_account_email = var.function_service_account
  region               = var.region

  source_archive_bucket = google_storage_bucket.function_bucket.name
  source_archive_object = google_storage_bucket_object.function_code.name

  entry_point = "onNewUserSetup"
  
  event_trigger {
    event_type = "providers/cloud.firestore/eventTypes/document.create"
    resource   = "users/{userId}/tokens/{cnpj}"
  }

  environment_variables = {
    PROJECT_ID  = var.project_id
    ENVIRONMENT = var.environment
  }

  labels = {
    environment = var.environment
    service     = "vmhub-provisioner"
  }
}