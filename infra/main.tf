########################################
# Generated secrets (stored in Terraform state, never in git)
########################################

resource "random_string" "suffix" {
  length  = 5
  upper   = false
  special = false
}

resource "random_password" "db" {
  length  = 32
  special = false # avoids characters that would break the DATABASE_URL
}

resource "random_password" "jwt" {
  length  = 64
  special = false
}

########################################
# Resource group
########################################

resource "azurerm_resource_group" "main" {
  name     = "rg-nextrole"
  location = var.location

  tags = local.tags
}

locals {
  tags = {
    project    = "nextrole"
    managed_by = "terraform"
  }

  database_url = "postgresql://nextroleadmin:${random_password.db.result}@${azurerm_postgresql_flexible_server.db.fqdn}:5432/nextrole?sslmode=require"

  # The public URL of the web app is predictable: <app name>.<environment default domain>
  frontend_origin = "https://ca-web.${azurerm_container_app_environment.env.default_domain}"
}

########################################
# Container registry + identity (no passwords)
########################################

resource "azurerm_container_registry" "acr" {
  name                = "acrnextrole${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = false # no shared admin password

  tags = local.tags
}

resource "azurerm_user_assigned_identity" "apps" {
  name                = "id-nextrole-apps"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  tags = local.tags
}

# Least privilege: this identity may only pull images
resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.apps.principal_id
}

########################################
# PostgreSQL Flexible Server
# Lives in db_location (India South Central) because Burstable is not
# allowed for the student subscription in Central India.
########################################

resource "azurerm_postgresql_flexible_server" "db" {
  name                   = "psql-nextrole-${random_string.suffix.result}-isc"
  resource_group_name    = azurerm_resource_group.main.name
  location               = coalesce(var.db_location, azurerm_resource_group.main.location)
  version                = "16"
  administrator_login    = "nextroleadmin"
  administrator_password = random_password.db.result
  sku_name               = var.db_sku_name
  storage_mb             = 32768
  backup_retention_days  = 7

  tags = local.tags

  lifecycle {
    ignore_changes = [zone]
  }
}

resource "azurerm_postgresql_flexible_server_database" "app" {
  name      = "nextrole"
  server_id = azurerm_postgresql_flexible_server.db.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# 0.0.0.0 - 0.0.0.0 is Azure's special value meaning "Azure-hosted services only".
# SSL is enforced by the server and by sslmode=require in the URL.
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.db.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

########################################
# Logs + Container Apps environment
########################################

resource "azurerm_log_analytics_workspace" "logs" {
  name                = "log-nextrole"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
  daily_quota_gb      = 0.5 # cost guard so noisy logs cannot eat your credit

  tags = local.tags
}

resource "azurerm_container_app_environment" "env" {
  name                       = "cae-nextrole"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id

  tags = local.tags

  # Azure adds a default "Consumption" workload profile itself
  lifecycle {
    ignore_changes = [workload_profile]
  }
}

########################################
# API (FastAPI)
# external_enabled = true because the student subscription's environment
# blocks app-to-app calls, so nginx must reach the API through its public
# address. Protected endpoints are still guarded by JWT login.
########################################

resource "azurerm_container_app" "api" {
  name                         = "ca-api"
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.env.id
  revision_mode                = "Single"

  tags = local.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.apps.id]
  }

  registry {
    server   = azurerm_container_registry.acr.login_server
    identity = azurerm_user_assigned_identity.apps.id
  }

  secret {
    name  = "database-url"
    value = local.database_url
  }

  secret {
    name  = "jwt-secret"
    value = random_password.jwt.result
  }

  template {
    min_replicas = 0
    max_replicas = 2

    container {
      name   = "api"
      image  = "${azurerm_container_registry.acr.login_server}/nextrole-backend:${var.backend_image_tag}"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name        = "SECRET_KEY"
        secret_name = "jwt-secret"
      }

      env {
        name  = "CORS_ORIGINS"
        value = local.frontend_origin
      }

      liveness_probe {
        transport = "HTTP"
        path      = "/health"
        port      = 8000
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 8000
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  depends_on = [
    azurerm_role_assignment.acr_pull,
    azurerm_postgresql_flexible_server_database.app,
    azurerm_postgresql_flexible_server_firewall_rule.azure_services,
  ]
}

########################################
# Worker: Celery worker + Beat, with Redis and MailHog as sidecars
#
# DISABLED (count = 0): the student subscription's environment rejects
# sidecar containers ("ExpressSidecarContainersNotSupported").
# Interview reminder emails are therefore off for now.
# To re-enable later, change count to 1 once the worker is rebuilt as a
# single container (for example Redis embedded in the backend image).
########################################

resource "azurerm_container_app" "worker" {
  count = 0

  name                         = "ca-worker"
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.env.id
  revision_mode                = "Single"

  tags = local.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.apps.id]
  }

  registry {
    server   = azurerm_container_registry.acr.login_server
    identity = azurerm_user_assigned_identity.apps.id
  }

  secret {
    name  = "database-url"
    value = local.database_url
  }

  secret {
    name  = "jwt-secret"
    value = random_password.jwt.result
  }

  template {
    min_replicas = 1
    max_replicas = 1

    container {
      name   = "worker"
      image  = "${azurerm_container_registry.acr.login_server}/nextrole-backend:${var.backend_image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      command = ["celery"]
      args = [
        "-A", "app.worker.celery_app",
        "worker",
        "-B",
        "--loglevel=info",
        "--concurrency=2",
        "--schedule=/tmp/celerybeat-schedule",
      ]

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name        = "SECRET_KEY"
        secret_name = "jwt-secret"
      }

      env {
        name  = "REDIS_URL"
        value = "redis://localhost:6379/0"
      }

      env {
        name  = "SMTP_HOST"
        value = "localhost"
      }

      env {
        name  = "SMTP_PORT"
        value = "1025"
      }

      env {
        name  = "MAIL_FROM"
        value = "reminders@nextrole.local"
      }
    }

    container {
      name   = "redis"
      image  = "redis:7-alpine"
      cpu    = 0.25
      memory = "0.5Gi"
    }

    container {
      name   = "mailhog"
      image  = "mailhog/mailhog:v1.0.1"
      cpu    = 0.25
      memory = "0.5Gi"
    }
  }

  # No ingress block: nothing can reach the worker from outside.

  depends_on = [
    azurerm_role_assignment.acr_pull,
    azurerm_postgresql_flexible_server_database.app,
    azurerm_postgresql_flexible_server_firewall_rule.azure_services,
  ]
}

########################################
# Web (nginx + React build) - the public entry point
########################################

resource "azurerm_container_app" "web" {
  name                         = "ca-web"
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.env.id
  revision_mode                = "Single"

  tags = local.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.apps.id]
  }

  registry {
    server   = azurerm_container_registry.acr.login_server
    identity = azurerm_user_assigned_identity.apps.id
  }

  template {
    min_replicas = 0
    max_replicas = 2

    container {
      name   = "web"
      image  = "${azurerm_container_registry.acr.login_server}/nextrole-frontend:${var.frontend_image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      # Substituted into nginx.conf.template at container start
      env {
        name  = "BACKEND_HOST"
        value = azurerm_container_app.api.ingress[0].fqdn
      }
    }
  }

  ingress {
    external_enabled           = true
    target_port                = 80
    transport                  = "http"
    allow_insecure_connections = false # HTTP is redirected to HTTPS

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  depends_on = [azurerm_role_assignment.acr_pull]
}
