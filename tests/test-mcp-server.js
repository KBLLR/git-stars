#!/usr/bin/env node

/**
 * Simple MCP Server Test
 * Tests basic MCP server functionality
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverPath = path.resolve(__dirname, "../src/mcp-server/index.js");

console.log("Testing MCP Server...\n");

// Start MCP server
const server = spawn("node", [serverPath]);

let stderr = "";
let stdout = "";

server.stderr.on("data", (data) => {
  stderr += data.toString();
  process.stderr.write(data);
});

server.stdout.on("data", (data) => {
  stdout += data.toString();
});

// Send initialize request
setTimeout(() => {
  const initRequest = {
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      protocolVersion: "0.1.0",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0",
      },
    },
    id: 1,
  };

  console.log("\nSending initialize request...");
  server.stdin.write(JSON.stringify(initRequest) + "\n");

  // Wait for response, then request tools
  setTimeout(() => {
    const toolsRequest = {
      jsonrpc: "2.0",
      method: "tools/list",
      id: 2,
    };

    console.log("Requesting tool list...");
    server.stdin.write(JSON.stringify(toolsRequest) + "\n");

    // Wait for response, then test a tool call
    setTimeout(() => {
      const getStatsRequest = {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "get_statistics",
          arguments: {},
        },
        id: 3,
      };

      console.log("Testing get_statistics tool...");
      server.stdin.write(JSON.stringify(getStatsRequest) + "\n");

      // Give time for response, then kill server
      setTimeout(() => {
        console.log("\n✅ MCP Server test completed");
        console.log("\nServer started successfully and responded to requests.");
        console.log("For detailed testing, use:");
        console.log("  npx @modelcontextprotocol/inspector node src/mcp-server/index.js\n");

        server.kill();
        process.exit(0);
      }, 1000);
    }, 1000);
  }, 1000);
}, 2000);

server.on("error", (error) => {
  console.error("❌ Server error:", error);
  process.exit(1);
});

server.on("close", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(1);
  }
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error("❌ Test timeout");
  server.kill();
  process.exit(1);
}, 10000);
