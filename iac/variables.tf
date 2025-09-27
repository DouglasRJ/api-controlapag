variable "aws_region" {
  type        = string
}

variable "project_name" {
  type        = string
}

variable "db_password" {
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  type        = string
}

variable "ecs_cpu" {
  type        = string
}

variable "ecs_memory" {
  type        = string
}