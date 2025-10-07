resource "aws_security_group" "rds_sg" {
  name   = "controlapag-rds-sg"
  vpc_id = module.vpc.vpc_id
  tags   = { Name = "controlapag-rds-sg" }
}

resource "aws_security_group" "app_runner_sg" {
  name   = "controlapag-app-runner-sg"
  vpc_id = module.vpc.vpc_id
  tags   = { Name = "controlapag-app-runner-sg" }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "app_runner_to_rds" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.app_runner_sg.id
  security_group_id        = aws_security_group.rds_sg.id
}