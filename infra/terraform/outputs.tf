output "api_url" {
  description = "Public HTTP endpoint for the API (front with HTTPS/ACM in production)."
  value       = "http://${aws_lb.main.dns_name}"
}

output "ecr_repository_url" {
  description = "Push API images here, then set var.api_image to the tagged URI."
  value       = aws_ecr_repository.api.repository_url
}

output "mysql_endpoint" {
  description = "RDS MySQL endpoint (host:port)."
  value       = aws_db_instance.mysql.endpoint
}

output "redis_endpoint" {
  description = "ElastiCache Redis primary endpoint."
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "database_url_secret_arn" {
  description = "Secrets Manager ARN holding the assembled DATABASE_URL."
  value       = aws_secretsmanager_secret.db_url.arn
}
