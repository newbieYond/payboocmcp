#!/usr/bin/env node

/**
 * Test script for search_links tool
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
  console.log('=== Testing 링크찾기 Server ===');

  try {
    // Wait for deployment
    console.log('\nWaiting 60s for Vercel deployment...');
    await new Promise(resolve => setTimeout(resolve, 60000));

    // Test 1: Search for "카드"
    await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'search_links',
        arguments: {
          query: '카드'
        }
      }
    });

    // Test 2: Search for "lotto"
    await sendRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'search_links',
        arguments: {
          query: 'lotto'
        }
      }
    });

    // Test 3: Search for "이벤트"
    await sendRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'search_links',
        arguments: {
          query: '이벤트'
        }
      }
    });

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
