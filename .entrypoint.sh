#!/bin/sh
set -e

TOKEN=$(curl -s -X PUT "http://169.254.170.2/v2/credentials" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
ACCESS_KEY=$(echo $TOKEN | jq -r .AccessKeyId)
SECRET_KEY=$(echo $TOKEN | jq -r .SecretAccessKey)
SESSION_TOKEN=$(echo $TOKEN | jq -r .Token)

export AWS_ACCESS_KEY_ID=$ACCESS_KEY
export AWS_SECRET_ACCESS_KEY=$SECRET_KEY
export AWS_SESSION_TOKEN=$SESSION_TOKEN

PUBLIC_IP=$(curl -s http://169.254.170.2/v4/metadata | jq -r '.Containers[0].Networks[0].IPv4Addresses[0]')

echo "Updating Parameter Store with Public IP: $PUBLIC_IP"
aws ssm put-parameter --name "/${PROJECT_NAME}/api/public_ip" --value "$PUBLIC_IP" --type "String" --overwrite --region ${AWS_REGION}

echo "Starting Node application..."
node dist/main