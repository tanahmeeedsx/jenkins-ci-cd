# Jenkins CI/CD Project

A full-stack notes application deployed on AWS using Terraform, Ansible,
Jenkins, Docker, and Docker Compose.

## Technology Stack

- Frontend: React, Vite, Nginx
- Backend: Node.js, Express
- Database: MongoDB
- Containers: Docker, Docker Compose
- Infrastructure: AWS EC2, VPC, Security Groups
- IaC: Terraform
- Configuration Management: Ansible
- CI/CD: Jenkins
- Registry: Docker Hub

## Architecture

GitHub -> Jenkins Controller -> Docker Hub -> App EC2

The Jenkins pipeline performs backend tests, frontend builds,
Docker image builds, image publishing, and remote deployment.

The App EC2 runs the React frontend, Express API, and MongoDB.

## Repository Structure

- app/backend: Express API and automated tests
- app/frontend: React application
- deployment: Production Compose and deployment script
- infrastructure/terraform: AWS infrastructure
- infrastructure/ansible: EC2 configuration
- Jenkinsfile: CI/CD pipeline

## AWS Configuration

Region: us-west-2

- Jenkins Controller: t3.medium
- Application Server: t3.small
- Dedicated VPC and public subnet
- Separate security groups
- 20 GB gp3 root volume per EC2

## Deployment Preparation

1. Configure AWS CLI.
2. Set the existing EC2 key pair name in terraform.tfvars.
3. Set your public IP as the allowed SSH CIDR.
4. Run Terraform to provision infrastructure.
5. Configure EC2 instances using Ansible.
6. Configure Jenkins credentials.
7. Create a Jenkins Pipeline job using this repository's Jenkinsfile.

## Jenkins Credentials

- dockerhub-credentials
- app-server-ssh
- app-server-host

## Application URLs

Frontend: http://APP_SERVER_PUBLIC_IP/
API health: http://APP_SERVER_PUBLIC_IP/api/health

## Security

- Never commit .env files, secrets, private keys, or Terraform state.
- Store credentials in Jenkins Credentials.
- Restrict SSH and Jenkins access to trusted IP addresses.
- Do not expose MongoDB or backend ports publicly.
- Configure HTTPS before production use.

## Cleanup

Back up application data before destroying infrastructure.

From infrastructure/terraform:

    terraform plan -destroy
    terraform destroy

Destroying the App EC2 also deletes its local MongoDB data.
