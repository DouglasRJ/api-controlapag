variable "aws_region" {
  type        = string
  default     = "sa-east-1"
}

variable "db_password" {
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  type        = string
  sensitive   = true
}

variable "internal_api_token" {
  type        = string
  sensitive   = true
}

variable "s3_bucket" {
  type        = string
}