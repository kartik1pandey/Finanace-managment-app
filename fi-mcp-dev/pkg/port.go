package pkg

import (
	"os"
)

func GetPort() string {
	// Check standard PORT environment variable first (for Render/Heroku compatibility)
	if port := os.Getenv("PORT"); port != "" {
		return port
	}
	// Fallback to custom FI_MCP_PORT
	if port := os.Getenv("FI_MCP_PORT"); port != "" {
		return port
	}
	return "8080"
}
