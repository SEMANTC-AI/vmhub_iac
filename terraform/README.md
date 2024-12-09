# VMHub Data Sync Infrastructure 🔄

## Overview 🎯
Cloud infrastructure for synchronizing VMHub data with BigQuery, enabling automated messaging through WhatsApp Business API.

## Architecture 🏗️

```
User → Firebase Auth → Firestore → Cloud Run Job → BigQuery
                                             ├─→ Cloud Storage
                                             └─→ WhatsApp API
```

## Project Structure 📁
```
terraform/
├── environments/          
│   ├── dev/              # Development configs
│   └── prod/             # Production configs
├── modules/              
│   ├── service-account/  # Main service account
│   ├── sync-job/         # Per-CNPJ resources
│   └── base-infrastructure/  # Project-level setup
```

## Resources Per CNPJ 📦

| Resource Type      | Naming Pattern           | Purpose                    |
|-------------------|-------------------------|----------------------------|
| Cloud Run Job     | `vmhub-sync-{cnpj}`    | Data synchronization      |
| Storage Bucket    | `vmhub-data-{cnpj}`    | Raw data storage          |
| BigQuery Dataset  | `CNPJ_{cnpj}_RAW`      | Data warehouse            |
| Cloud Scheduler   | `vmhub-sync-{cnpj}`    | Automated sync triggers   |

## Setup Steps 🚀

1. **Prerequisites**
   - Terraform ≥ 1.0.0
   - Google Cloud SDK
   - Firebase project
   - GCP permissions

2. **Initialize**
   ```bash
   cd environments/dev  # or prod
   terraform init
   ```

3. **Deploy**
   ```bash
   terraform plan
   terraform apply
   ```

## Security 🔒

- ✅ Tokens stored in Firestore
- ✅ Least-privilege access
- ✅ Regular security audits
- ✅ Automated monitoring

## Development Workflow 👨‍💻

1. Branch → `feature/your-feature`
2. Test → Dev environment
3. PR → Code review
4. Merge → Main branch

## Contact 📧

For support or questions, contact the infrastructure team.

---
Built with ❤️ using Terraform and Google Cloud Platform