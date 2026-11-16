terraform {
  required_version = ">= 1.6"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Backend blocks cannot use variables, so edit the storage account name by hand.
  backend "azurerm" {
    resource_group_name  = "rg-nextrole-tfstate"
    storage_account_name = "nextrolestg4821"
    container_name       = "tfstate"
    key                  = "nextrole.tfstate"
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}
