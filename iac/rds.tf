resource "aws_secretsmanager_secret" "db_password" {
  name = "controlapag-api-db-password"
}

resource "aws_secretsmanager_secret_version" "db_password_version" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "controlapag-api-jwt-secret"
}

resource "aws_secretsmanager_secret_version" "jwt_secret_version" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}

resource "aws_secretsmanager_secret" "internal_api_token" {
  name = "controlapag-api-internal-api-token"
}

resource "aws_secretsmanager_secret_version" "internal_api_token_version" {
  secret_id     = aws_secretsmanager_secret.internal_api_token.id
  secret_string = var.internal_api_token
}


resource "aws_db_instance" "default" {
  identifier           = "controlapag-db" 
  instance_class       = "db.t3.micro"
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15.12"
  username             = "postgres"
  password             = var.db_password
  db_subnet_group_name = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot  = true
}

resource "aws_db_subnet_group" "default" {
  name       = "controlapag-rds-subnet-group" 
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name = "controlapag-rds-subnet-group"
  }
}