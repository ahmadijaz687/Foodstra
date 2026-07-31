resource "random_password" "db" {
  length  = 32
  special = false
}

resource "aws_db_subnet_group" "main" {
  name       = "${local.name}-db"
  subnet_ids = aws_subnet.private[*].id
  tags       = { Name = "${local.name}-db-subnets" }
}

resource "aws_db_instance" "mysql" {
  identifier                = "${local.name}-mysql"
  engine                    = "mysql"
  engine_version            = "8.4"
  instance_class            = var.db_instance_class
  allocated_storage         = 50
  max_allocated_storage     = 200
  storage_type              = "gp3"
  storage_encrypted         = true
  db_name                   = "foodstra"
  username                  = var.db_username
  password                  = random_password.db.result
  db_subnet_group_name      = aws_db_subnet_group.main.name
  vpc_security_group_ids    = [aws_security_group.data.id]
  multi_az                  = var.environment == "production"
  backup_retention_period   = 7
  backup_window             = "03:00-04:00"
  maintenance_window        = "sun:04:00-sun:05:00"
  deletion_protection       = var.environment == "production"
  skip_final_snapshot       = var.environment != "production"
  final_snapshot_identifier = "${local.name}-mysql-final"
  apply_immediately         = false

  tags = { Name = "${local.name}-mysql" }
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "${local.name}-redis"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.name}-redis"
  description                = "FoodStra Redis (cache, sessions, rate limits)"
  engine                     = "redis"
  engine_version             = "7.1"
  node_type                  = var.redis_node_type
  num_cache_clusters         = var.environment == "production" ? 2 : 1
  automatic_failover_enabled = var.environment == "production"
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.data.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = { Name = "${local.name}-redis" }
}

resource "aws_secretsmanager_secret" "db_url" {
  name = "${local.name}/DATABASE_URL"
  tags = { Name = "${local.name}-db-url" }
}

resource "aws_secretsmanager_secret_version" "db_url" {
  secret_id = aws_secretsmanager_secret.db_url.id
  secret_string = format(
    "mysql://%s:%s@%s/foodstra",
    var.db_username,
    random_password.db.result,
    aws_db_instance.mysql.endpoint,
  )
}
