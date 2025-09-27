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
  identifier           = "${var.project_name}-db"
  instance_class       = var.db_instance_class
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15.7"
  username             = "postgres"
  password             = aws_secretsmanager_secret_version.db_password_version.secret_string
  db_subnet_group_name = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot  = true # Em produção, mude para 'false'
}