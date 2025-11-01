variable "aws_region" {
  type = string
}

variable "project_name" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "db_instance_class" {
  type = string
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "jwt_expiration" {
  type    = string
  default = "1d"
}

variable "s3_bucket" {
  type = string
}

variable "disable_manage_file" {
  type    = string
  default = "0"
}

variable "internal_api_token" {
  type      = string
  sensitive = true
}

variable "ecs_cpu" {
  type = string
}

variable "ecs_memory" {
  type = string
}

variable "stripe_api_key" {
  type      = string
  sensitive = true
}

variable "stripe_webhook_secret" {
  type      = string
  sensitive = true
}

variable "stripe_platform_webhook_secret" {
  type      = string
  sensitive = true
}

variable "stripe_id_plan" {
  type = string
}

variable "platform_fee_percentage" {
  type = string
}

variable "stripe_onboarding_refresh_url" {
  type = string
}

variable "stripe_onboarding_return_url" {
  type = string
}

# SES Variables
variable "ses_domain" {
  type        = string
  description = "Domínio verificado no SES (deixe vazio se não usar domínio customizado)"
  default     = ""
}

variable "ses_verified_email" {
  type        = string
  description = "Email verificado no SES para uso em sandbox (deixe vazio em produção)"
  default     = ""
}

variable "route53_zone_id" {
  type        = string
  description = "Zone ID do Route53 para configurar registros DNS do SES (deixe vazio se não usar)"
  default     = ""
}

variable "default_from_email" {
  type        = string
  description = "Email padrão para envio de emails via SES"
}

variable "frontend_base_url" {
  type        = string
  description = "URL base do frontend para links em emails"
}

# Twilio Variables (optional)
variable "twilio_account_sid" {
  type        = string
  description = "Twilio Account SID para envio de WhatsApp"
  default     = ""
  sensitive   = true
}

variable "twilio_auth_token" {
  type        = string
  description = "Twilio Auth Token"
  default     = ""
  sensitive   = true
}

variable "twilio_whatsapp_from" {
  type        = string
  description = "Número do WhatsApp no formato whatsapp:+xxx"
  default     = ""
}

variable "twilio_password_setup_template_sid" {
  type        = string
  description = "Template SID do Twilio para setup de senha"
  default     = ""
}