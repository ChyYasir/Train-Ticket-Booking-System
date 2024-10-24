# Output the Public IP of the Nginx instance
output "nginx_public_ip" {
  value = aws_instance.nginx.public_ip
}

# Output the location of the private key file
output "private_key_path" {
  value     = local_file.private_key.filename
  sensitive = true
}
