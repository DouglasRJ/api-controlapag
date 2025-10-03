output "ecr_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "load_balancer_dns" {
  value = aws_lb.main.dns_name
}