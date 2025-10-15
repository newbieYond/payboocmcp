#!/usr/bin/env node

/**
 * MCP HTTP Proxy
 *
 * This proxy enables Claude Desktop to connect to a remote MCP server
 * by converting stdio (stdin/stdout) to HTTP requests.
 *
 * Usage:
 * node mcp-proxy.js
 *
 * Configuration in Claude Desktop:
 * {
 *   "mcpServers": {
 *     "payboocmcp-remote": {
 *       "command": "node",
 *       "args": ["/path/to/mcp-proxy.js"]
 *     }
 *   }
 * }
 */

const https = require('https');
const readline = require('readline');

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://payboocmcp.vercel.app/api/mcp-server';

// Create readline interface for stdin/stdout
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Log to stderr (won't interfere with stdout communication)
function log(message) {
  console.error(`[MCP Proxy] ${message}`);
}

log(`Starting MCP proxy to ${MCP_SERVER_URL}`);

// Handle each line from stdin (JSON-RPC request from Claude Desktop)
rl.on('line', async (line) => {
  try {
    // Parse the JSON-RPC request
    const request = JSON.parse(line);
    log(`Received request: ${request.method}`);

    // Prepare HTTP request
    const data = JSON.stringify(request);
    const url = new URL(MCP_SERVER_URL);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    // Send HTTP request to remote MCP server
    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        // Notifications (204 No Content) don't need responses sent to stdout
        if (res.statusCode === 204) {
          log(`Notification acknowledged: ${request.method}`);
          return;
        }

        // Only send non-empty responses to stdout
        if (body && body.trim()) {
          console.log(body);
          log(`Response sent for ${request.method}`);
        } else {
          log(`Empty response for ${request.method}, skipping stdout`);
        }
      });
    });

    req.on('error', (error) => {
      log(`Error: ${error.message}`);

      // Send error response
      const errorResponse = {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: `Remote server error: ${error.message}`
        }
      };
      console.log(JSON.stringify(errorResponse));
    });

    req.write(data);
    req.end();

  } catch (error) {
    log(`Parse error: ${error.message}`);

    // Send parse error response
    const errorResponse = {
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: `Parse error: ${error.message}`
      }
    };
    console.log(JSON.stringify(errorResponse));
  }
});

// Handle process termination
process.on('SIGINT', () => {
  log('Shutting down proxy');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Shutting down proxy');
  process.exit(0);
});

// Handle pipe errors (when Claude Desktop closes)
process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') {
    log('Claude Desktop disconnected');
    process.exit(0);
  }
});

log('Proxy ready, waiting for requests...');
