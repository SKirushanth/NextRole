output "web_url" {
  description = "Public URL of the app"
  value       = "https://${azurerm_container_app.web.ingress[0].fqdn}"
}

output "acr_name" {
  value = azurerm_container_registry.acr.name
}

output "acr_login_server" {
  value = azurerm_container_registry.acr.login_server
}
