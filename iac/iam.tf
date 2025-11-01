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
          aws_secretsmanager_secret.stripe_webhook_secret.arn,
          aws_secretsmanager_secret.stripe_platform_webhook_secret.arn
        ]
      }
    ]
  })
}


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

# IAM Policy para permitir acesso ao S3
resource "aws_iam_policy" "ecs_s3_policy" {
  name        = "${var.project_name}-ecs-s3-policy"
  description = "Allows ECS tasks to access S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "arn:aws:s3:::${var.s3_bucket}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = "arn:aws:s3:::${var.s3_bucket}"
      }
    ]
  })
}


resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}


resource "aws_iam_role_policy_attachment" "ecs_task_ses_attachment" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_ses_policy.arn
}

# Anexar policy S3 ao task role
resource "aws_iam_role_policy_attachment" "ecs_task_s3_attachment" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_s3_policy.arn
}


# Secrets ficam no execution role
resource "aws_iam_role_policy_attachment" "ecs_secrets_attachment" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = aws_iam_policy.ecs_secrets_policy.arn
}