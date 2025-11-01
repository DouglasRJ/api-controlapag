resource "aws_ecr_repository" "api" {
  name                 = "${var.project_name}/api"
  force_delete         = true
  image_tag_mutability = "MUTABLE"
}

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
}

resource "aws_security_group" "lb_sg" {
  name   = "${var.project_name}-lb-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "main" {
  name               = "${var.project_name}-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb_sg.id]
  subnets            = module.vpc.public_subnets
}

resource "aws_lb_target_group" "api" {
  name        = "${var.project_name}-api-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path = "/"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project_name}-ecs-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
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
  task_role_arn            = aws_iam_role.ecs_task_role.arn

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
      {
        name      = "DB_PASSWORD"
        valueFrom = aws_secretsmanager_secret.db_password.arn
      },
      {
        name      = "JWT_SECRET"
        valueFrom = aws_secretsmanager_secret.jwt_secret.arn
      },
      {
        name      = "INTERNAL_API_TOKEN"
        valueFrom = aws_secretsmanager_secret.internal_api_token.arn
      },
      {
        name      = "STRIPE_API_KEY"
        valueFrom = aws_secretsmanager_secret.stripe_api_key.arn
      },
      {
        name      = "STRIPE_WEBHOOK_SECRET"
        valueFrom = aws_secretsmanager_secret.stripe_webhook_secret.arn
      },
      {
        name      = "STRIPE_PLATFORM_WEBHOOK_SECRET"
        valueFrom = aws_secretsmanager_secret.stripe_platform_webhook_secret.arn
      }
    ]
    environment = [
      { name = "DB_HOST", value = aws_db_instance.default.address },
      { name = "DB_PORT", value = tostring(aws_db_instance.default.port) },
      { name = "DB_USERNAME", value = aws_db_instance.default.username },
      { name = "DB_DATABASE", value = local.db_name },
      { name = "DB_TYPE", value = "postgres" },
      { name = "DB_AUTO_LOAD_ENTITIES", value = "1" },
      { name = "DB_SYNCHRONIZE", value = "false" }, # Geralmente false em produção
      { name = "PORT", value = "3000" },
      { name = "NODE_ENV", value = "production" },
      { name = "JWT_EXPIRATION", value = var.jwt_expiration },
      { name = "S3_BUCKET", value = var.s3_bucket },
      { name = "S3_REGION", value = var.aws_region },
      { name = "DISABLE_MANAGE_FILE", value = var.disable_manage_file },
      { name = "STRIPE_ID_PLAN", value = var.stripe_id_plan },
      { name = "PLATFORM_FEE_PERCENTAGE", value = var.platform_fee_percentage },
      { name = "STRIPE_ONBOARDING_REFRESH_URL", value = var.stripe_onboarding_refresh_url },
      { name = "STRIPE_ONBOARDING_RETURN_URL", value = var.stripe_onboarding_return_url },
      { name = "DEFAULT_FROM_EMAIL", value = var.default_from_email },
      { name = "FRONTEND_BASE_URL", value = var.frontend_base_url },
      { name = "TWILIO_ACCOUNT_SID", value = var.twilio_account_sid },
      { name = "TWILIO_AUTH_TOKEN", value = var.twilio_auth_token },
      { name = "TWILIO_WHATSAPP_FROM", value = var.twilio_whatsapp_from },
      { name = "TWILIO_PASSWORD_SETUP_TEMPLATE_SID", value = var.twilio_password_setup_template_sid }
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

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api-container"
    container_port   = 3000
  }

  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [aws_security_group.ecs_service_sg.id]
  }
}

resource "aws_cloudwatch_log_group" "api" {
  name = "/ecs/${var.project_name}-api"
}