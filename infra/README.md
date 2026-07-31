# FoodStra Infrastructure

Infrastructure-as-code, load testing, and backup/restore tooling for FoodStra.

## Layout

| Path | Purpose |
| --- | --- |
| `terraform/` | AWS stack: VPC, RDS MySQL 8.4, ElastiCache Redis 7, ECS Fargate API, ALB, ECR, Secrets Manager |
| `load/` | k6 load tests |
| `scripts/` | MySQL logical backup/restore |
| `../apps/api/Dockerfile` | Production API container image |

## Terraform

The stack is written to `terraform validate` cleanly without cloud credentials. It uses an
S3 remote-state backend configured per-environment at init time.

```bash
cd terraform
terraform fmt -recursive
terraform init -backend=false   # local validation only
terraform validate              # ✅ verified: "The configuration is valid."
```

### Applying to a real cloud (requires credentials)

Actual `terraform apply` is intentionally **not** run here — it needs real AWS access. To deploy:

1. **AWS credentials** with permissions for VPC, EC2, RDS, ElastiCache, ECS, ELB, ECR, IAM,
   Secrets Manager, CloudWatch Logs (e.g. an `AdministratorAccess`-scoped CI role, or a
   least-privilege policy covering those services).
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (or an assumed role / OIDC in CI).
2. **Remote state backend**: an S3 bucket + DynamoDB lock table.
   ```bash
   terraform init \
     -backend-config="bucket=foodstra-tfstate" \
     -backend-config="key=foodstra/${ENV}.tfstate" \
     -backend-config="region=us-east-1" \
     -backend-config="dynamodb_table=foodstra-tflock"
   ```
3. Build & push the API image to the created ECR repo, then set `-var api_image=<ecr-uri>:<tag>`.
4. `terraform plan -var environment=production` → review → `terraform apply`.

Outputs: `api_url`, `ecr_repository_url`, `mysql_endpoint`, `redis_endpoint`,
`database_url_secret_arn`.

## Load testing (k6)

```bash
# Point at a running API (local docker-compose or a deployed URL).
k6 run -e BASE_URL=http://localhost:4000 load/menu-search.js
```

### Local baseline (in-memory store, single Node process)

Ramp 0→200 VUs over 2m against `GET /api/v1/menu/search`:

| Metric | Value |
| --- | --- |
| Requests | 44,804 |
| Failures | **0 (0.00%)** |
| Throughput | ~373 req/s |
| Latency p95 | 705µs |
| Latency p99 | 1.57ms |
| Latency max | 11.26ms |

Thresholds (`http_req_failed<1%`, `p95<400ms`) **passed**. This is the read-path ceiling for a
single process on the dev box; production runs multiple Fargate tasks behind the ALB.

## Backup & restore

`scripts/backup.sh` / `scripts/restore.sh` wrap `mysqldump` (single-transaction, gzip) and are
configured via `MYSQL_*` env vars. Verified end-to-end against the docker-compose MySQL 8.4:
seeded `User` + `Restaurant` rows → backup → `DROP DATABASE` → restore → rows recovered with
foreign-key integrity intact.

```bash
MYSQL_HOST=127.0.0.1 MYSQL_USER=foodstra MYSQL_PASSWORD=foodstra MYSQL_DATABASE=foodstra \
  ./scripts/backup.sh ./backups
MYSQL_HOST=127.0.0.1 MYSQL_USER=foodstra MYSQL_PASSWORD=foodstra MYSQL_DATABASE=foodstra \
  ./scripts/restore.sh ./backups/foodstra-foodstra-<stamp>.sql.gz
```

Production RDS additionally uses automated snapshots (`backup_retention_period = 7`).
