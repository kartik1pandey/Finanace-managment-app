// backend/server.js
import express from "express";
import cors from "cors";
import { MCPClient } from "./lib/mcp.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const MCP_URL = process.env.MCP_URL || "http://localhost:8080/mcp/stream";
const MCP_BASE_URL = process.env.MCP_BASE_URL || "https://finanace-managment-app-1.onrender.com";

function newClient(sessionId) {
  return new MCPClient({ url: MCP_URL, sessionId });
}

// Helper to call and return unified response
async function callToolAndUnwrap(sessionId, toolName, args = {}) {
  const client = newClient(sessionId);
  const resp = await client.callTool(toolName, args);
  return resp;
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "mcp-backend-proxy",
    mcp_url: MCP_URL,
    mock_mode: process.env.MOCK_MODE === "true"
  });
});

/**
 * Initiate: generate sessionId and try to fetch networth to get login_url if required
 */
app.get("/mcp/initiate", async (req, res) => {
  try {
    const client = newClient(); // generates new sessionId
    const sessionId = client.getSessionId();

    // If in mock mode, return mock response with production URLs
    if (process.env.MOCK_MODE === "true") {
      return res.json({
        sessionId,
        login_required: true,
        login_url: `${MCP_BASE_URL}/mockWebPage?sessionId=${sessionId}`,
        mock: true
      });
    }

    const resp = await client.callTool("fetch_net_worth", {});
    
    // Fix the login URL to use production URL instead of localhost
    if (resp.login_url) {
      // Replace any localhost URLs with production URL
      resp.login_url = resp.login_url
        .replace("http://localhost:8080", MCP_BASE_URL)
        .replace("http://localhost:5001", MCP_BASE_URL)
        .replace("https://localhost:8080", MCP_BASE_URL)
        .replace("https://localhost:5001", MCP_BASE_URL);
    }
    
    return res.json({ sessionId, ...resp });
  } catch (err) {
    // Fallback to mock mode if MCP server is unavailable
    const client = newClient();
    const sessionId = client.getSessionId();
    return res.json({
      sessionId,
      login_required: true,
      login_url: `${MCP_BASE_URL}/mockWebPage?sessionId=${sessionId}`,
      mock: true,
      error: err.message
    });
  }
});

/**
 * Login status probe: useful to check whether session is active
 */
app.get("/mcp/login-status", async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: "missing sessionId" });

  try {
    const resp = await callToolAndUnwrap(sessionId, "fetch_net_worth");
    
    // Fix any localhost URLs in the response
    if (resp.login_url) {
      resp.login_url = resp.login_url
        .replace("http://localhost:8080", MCP_BASE_URL)
        .replace("http://localhost:5001", MCP_BASE_URL)
        .replace("https://localhost:8080", MCP_BASE_URL)
        .replace("https://localhost:5001", MCP_BASE_URL);
    }
    
    return res.json(resp);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Networth endpoint
 */
app.get("/mcp/networth", async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: "missing sessionId" });

  try {
    const resp = await callToolAndUnwrap(sessionId, "fetch_net_worth");
    
    // Fix any localhost URLs in the response
    if (resp.login_url) {
      resp.login_url = resp.login_url
        .replace("http://localhost:8080", MCP_BASE_URL)
        .replace("http://localhost:5001", MCP_BASE_URL)
        .replace("https://localhost:8080", MCP_BASE_URL)
        .replace("https://localhost:5001", MCP_BASE_URL);
    }
    
    return res.json(resp);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Generic proxy: call any tool by name with POST body { tool: "fetch_bank_transactions", args: {} }
 */
app.post("/mcp/call", async (req, res) => {
  const { sessionId } = req.query;
  const { tool, args } = req.body;
  if (!sessionId) return res.status(400).json({ error: "missing sessionId" });
  if (!tool) return res.status(400).json({ error: "missing tool in body" });

  try {
    const resp = await callToolAndUnwrap(sessionId, tool, args || {});
    return res.json(resp);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MCP Backend Proxy running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Connected to MCP Server: ${MCP_URL}`);
  console.log(`🌐 Base URL: ${MCP_BASE_URL}`);
});
