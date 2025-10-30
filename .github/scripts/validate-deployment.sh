#!/bin/bash

set -e

echo "🔍 Starting deployment validation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check if a variable is set
check_var() {
    local var_name=$1
    local var_value=$2
    local is_required=${3:-true}

    if [ -z "$var_value" ]; then
        if [ "$is_required" = true ]; then
            echo -e "${RED}❌ ERROR: Required variable $var_name is not set${NC}"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "${YELLOW}⚠️  WARNING: Optional variable $var_name is not set${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${GREEN}✅ $var_name is set${NC}"
    fi
}

echo ""
echo "📋 Checking required AWS credentials..."
check_var "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"
check_var "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"
check_var "AWS_REGION" "$AWS_REGION"

echo ""
echo "📋 Checking required Terraform variables..."
check_var "TF_VAR_db_password" "$TF_VAR_db_password"
check_var "TF_VAR_jwt_secret" "$TF_VAR_jwt_secret"
check_var "TF_VAR_internal_api_token" "$TF_VAR_internal_api_token"
check_var "TF_VAR_s3_bucket" "$TF_VAR_s3_bucket"
check_var "TF_VAR_default_from_email" "$TF_VAR_default_from_email"
check_var "TF_VAR_frontend_base_url" "$TF_VAR_frontend_base_url"

echo ""
echo "📋 Checking Stripe configuration..."
check_var "TF_VAR_stripe_api_key" "$TF_VAR_stripe_api_key"
check_var "TF_VAR_stripe_webhook_secret" "$TF_VAR_stripe_webhook_secret"
check_var "TF_VAR_stripe_id_plan" "$TF_VAR_stripe_id_plan"
check_var "TF_VAR_platform_fee_percentage" "$TF_VAR_platform_fee_percentage"
check_var "TF_VAR_stripe_onboarding_refresh_url" "$TF_VAR_stripe_onboarding_refresh_url"
check_var "TF_VAR_stripe_onboarding_return_url" "$TF_VAR_stripe_onboarding_return_url"

echo ""
echo "📋 Checking SES configuration..."
check_var "TF_VAR_ses_domain" "$TF_VAR_ses_domain" false
check_var "TF_VAR_ses_verified_email" "$TF_VAR_ses_verified_email" false

echo ""
echo "📋 Checking Twilio configuration (optional)..."
check_var "TF_VAR_twilio_account_sid" "$TF_VAR_twilio_account_sid" false
check_var "TF_VAR_twilio_auth_token" "$TF_VAR_twilio_auth_token" false
check_var "TF_VAR_twilio_whatsapp_from" "$TF_VAR_twilio_whatsapp_from" false

echo ""
echo "📋 Validating IAM policies in Terraform files..."

# Check if task role exists
if ! grep -q "resource \"aws_iam_role\" \"ecs_task_role\"" iac/iam.tf; then
    echo -e "${RED}❌ ERROR: ECS task role not found in iac/iam.tf${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ ECS task role found${NC}"
fi

# Check if SES policy exists
if ! grep -q "resource \"aws_iam_policy\" \"ecs_ses_policy\"" iac/iam.tf; then
    echo -e "${RED}❌ ERROR: SES policy not found in iac/iam.tf${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ SES policy found${NC}"
fi

# Check if S3 policy exists
if ! grep -q "resource \"aws_iam_policy\" \"ecs_s3_policy\"" iac/iam.tf; then
    echo -e "${RED}❌ ERROR: S3 policy not found in iac/iam.tf${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ S3 policy found${NC}"
fi

# Check if task_role_arn is set in ECS task definition
if ! grep -q "task_role_arn.*=.*aws_iam_role.ecs_task_role.arn" iac/ecs.tf; then
    echo -e "${RED}❌ ERROR: task_role_arn not set in ECS task definition${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ task_role_arn is properly set${NC}"
fi

# Check if SES permissions are attached to task role (not execution role)
if grep -q "ecs_task_ses_attachment" iac/iam.tf && \
   grep -q "role.*=.*aws_iam_role.ecs_task_role.name" iac/iam.tf; then
    echo -e "${GREEN}✅ SES permissions attached to task role${NC}"
else
    echo -e "${RED}❌ ERROR: SES permissions not properly attached to task role${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "📋 Checking critical files..."
REQUIRED_FILES=(
    "iac/main.tf"
    "iac/iam.tf"
    "iac/ecs.tf"
    "iac/variables.tf"
    "src/common/email/ses-email.service.ts"
    "src/common/email/ses-email.module.ts"
    "Dockerfile"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${RED}❌ ERROR: Required file $file not found${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "=========================================="
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Validation FAILED with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Validation PASSED with $WARNINGS warning(s)${NC}"
    exit 0
else
    echo -e "${GREEN}✅ All validations PASSED!${NC}"
    exit 0
fi
