variable "subscription_id" {
  description = "Azure for Students subscription ID"
  type        = string
}

variable "location" {
  description = "Azure region. Student subscriptions often restrict regions, so change this if you get a 'location is restricted' error."
  type        = string
  default     = "southeastasia"
}

variable "backend_image_tag" {
  description = "Tag of nextrole-backend in ACR (used by the API and the worker). Use a unique tag per build, not 'latest'."
  type        = string
  default     = "v1"
}

variable "frontend_image_tag" {
  description = "Tag of nextrole-frontend in ACR"
  type        = string
  default     = "v1"
}

variable "db_location" {
  description = "Region for the database. Defaults to the app's region."
  type        = string
  default     = null
}

variable "db_sku_name" {
  description = "PostgreSQL SKU, e.g. B_Standard_B1ms"
  type        = string
  default     = "B_Standard_B1ms"
}