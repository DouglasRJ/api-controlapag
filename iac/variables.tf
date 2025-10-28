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

variable "jwt_secret" {
  type        = string
  sensitive   = true
}

variable "jwt_expiration" {
  type        = string
  default     = "1d"
}

variable "s3_bucket" {
  type        = string
}

variable "disable_manage_file" {
  type        = string
  default     = "0" 
}

variable "internal_api_token" {
  type        = string
  sensitive   = true
}

variable "ecs_cpu" {
  type        = string
}

variable "ecs_memory" {
  type        = string
}

variable "stripe_api_key" {
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  type        = string
  sensitive   = true
}

variable "stripe_id_plan" {
  type        = string
}

variable "platform_fee_percentage" {
  type        = string
}

variable "stripe_onboarding_refresh_url" {
  type        = string
}

variable "stripe_onboarding_return_url" {
  type        = string
}