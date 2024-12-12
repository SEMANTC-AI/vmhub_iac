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