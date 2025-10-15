#!/usr/bin/env node

/**
 * Test script for Remote MCP server
 * Tests the JSON-RPC communication with the deployed Vercel endpoint
 */

const https = require('https');

const MCP_SERVER_URL = 'https://payboocmcp.vercel.app/api/mcp-server';

function sendRequest(request) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(request);
    const url = new URL(MCP_SERVER_URL);

    console.log('\n--- Sending Request ---');
    console.log(JSON.stringify(request, null, 2));

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

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        console.log('\n--- Response (Status: ' + res.statusCode + ') ---');
        try {
          const parsed = JSON.parse(body);
          console.log(JSON.stringify(parsed, null, 2));
          resolve(parsed);
        } catch (e) {
          console.log('Raw response:', body);
          reject(new Error('Failed to parse response: ' + e.message));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('=== Testing Remote MCP Server ===');

  try {
    // Test 1: Initialize
    await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    });

    // Test 2: Tools list
    await sendRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    });

    // Test 3: List CSV files
    await sendRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'list_csv_files',
        arguments: {}
      }
    });

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
