# VMHub Infrastructure as Code (IaC)

## Overview
This repository contains the infrastructure code for VMHub, a marketing automation platform for laundromat businesses that handles customer messaging campaigns through WhatsApp.

## Architecture
The infrastructure consists of several key components:
1. **Cloud Functions**: Handles provisioning of resources when a new client is onboarded
2. **Cloud Run Jobs**: Executes data synchronization tasks
3. **Cloud Scheduler**: Manages periodic data synchronization
4. **Service Accounts**: Manages permissions and authentication

## Project Structure
```
vmhub_iac/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   └── prod/
│       ├── main.tf
│       ├── variables.tf
│       └── terraform.tfvars
├── functions/
│   ├── src/
│   │   ├── config.ts
│   │   ├── index.ts
│   │   ├── infrastructure.ts
│   │   └── types.ts
│   ├── firebase.json
│   ├── package.json
│   └── tsconfig.json
└── modules/
    ├── base_infrastructure/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── service_account/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## Prerequisites
- Node.js 18+
- Terraform v1.0+
- Firebase CLI
- Google Cloud SDK
- Access to the GCP project

## Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
PROJECT_ID=your-project-id
ENVIRONMENT=dev|prod
REGION=us-central1
ADMIN_EMAIL=admin@example.com
```

### Service Account Permissions
The service account requires the following roles:
- Cloud Functions Developer
- Cloud Run Admin
- Cloud Scheduler Admin
- Service Account User
- Firestore Viewer

## Deployment

### Initial Setup
1. Configure GCP project:
```bash
gcloud config set project YOUR_PROJECT_ID
```

2. Enable required APIs:
```bash
gcloud services enable \
  cloudfunctions.googleapis.com \
  run.googleapis.com \
  cloudscheduler.googleapis.com \
  firestore.googleapis.com
```

### Deployment Process
Use the deployment script:
```bash
./deploy.sh <environment> <project-id> [region] [admin-email]
```

Example:
```bash
./deploy.sh dev semantc-ai us-central1 admin@example.com
```

This will:
1. Deploy base infrastructure using Terraform
2. Set up service accounts and IAM permissions
3. Deploy Cloud Functions
4. Configure Firebase

## Infrastructure Components

### Cloud Functions
- `onConfigSetup`: Triggered when a new client configuration is created
- `onUserDelete`: Triggered when a user is deleted (cleanup)

### Service Account
- Creates a dedicated service account for VMHub operations
- Sets up necessary IAM bindings and permissions
- Manages access to GCP resources

### Resource Naming Convention
- Cloud Run Jobs: `vmhub-sync-{cnpj}-{environment}`
- Scheduler Jobs: `vmhub-sync-schedule-{cnpj}-{environment}`
- Service Account: `vmhub-sync-sa-{environment}`

## Development

### Local Development
1. Install dependencies:
```bash
cd functions
npm install
```

2. Run locally:
```bash
npm run serve
```

### Testing
```bash
npm run test
```

### Linting
```bash
npm run lint
```

## Troubleshooting

### Common Issues
1. **Authentication Errors**
   - Check service account permissions
   - Verify credential configuration

2. **Deployment Failures**
   - Ensure all required APIs are enabled
   - Check project quotas and limits

3. **Resource Creation Issues**
   - Verify naming conventions
   - Check resource quotas

## CI/CD
The project uses GitHub Actions for continuous integration. Workflow includes:
- Linting
- Testing
- Infrastructure validation
- Deployment to dev/prod environments

## Security Considerations
- Service account privileges follow the principle of least privilege
- Sensitive data is managed through environment variables
- Firestore security rules control access to client data

## Contributing
1. Create a feature branch
2. Make your changes
3. Submit a pull request
4. Ensure CI checks pass

## License
This project is proprietary and confidential.

---

Would you like me to expand on any section or add additional information?