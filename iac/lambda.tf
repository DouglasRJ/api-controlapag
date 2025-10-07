resource "aws_iam_role" "lambda_charge_creation_role" {
  name = "controlapag-api-lambda-charge-creation-role" 

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

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_charge_creation_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/charge-creation"
  output_path = "${path.module}/lambda/charge-creation.zip"
}

resource "aws_lambda_function" "charge_creation_lambda" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "controlapag-api-charge-creation"
  role             = aws_iam_role.lambda_charge_creation_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 30

  environment {
    variables = {
      INTERNAL_API_TOKEN = data.aws_secretsmanager_secret_version.internal_api_token.secret_string
      API_URL            = aws_apprunner_service.main.service_url
    }
  }

  depends_on = [aws_apprunner_service.main]
}

resource "aws_cloudwatch_event_rule" "daily_charge_creation_rule" {
  name                = "controlapag-api-daily-charge-creation"
  description         = "Triggers Lambda to create charges every day at midnight"
  schedule_expression = "cron(0 3 * * ? *)"
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