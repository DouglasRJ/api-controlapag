resource "aws_iam_role" "lambda_charge_creation_role" {
  name = "${var.project_name}-lambda-charge-creation-role"

  assume_role_policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda_charge_creation_role.id

  policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "secretsmanager:GetSecretValue"
        ],
        Resource = [aws_secretsmanager_secret.db_password.arn]
      },
      {
        Effect   = "Allow",
        Action   = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ],
        Resource = "*"
      }
    ]
  })
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/charge-creation" 
  output_path = "${path.module}/lambda/charge-creation.zip"
}

resource "aws_lambda_function" "charge_creation_lambda" {
  filename      = data.archive_file.lambda_zip.output_path
  function_name = "${var.project_name}-charge-creation"
  role          = aws_iam_role.lambda_charge_creation_role.arn
  handler       = "index.handler" 
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime       = "nodejs18.x"
  timeout       = 30

  vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      DB_HOST            = aws_db_instance.default.address
      DB_PORT            = tostring(aws_db_instance.default.port)
      DB_DATABASE        = local.db_name
      API_URL            = "http://${aws_lb.main.dns_name}" 
      INTERNAL_API_TOKEN = var.internal_api_token
    }
  }
}
# Security Group para a Lambda
resource "aws_security_group" "lambda_sg" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for charge creation Lambda"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "lambda_to_rds" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda_sg.id
  security_group_id        = aws_security_group.rds_sg.id
}


resource "aws_cloudwatch_event_rule" "daily_charge_creation_rule" {
  name                = "${var.project_name}-daily-charge-creation"
  description         = "Triggers Lambda to create charges every day at midnight"
  schedule_expression = "cron(0 0 * * ? *)"
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  rule = aws_cloudwatch_event_rule.daily_charge_creation_rule.name
  arn  = aws_lambda_function.charge_creation_lambda.arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.charge_creation_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_charge_creation_rule.arn
}