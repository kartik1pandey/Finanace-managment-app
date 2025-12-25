// backend/server.js
import express from "express";
import cors from "cors";
import { MCPClient } from "./lib/mcp.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const MCP_URL = process.env.MCP_URL || "http://localhost:8080/mcp/stream";

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
    mcp_url: MCP_URL
  });
});

/**
 * Initiate: generate sessionId and try to fetch networth to get login_url if required
 */
app.get("/mcp/initiate", async (req, res) => {
  try {
    const client = newClient(); // generates new sessionId
    const sessionId = client.getSessionId();

    const resp = await client.callTool("fetch_net_worth", {});
    return res.json({ sessionId, ...resp });
  } catch (err) {
    return res.status(500).json({ error: err.message });
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

app.listen(PORT, () => {
  console.log(`🚀 MCP Backend Proxy running on http://localhost:${PORT}`);
  console.log(`📡 Connected to MCP Server: ${MCP_URL}`);
});
