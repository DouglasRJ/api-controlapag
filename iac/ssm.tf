resource "aws_ssm_parameter" "api_public_ip" {
  name  = "/${var.project_name}/api/public_ip"
  type  = "String"
  value = "not-set" 
}

resource "aws_iam_role_policy" "ecs_ssm_policy" {
  name = "${var.project_name}-ecs-ssm-policy"
  role = aws_iam_role.ecs_task_execution_role.id

  policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "ssm:PutParameter"
        ],
        Resource = aws_ssm_parameter.api_public_ip.arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_ssm_policy" {
  name = "${var.project_name}-lambda-ssm-policy"
  role = aws_iam_role.lambda_charge_creation_role.id

  policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "ssm:GetParameter"
        ],
        Resource = aws_ssm_parameter.api_public_ip.arn
      }
    ]
  })
}