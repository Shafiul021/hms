#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "============================================="
echo " Setting up HMS production server..."
echo "============================================="

# 1. Update Package List
echo "Updating packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Install basic utilities
sudo apt-get install -y curl git unzip software-properties-common ca-certificates gnupg lsb-release ufw

# 3. Install Docker
echo "Installing Docker..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify Docker installations
sudo docker --version
sudo docker compose version

# Add current user to docker group (optional but helpful)
sudo usermod -aG docker $USER

# 4. Install Nginx & Certbot
echo "Installing Nginx and Certbot..."
sudo apt-get install -y nginx certbot python3-certbot-nginx

# 5. Configure Firewall (UFW)
echo "Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "============================================="
echo " Server Setup Completed successfully!"
echo " Docker, Nginx, and Certbot are installed."
echo " Firewall is active and allowing HTTP/HTTPS/SSH."
echo " Please log out and log back in for docker group updates to take effect."
echo "============================================="
