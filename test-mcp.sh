#!/bin/bash

# Simple test script for MCP server
# This demonstrates how to test the server locally

echo "Testing PaybooCMCP Server"
echo "========================="
echo ""

# Test 1: List tools
echo "Test 1: List available tools"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js

echo ""
echo "Test 2: List resources"
echo '{"jsonrpc":"2.0","id":2,"method":"resources/list"}' | node dist/index.js

echo ""
echo "Test 3: Get URLs from example-links.csv"
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_urls_from_csv","arguments":{"filename":"example-links.csv"}}}' | node dist/index.js

echo ""
echo "Test completed!"
