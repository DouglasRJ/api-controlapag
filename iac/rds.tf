locals {
  db_name = replace(var.project_name, "-", "")
}

resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.project_name}-db-password"
}

resource "aws_secretsmanager_secret_version" "db_password_version" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

resource "aws_db_subnet_group" "default" {
  name       = "${var.project_name}-rds-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name = "${var.project_name}-rds-subnet-group"
  }
}

resource "aws_db_instance" "default" {
  identifier             = "${var.project_name}-db"
  instance_class         = var.db_instance_class
  allocated_storage      = 20
  engine                 = "postgres"
  engine_version         = "15.12"
  username               = "postgres"
  password               = aws_secretsmanager_secret_version.db_password_version.secret_string
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true
  db_name                = local.db_name
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "${var.project_name}-jwt-secret"
}

resource "aws_secretsmanager_secret_version" "jwt_secret_version" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}

resource "aws_secretsmanager_secret" "internal_api_token" {
  name = "${var.project_name}-internal-api-token"
}

resource "aws_secretsmanager_secret_version" "internal_api_token_version" {
  secret_id     = aws_secretsmanager_secret.internal_api_token.id
  secret_string = var.internal_api_token
}

resource "aws_secretsmanager_secret" "stripe_api_key" {
  name                    = "${var.project_name}-stripe-api-key"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "stripe_api_key_version" {
  secret_id     = aws_secretsmanager_secret.stripe_api_key.id
  secret_string = var.stripe_api_key
}

resource "aws_secretsmanager_secret" "stripe_webhook_secret" {
  name                    = "${var.project_name}-stripe-webhook-secret"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "stripe_webhook_secret_version" {
  secret_id     = aws_secretsmanager_secret.stripe_webhook_secret.id
  secret_string = var.stripe_webhook_secret
}

resource "aws_secretsmanager_secret" "stripe_platform_webhook_secret" {
  name                    = "${var.project_name}-stripe-platform-webhook-secret"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "stripe_platform_webhook_secret_version" {
  secret_id     = aws_secretsmanager_secret.stripe_platform_webhook_secret.id
  secret_string = var.stripe_platform_webhook_secret
}