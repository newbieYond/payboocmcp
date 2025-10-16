// Test prompts and search_links tool
const { spawn } = require('child_process');

async function testMCP() {
  const mcp = spawn('node', ['dist/index.js']);

  let output = '';

  mcp.stdout.on('data', (data) => {
    output += data.toString();
  });

  mcp.stderr.on('data', (data) => {
    console.error('Server:', data.toString());
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 1: List prompts
  console.log('Test 1: List prompts');
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'prompts/list'
  }) + '\n');

  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 2: Get prompt
  console.log('Test 2: Get prompt');
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'prompts/get',
    params: {
      name: 'find-paybooc-links',
      arguments: {}
    }
  }) + '\n');

  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 3: Search links
  console.log('Test 3: Search links tool');
  mcp.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'search_links',
      arguments: {
        query: '카드'
      }
    }
  }) + '\n');

  await new Promise(resolve => setTimeout(resolve, 1000));

  mcp.kill();

  // Parse and display results
  console.log('\n=== Results ===');
  const responses = output.split('\n').filter(line => line.trim());
  responses.forEach((resp, idx) => {
    if (resp.trim()) {
      try {
        const parsed = JSON.parse(resp);
        console.log('\nResponse ' + (idx + 1) + ':', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Raw ' + (idx + 1) + ':', resp);
      }
    }
  });
}

testMCP().catch(console.error);
