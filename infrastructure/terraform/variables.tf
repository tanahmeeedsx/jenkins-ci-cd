variable "aws_region" {
  default = "us-west-2"
}

variable "key_name" {
  description = "Existing AWS EC2 key pair name"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "Your public IP in CIDR format, e.g. 203.0.113.10/32"
  type        = string
}

variable "project_name" {
  default = "noteshub"
}
