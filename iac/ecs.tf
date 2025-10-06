# iac/ecs.tf

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project_name}-api-task"
  cpu                      = var.ecs_cpu
  memory                   = var.ecs_memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_execution_role.arn # Importante manter isso

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  /*
  container_definitions = jsonencode([{
    # ... SUA DEFINIÇÃO ORIGINAL FICA COMENTADA AQUI ...
  }])
  */

  # --- DEFINIÇÃO DE DIAGNÓSTICO TEMPORÁRIA ---
  container_definitions = jsonencode([{
    name      = "debug-container"
    image     = "amazon/aws-cli:latest"
    essential = true
    command   = ["sts", "get-caller-identity"]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.project_name}-api"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs-debug"
      }
    }
  }])

  tags = {
    ForceUpdate = "debug-session-1"
  }
}