#!/bin/bash
set -e

# Define variables
ENVIRONMENT=$1
PROJECT_ID=$2
REGION=${3:-"us-central1"}

# Validate inputs
if [ -z "$ENVIRONMENT" ] || [ -z "$PROJECT_ID" ]; then
    echo "Usage: ./deploy.sh <environment> <project-id> [region]"
    echo "Example: ./deploy.sh dev semantc-ai us-central1"
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

# Deploy infrastructure first
cd environments/$ENVIRONMENT

# Create terraform.tfvars if it doesn't exist
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

# Deploy Cloud Functions
echo "📦 Deploying Cloud Functions..."
cd ../../functions

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in functions directory"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build TypeScript files
echo "Building functions..."
npm run build || {
    echo "❌ Build failed. Check your TypeScript configuration."
    exit 1
}

# Initialize Firebase if needed
if ! firebase projects:list | grep -q "$PROJECT_ID"; then
    echo "Initializing Firebase..."
    firebase use "$PROJECT_ID"
fi

# Deploy functions
echo "Deploying functions to Firebase..."
firebase deploy --only functions --project "$PROJECT_ID"

echo "✅ Functions deployment completed!"
echo "🎉 All deployments completed successfully!"