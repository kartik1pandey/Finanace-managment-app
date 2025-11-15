// backend/lib/mcp.js
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";

function ensureSessionPrefix(id) {
  if (!id) return null;
  return id.startsWith("mcp-session-") ? id : `mcp-session-${id}`;
}

function generateSessionId() {
  return `mcp-session-${uuidv4()}`;
}

async function safeParseResponse(resp) {
  // Try JSON first, fall back to text parsing heuristics
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    // Sometimes MCP returns a JSON string inside an RPC wrapper:
    // e.g. {"result":{"content":[{"type":"text","text":"{\"status\":\"login_required\",...}"}]}}
    try {
      const maybe = /"text"\s*:\s*"(.+?)"\}\]/s.exec(text);
      if (maybe && maybe[1]) {
        const unescaped = maybe[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
        return JSON.parse(unescaped);
      }
    } catch (e2) {}
    // Last resort: return raw text in an object
    return { raw: text };
  }
}

export class MCPClient {
  constructor({ url = "http://localhost:8080/mcp/stream", sessionId = null } = {}) {
    this.url = url;
    this.sessionId = ensureSessionPrefix(sessionId) || generateSessionId();
  }

  setSessionId(sessionId) {
    this.sessionId = ensureSessionPrefix(sessionId);
  }

  getSessionId() {
    return this.sessionId;
  }

  async callTool(name, args = {}) {
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name,
        arguments: args
      }
    };

    const resp = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Mcp-Session-Id": this.sessionId
      },
      body: JSON.stringify(body),
      timeout: 30000
    });

    const parsed = await safeParseResponse(resp);

    // Common patterns:
    // 1) { error: { data: { login_url: "..." } } }
    if (parsed?.error?.data?.login_url) {
      return { login_required: true, login_url: parsed.error.data.login_url, raw: parsed };
    }

    // 2) Some wrappers produce text that itself is JSON like {"status": "login_required", "login_url": "..."}
    if (parsed?.status === "login_required" && parsed?.login_url) {
      return { login_required: true, login_url: parsed.login_url, raw: parsed };
    }

    // 3) RPC with result.content -> text (embedded JSON)
    // Example: { result: { content: [{ type: "text", text: "{\"status\":\"login_required\"}" }] } }
    if (parsed?.result?.content && Array.isArray(parsed.result.content)) {
      const item = parsed.result.content.find(c => c.type === "text" && typeof c.text === "string");
      if (item) {
        try {
          const inner = JSON.parse(item.text);
          if (inner?.status === "login_required" && inner.login_url) {
            return { login_required: true, login_url: inner.login_url, raw: parsed };
          }
          return { result: inner, raw: parsed };
        } catch (e) {
          // Not JSON inside text - return the original parsed structure
          return { result: parsed.result, raw: parsed };
        }
      }
    }

    // 4) Already a clean JSON response (net worth etc)
    if (parsed?.netWorthResponse || parsed?.result || parsed?.assetValues || parsed?.totalNetWorthValue) {
      return { result: parsed, raw: parsed };
    }

    // 5) If parsed contains raw key only (non-json)
    return { raw: parsed };
  }
}
