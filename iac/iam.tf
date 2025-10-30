resource "aws_iam_policy" "ecs_secrets_policy" {
  name        = "devcontrolapag-api-ecs-secrets-access-policy"
  description = "Allows ECS tasks to access specific secrets from Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_password.arn,
          aws_secretsmanager_secret.jwt_secret.arn,
          aws_secretsmanager_secret.internal_api_token.arn,
          aws_secretsmanager_secret.stripe_api_key.arn,
          aws_secretsmanager_secret.stripe_webhook_secret.arn
        ]
      }
    ]
  })
}

# IAM Policy para permitir envio de emails via SES
resource "aws_iam_policy" "ecs_ses_policy" {
  name        = "${var.project_name}-ecs-ses-policy"
  description = "Allows ECS tasks to send emails via SES"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:SendTemplatedEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_ses_attachment" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = aws_iam_policy.ecs_ses_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecs_secrets_attachment" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = aws_iam_policy.ecs_secrets_policy.arn
}