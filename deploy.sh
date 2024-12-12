#!/bin/bash
set -e

# Define variables
ENVIRONMENT=$1
PROJECT_ID=$2
REGION=${3:-"us-central1"}

# Validate inputs
if [ -z "$ENVIRONMENT" ] || [ -z "$PROJECT_ID" ]; then
    echo "Usage: ./deploy.sh <environment> <project-id> [region]"
    echo "Example: ./deploy.sh dev semantc-ai-dev us-central1"
    exit 1
fi

# Validate environment
if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
    echo "Environment must be either 'dev' or 'prod'"
    exit 1
fi

echo "🚀 Starting deployment for $ENVIRONMENT environment"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"

# Create terraform.tfvars if it doesn't exist
cd environments/$ENVIRONMENT
if [ ! -f "terraform.tfvars" ]; then
    echo "Creating terraform.tfvars..."
    cat > terraform.tfvars << EOF
project_id = "$PROJECT_ID"
region = "$REGION"
example_cnpj = "48986168000144"  # Replace with your test CNPJ
container_image = "us-central1-docker.pkg.dev/$PROJECT_ID/vmhub-api/vmhub-sync:latest"
EOF
fi

# Initialize and apply Terraform
echo "🔧 Initializing Terraform..."
terraform init

echo "📋 Planning Terraform changes..."
terraform plan -out=tfplan

echo "🔨 Applying Terraform changes..."
terraform apply tfplan

echo "✅ Infrastructure deployment completed!"

# Deploy Cloud Functions (if they exist)
if [ -d "../../functions" ]; then
    echo "📦 Deploying Cloud Functions..."
    cd ../../functions
    npm install
    npm run build
    firebase use $PROJECT_ID
    firebase deploy --only functions
    echo "✅ Functions deployment completed!"
fi

echo "🎉 All deployments completed successfully!"