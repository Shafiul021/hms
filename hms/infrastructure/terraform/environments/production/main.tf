terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "production"
}

# VPC Configuration
resource "aws_vpc" "hms_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "hms-${var.environment}-vpc"
  }
}

# Public Subnets
resource "aws_subnet" "public_1" {
  vpc_id            = aws_vpc.hms_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  tags = {
    Name = "hms-${var.environment}-public-1"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id            = aws_vpc.hms_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"
  tags = {
    Name = "hms-${var.environment}-public-2"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.hms_vpc.id
  tags = {
    Name = "hms-${var.environment}-igw"
  }
}

# Route Table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.hms_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = {
    Name = "hms-${var.environment}-public-rt"
  }
}

resource "aws_route_table_association" "pub_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "pub_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public_rt.id
}

# Security Groups
resource "aws_security_group" "web_sg" {
  name        = "hms-${var.environment}-web-sg"
  description = "Allow HTTP/HTTPS traffic"
  vpc_id      = aws_vpc.hms_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "db_sg" {
  name        = "hms-${var.environment}-db-sg"
  description = "Allow MySQL traffic from Web SG"
  vpc_id      = aws_vpc.hms_vpc.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# EC2 Instance for Web/App
resource "aws_instance" "web_app" {
  ami           = "ami-0c7217cdde317cfec" # Ubuntu 22.04 LTS standard in us-east-1
  instance_type = "t3.medium"             # Production tier instance
  subnet_id     = aws_subnet.public_1.id
  vpc_security_group_ids = [
    aws_security_group.web_sg.id
  ]
  associate_public_ip_address = true
  key_name                    = "hms-prod-key"

  tags = {
    Name = "hms-${var.environment}-web-app"
  }
}

# Subnet Group for RDS
resource "aws_db_subnet_group" "db_subnets" {
  name       = "hms-${var.environment}-db-subnets"
  subnet_ids = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

# RDS Managed Database (MySQL)
resource "aws_db_instance" "mysql" {
  allocated_storage      = 20
  max_allocated_storage  = 100
  db_name                = "hms"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.medium"
  username               = "hms_admin"
  password               = "secureproductionpassword123" # Replace with secret manager
  db_subnet_group_name   = aws_db_subnet_group.db_subnets.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  skip_final_snapshot    = true
  multi_az               = true

  tags = {
    Name = "hms-${var.environment}-db"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "redis_subnets" {
  name       = "hms-${var.environment}-redis-subnets"
  subnet_ids = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "hms-${var.environment}-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnets.name
  security_group_ids   = [aws_security_group.db_sg.id] # Same security rules as DB access
}

# Output IPs and Connection Strings
output "web_app_public_ip" {
  value = aws_instance.web_app.public_ip
}

output "db_endpoint" {
  value = aws_db_instance.mysql.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].address
}
