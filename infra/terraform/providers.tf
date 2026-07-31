terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Remote state is configured per-environment via `terraform init -backend-config=...`.
  # Left partial here so `validate`/`plan` work without cloud credentials.
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "FoodStra"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
