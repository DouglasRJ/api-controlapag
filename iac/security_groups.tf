resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-rds-sg"
  vpc_id      = module.vpc.vpc_id

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}

resource "aws_security_group" "ecs_service_sg" {
  name        = "${var.project_name}-ecs-service-sg"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ecs-service-sg"
  }
}

resource "aws_security_group_rule" "app_to_rds" {
  type                     = "ingress"
  from_port                = 5432 
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs_service_sg.id
  security_group_id        = aws_security_group.rds_sg.id
}