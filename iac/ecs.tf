resource "aws_ecr_repository" "api" {
  name                 = "${var.project_name}/api"
  force_delete         = true
  image_tag_mutability = "MUTABLE"
}

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project_name}-ecs-execution-role"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project_name}-api-task"
  cpu                      = var.ecs_cpu
  memory                   = var.ecs_memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

 task_role_arn            = aws_iam_role.ecs_task_execution_role.arn
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([{
    name      = "api-container"
    image     = aws_ecr_repository.api.repository_url
    cpu       = tonumber(var.ecs_cpu)
    memory    = tonumber(var.ecs_memory)
    essential = true
    portMappings = [{
      containerPort = 3000
      hostPort      = 3000
    }]
    secrets = [
      { name = "DB_PASSWORD", valueFrom = aws_secretsmanager_secret.db_password.arn },
      { name = "JWT_SECRET", valueFrom = aws_secretsmanager_secret.jwt_secret.arn },
      { name = "INTERNAL_API_TOKEN", valueFrom = aws_secretsmanager_secret.internal_api_token.arn }
    ]
    environment = [
      { name = "DB_HOST", value = aws_db_instance.default.address },
      { name = "DB_PORT", value = tostring(aws_db_instance.default.port) },
      { name = "DB_USERNAME", value = aws_db_instance.default.username },
      { name = "DB_DATABASE", value = var.project_name },
      { name = "DB_TYPE", value = "postgres" },
      { name = "DB_AUTO_LOAD_ENTITIES", value = "1" },
      { name = "DB_SYNCHRONIZE", value = "false" },
      { name = "PORT", value = "3000" },
      { name = "NODE_ENV", value = "production" },
      { name = "JWT_EXPIRATION", value = var.jwt_expiration },
      { name = "S3_BUCKET", value = var.s3_bucket },
      { name = "S3_REGION", value = var.aws_region },
      { name = "DISABLE_MANAGE_FILE", value = var.disable_manage_file },
      { name = "PROJECT_NAME", value = var.project_name },
      { name = "AWS_REGION", value = var.aws_region }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.project_name}-api"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "main" {
  name            = "${var.project_name}-api-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = module.vpc.public_subnets
    security_groups = [aws_security_group.ecs_service_sg.id]
    assign_public_ip = true
  }
}

resource "aws_cloudwatch_log_group" "api" {
  name = "/ecs/${var.project_name}-api"
}