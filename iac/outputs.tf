output "ecr_repository_url" {
  value       = aws_ecr_repository.api.repository_url
}

output "load_balancer_dns" {
  value       = var.create_costly_network_resources ? aws_lb.main[0].dns_name : "Load Balancer nao foi criado neste ambiente."
}