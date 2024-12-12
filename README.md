# VMHub Infrastructure

This repository contains the infrastructure code for the VMHub system, including Terraform modules and Cloud Functions.

## Structure

```
vmhub_iac/
├── environments/          # Environment-specific configurations
│   ├── dev/
│   └── prod/
├── modules/              # Reusable Terraform modules
│   ├── base-infrastructure/
│   └── service-account/
├── functions/           # Cloud Functions code
│   └── src/
└── terraform/          # Terraform configurations for Functions
```

## Prerequisites

- Google Cloud SDK
- Terraform >= 1.0
- Node.js >= 18
- Firebase CLI

## Deployment

1. Set up Google Cloud credentials:
```bash
gcloud auth application-default login
```

2. Run the deployment script:
```bash
./deploy.sh dev your-project-id us-central1
```

## Development

1. Local testing of Functions:
```bash
cd functions
npm install
npm run test
```

2. Testing Terraform changes:
```bash
cd environments/dev
terraform plan
```

## Monitoring

Monitor the deployment in:
1. Firebase Console - for Functions
2. Google Cloud Console - for infrastructure
3. BigQuery - for data
4. Cloud Run - for jobs

## Maintenance

1. Updating dependencies:
```bash
cd functions
npm update
```

2. Terraform state management:
```bash
terraform state list
terraform show
```