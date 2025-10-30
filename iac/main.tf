terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.95.0, < 6.0.0"
    }
  }

  backend "s3" {
    key = "controlapag/dev/terraform.tfstate"
  }
}

provider "aws" {
  region = var.aws_region
}
