# VMHub Infrastructure

This repository contains Terraform configurations for deploying and managing the VMHub infrastructure on Google Cloud Platform.

## Project Structure

```
terraform/
├── environments/           # Environment-specific configurations
│   ├── dev/               # Development environment
│   └── prod/              # Production environment
├── modules/               # Reusable Terraform modules
│   ├── cloud-run-job/     # Cloud Run Job configuration
│   ├── scheduler/         # Cloud Scheduler configuration
│   └── service-accounts/  # Service account management
```

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) (>= 1.0.0)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- Appropriate GCP permissions
- Service account with necessary roles

## Setup Instructions

1. Initialize Terraform:
```bash
cd environments/dev  # or prod
terraform init
```

2. Review planned changes:
```bash
terraform plan
```

3. Apply changes:
```bash
terraform apply
```

## Module Documentation

### Cloud Run Job
Manages the job configuration including:
- Container image
- CPU and memory allocation
- Environment variables
- Service account association

### Cloud Scheduler
Configures scheduled execution of the job:
- Schedule definition (cron format)
- Retry configuration
- Job parameters

### Service Accounts
Manages service accounts and IAM permissions for:
- Cloud Run execution
- GCS access
- BigQuery operations

## Environment Variables

Required environment variables:
- `VMHUB_API_KEY`
- `VMHUB_CNPJ`
- `VMHUB_BASE_URL`
- `GCP_PROJECT_ID`
- `GCS_BUCKET_NAME`

## Maintenance

- Review and update module versions regularly
- Monitor resource usage and costs
- Keep service account permissions up to date
- Regularly backup Terraform state

## Contributing

1. Create a new branch for your changes
2. Make your changes
3. Test in the dev environment
4. Submit a pull request

## Security Notes

- Avoid storing sensitive data in Terraform files
- Use secure methods for managing secrets
- Regularly rotate service account keys
- Review IAM permissions periodically

## Support

For support, please contact the infrastructure team.