output "ecr_repository_url" {
  value       = aws_ecr_repository.api.repository_url
}

output "app_runner_service_url" {
  value       = "https://${aws_apprunner_service.main.service_url}"
}