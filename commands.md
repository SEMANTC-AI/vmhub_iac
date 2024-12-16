# first, deploy firebase functions
firebase deploy --only functions

# then, deploy terraform infrastructure
cd terraform
terraform plan    # Review the changes
terraform apply   # Apply the changes

# check firebase functions
firebase functions:log

# check terraform state
terraform show






# Make the script executable first
chmod +x deploy.sh

# Run the deployment
./deploy.sh dev semantc-ai us-central1 fernando@abcdataz.com

npm run lint:fix 