terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}



provider "aws" {
  region = "ap-southeast-1"
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
}

# NAT Gateway Elastic IP
resource "aws_eip" "nat_eip" {
  vpc = true
}

# Public Subnet
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  map_public_ip_on_launch = true
}

# Private Subnet
resource "aws_subnet" "private_subnet" {
  vpc_id     = aws_vpc.main.id
  cidr_block = var.private_subnet_cidr
}

# Internet Gateway for Public Subnet
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
}

# NAT Gateway
resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_subnet.id

  depends_on = [aws_internet_gateway.igw]
}


# Public Route Table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route" "public_route" {
  route_table_id         = aws_route_table.public_rt.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

# Private Route Table
resource "aws_route_table" "private_route_table" {
  vpc_id = aws_vpc.main.id
}

# Route for internet-bound traffic through the NAT Gateway
resource "aws_route" "private_route" {
  route_table_id         = aws_route_table.private_route_table.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat.id
}


resource "aws_route_table_association" "public_rt_assoc" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "private_subnet_association" {
  subnet_id      = aws_subnet.private_subnet.id
  route_table_id = aws_route_table.private_route_table.id
}


# Security Group for Public Subnet (Nginx)
resource "aws_security_group" "public_sg" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
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

# Security Group for Private Subnet (Kubernetes, DB)
resource "aws_security_group" "private_sg" {
  vpc_id = aws_vpc.main.id

  # Allow SSH from the public subnet
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_subnet.public_subnet.cidr_block]
  }

  # Allow MongoDB (port 27017) access within the VPC
  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Allow PostgreSQL (port 5432) access within the VPC
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Allow Kubernetes API server (port 6443) access within the VPC
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Allow Kubelet API (port 10250) access within the VPC
  ingress {
    from_port   = 10250
    to_port     = 10250
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Allow kube-scheduler (port 10251) access within the VPC
  ingress {
    from_port   = 10251
    to_port     = 10251
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Allow kube-controller-manager (port 10252) access within the VPC
  ingress {
    from_port   = 10252
    to_port     = 10252
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Allow Flannel VXLAN (port 8472) access within the VPC
  ingress {
    from_port   = 8472
    to_port     = 8472
    protocol    = "udp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Allow NodePort range for Kubernetes services (30000-32767)
  ingress {
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Egress - allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}



# Generate SSH Key Pair Locally
resource "tls_private_key" "my_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated_key" {
  key_name   = "vpc-generated-key-4"
  public_key = tls_private_key.my_key.public_key_openssh
}

# Nginx EC2 Instance in Public Subnet (t2.medium, 8 GB EBS)
resource "aws_instance" "nginx" {
  ami                    = "ami-02da9706e7051f070" # Amazon Linux 2 AMI
  instance_type          = "t2.medium"
  subnet_id              = aws_subnet.public_subnet.id
  key_name               = aws_key_pair.generated_key.key_name
  vpc_security_group_ids = [aws_security_group.public_sg.id]

  tags = {
    Name        = "nginx-server"
    Environment = "production"
    Role        = "web-server"
  }

  root_block_device {
    volume_size = 8 # 8 GB storage
  }

  user_data = <<-EOF
              #!/bin/bash
              sudo yum update -y
              sudo amazon-linux-extras install nginx1 -y
              sudo systemctl start nginx
              sudo systemctl enable nginx
              EOF
}

# Kubernetes Master Node in Private Subnet (t2.medium, 16 GB EBS)
resource "aws_instance" "k8s_master" {
  ami                    = "ami-02da9706e7051f070"
  instance_type          = "t2.medium"
  subnet_id              = aws_subnet.private_subnet.id
  key_name               = aws_key_pair.generated_key.key_name
  vpc_security_group_ids = [aws_security_group.private_sg.id]

  tags = {
    Name        = "kubernetes-master"
    Environment = "production"
    Role        = "kubernetes-master"
  }

  root_block_device {
    volume_size = 16 # 16 GB storage
  }
}

# Kubernetes Worker Nodes (2) in Private Subnet (t2.large, 24 GB EBS)
resource "aws_instance" "k8s_worker1" {
  ami                    = "ami-02da9706e7051f070"
  instance_type          = "t2.large"
  subnet_id              = aws_subnet.private_subnet.id
  key_name               = aws_key_pair.generated_key.key_name
  vpc_security_group_ids = [aws_security_group.private_sg.id]

  tags = {
    Name        = "kubernetes-worker1"
    Environment = "production"
    Role        = "kubernetes-worker"
  }

  root_block_device {
    volume_size = 24 # 24 GB storage
  }
}

resource "aws_instance" "k8s_worker2" {
  ami                    = "ami-02da9706e7051f070"
  instance_type          = "t2.large"
  subnet_id              = aws_subnet.private_subnet.id
  key_name               = aws_key_pair.generated_key.key_name
  vpc_security_group_ids = [aws_security_group.private_sg.id]

  tags = {
    Name        = "kubernetes-worker2"
    Environment = "production"
    Role        = "kubernetes-worker"
  }

  root_block_device {
    volume_size = 24 # 24 GB storage
  }
}

# Postgres Instances (2) in Private Subnet (t2.medium, 24 GB IOPS EBS)
resource "aws_instance" "postgres1" {
  ami                    = "ami-02da9706e7051f070"
  instance_type          = "t2.medium"
  subnet_id              = aws_subnet.private_subnet.id
  key_name               = aws_key_pair.generated_key.key_name
  vpc_security_group_ids = [aws_security_group.private_sg.id]

  tags = {
    Name        = "postgres1"
    Environment = "production"
    Role        = "database"
  }

  root_block_device {
    volume_size = 24
    volume_type = "io1" # IOPS optimized
    iops        = 1000  # Define IOPS for the volume
  }


}

resource "aws_instance" "postgres2" {
  ami                    = "ami-02da9706e7051f070"
  instance_type          = "t2.medium"
  subnet_id              = aws_subnet.private_subnet.id
  key_name               = aws_key_pair.generated_key.key_name
  vpc_security_group_ids = [aws_security_group.private_sg.id]

  tags = {
    Name        = "postgres2"
    Environment = "production"
    Role        = "database"
  }

  root_block_device {
    volume_size = 24
    volume_type = "io1" # IOPS optimized
    iops        = 1000  # Define IOPS for the volume
  }
}

# MongoDB Instance in Private Subnet (t2.medium, 24 GB IOPS EBS)
resource "aws_instance" "mongodb" {
  ami                    = "ami-02da9706e7051f070"
  instance_type          = "t2.medium"
  subnet_id              = aws_subnet.private_subnet.id
  key_name               = aws_key_pair.generated_key.key_name
  vpc_security_group_ids = [aws_security_group.private_sg.id]

  tags = {
    Name        = "mongodb-server"
    Environment = "production"
    Role        = "database"
  }

  root_block_device {
    volume_size = 24
    volume_type = "io1" # IOPS optimized
    iops        = 1000  # Define IOPS for the volume
  }
}

# Save Private Key to Local File
resource "local_file" "private_key" {
  content         = tls_private_key.my_key.private_key_pem
  filename        = "${path.module}/terraform-key.pem"
  file_permission = "0600"
}
