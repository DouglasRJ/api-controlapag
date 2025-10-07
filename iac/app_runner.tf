data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
}

data "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id
}

data "aws_secretsmanager_secret_version" "internal_api_token" {
  secret_id = aws_secretsmanager_secret.internal_api_token.id
}

resource "aws_apprunner_service" "main" {
  service_name = "controlapag-api-service"

  source_configuration {
    image_repository {
      image_identifier      = aws_ecr_repository.api.repository_url
      image_repository_type = "ECR"
      image_configuration {
        port = "8080"
        runtime_environment_variables = {
          DB_HOST               = aws_db_instance.default.address
          DB_PORT               = tostring(aws_db_instance.default.port)
          DB_USERNAME           = aws_db_instance.default.username
          DB_DATABASE           = "controlapag-api"
          DB_PASSWORD           = data.aws_secretsmanager_secret_version.db_password.secret_string
          DB_AUTO_LOAD_ENTITIES = "1"

          JWT_SECRET     = data.aws_secretsmanager_secret_version.jwt_secret.secret_string
          JWT_EXPIRATION = "1d"

          S3_BUCKET           = var.s3_bucket
          S3_REGION           = var.aws_region
          DISABLE_MANAGE_FILE = "0"

          INTERNAL_API_TOKEN = data.aws_secretsmanager_secret_version.internal_api_token.secret_string

          NODE_ENV = "production"
        }
      }
    }
    auto_deployments_enabled = true
    authentication_configuration {
      access_role_arn = aws_iam_role.app_runner_ecr_access_role.arn
    }
  }

  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.main.arn
    }
  }

  instance_configuration {
    cpu    = "256"
    memory = "512"
  }
}

resource "aws_apprunner_vpc_connector" "main" {
  vpc_connector_name = "controlapag-vpc-connector"
  subnets            = module.vpc.private_subnets
  security_groups    = [aws_security_group.app_runner_sg.id]
}

resource "aws_ecr_repository" "api" {
  name                 = "controlapag-api/api"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_iam_role" "app_runner_ecr_access_role" {
  name = "controlapag-app-runner-ecr-role"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "build.apprunner.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "app_runner_ecr_access" {
  role       = aws_iam_role.app_runner_ecr_access_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}