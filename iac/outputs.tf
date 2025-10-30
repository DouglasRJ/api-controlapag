output "ecr_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "load_balancer_dns" {
  value = aws_lb.main.dns_name
}

# SES Outputs
output "ses_domain_identity_arn" {
  description = "ARN do domínio verificado no SES"
  value       = var.ses_domain != "" ? aws_ses_domain_identity.main[0].arn : null
}

output "ses_domain_verification_token" {
  description = "Token de verificação do domínio SES"
  value       = var.ses_domain != "" ? aws_ses_domain_identity.main[0].verification_token : null
}

output "ses_dkim_tokens" {
  description = "Tokens DKIM para configuração DNS"
  value       = var.ses_domain != "" ? aws_ses_domain_dkim.main[0].dkim_tokens : []
}

output "ses_configuration_set_name" {
  description = "Nome do configuration set do SES"
  value       = aws_ses_configuration_set.main.name
}