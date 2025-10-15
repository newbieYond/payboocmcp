# Architecture Overview

Visual guide to PaybooCMCP's system architecture and data flow.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Desktop                         │
│                    (MCP Client)                             │
└──────────────────────┬──────────────────────────────────────┘
                       │ stdio transport
                       │ JSON-RPC 2.0
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              PaybooCMCP MCP Server                          │
│              (src/index.ts)                                 │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Tools      │  │  Resources   │  │  Transport   │     │
│  │              │  │              │  │              │     │
│  │ • list       │  │ • list       │  │  stdio       │     │
│  │ • call       │  │ • read       │  │  (stdin/out) │     │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘     │
│         │                 │                                │
│         └─────────┬───────┘                                │
│                   ↓                                         │
│         ┌──────────────────────┐                           │
│         │   CSV Processor      │                           │
│         │ (csv-processor.ts)   │                           │
│         │                      │                           │
│         │ • readCSVFile()      │                           │
│         │ • extractURLs()      │                           │
│         │ • organizeURLs()     │                           │
│         │ • getCSVFiles()      │                           │
│         └──────────┬───────────┘                           │
└────────────────────┼────────────────────────────────────────┘
                     │
                     ↓
            ┌─────────────────┐
            │   data/         │
            │                 │
            │ • *.csv files   │
            └─────────────────┘
```

## Component Breakdown

### 1. MCP Server (src/index.ts)

**Responsibility**: Protocol implementation and request handling

**Key Components**:
- `Server`: MCP SDK server instance
- `StdioServerTransport`: stdio communication layer
- Request handlers: Tools and Resources

**Request Handlers**:
```typescript
ListToolsRequestSchema     → Returns available tools
CallToolRequestSchema      → Executes tool logic
ListResourcesRequestSchema → Returns available CSV files as resources
ReadResourceRequestSchema  → Reads specific CSV resource
```

**Error Handling**:
- Try-catch blocks for all operations
- Descriptive error messages
- Graceful degradation

### 2. CSV Processor (src/csv-processor.ts)

**Responsibility**: CSV parsing and URL extraction

**Functions**:

```typescript
readCSVFile(filename: string): Promise<CSVRow[]>
// Reads and parses CSV file
// Uses csv-parse library
// Returns array of row objects

getCSVFiles(): Promise<string[]>
// Lists all CSV files in data directory
// Filters by .csv extension
// Returns array of filenames

extractURLs(data: CSVRow[]): string[]
// Extracts URLs from all columns
// Uses regex pattern matching
// Deduplicates URLs

organizeURLs(data: CSVRow[]): OrganizedURLs
// Categorizes URLs by category/type
// Combines extraction and organization
// Returns structured result
```

**URL Pattern**:
```regex
/https?:\/\/[^\s]+/g
```

### 3. Data Layer (data/)

**Structure**:
```
data/
├── example-links.csv    # Categorized URLs
├── sample-urls.csv      # Simple format
└── [your-files.csv]     # User-added files
```

**CSV Schema** (flexible):
```csv
category/type, title/name, url/link, description
Documentation, TypeScript, https://..., Docs
Tools,         GitHub,     https://..., Platform
```

## Data Flow

### Tool Call: get_urls_from_csv

```
1. Claude Desktop
   ↓ JSON-RPC request
   {
     "method": "tools/call",
     "params": {
       "name": "get_urls_from_csv",
       "arguments": { "filename": "example-links.csv" }
     }
   }

2. MCP Server (index.ts)
   ↓ Validate request
   ↓ Extract filename
   ↓ Call CSV processor

3. CSV Processor (csv-processor.ts)
   ↓ readCSVFile("example-links.csv")
   ↓ parse CSV → CSVRow[]
   ↓ organizeURLs(rows)
   ↓ extractURLs + categorize
   ↓ Return OrganizedURLs

4. MCP Server
   ↓ Format response
   ↓ Return to client

5. Claude Desktop
   ← JSON-RPC response
   {
     "result": {
       "content": [{
         "type": "text",
         "text": "{ urls: [...], categorized: {...}, total: 8 }"
       }]
     }
   }
```

### Resource Read: csv://example-links.csv

```
1. Claude Desktop
   ↓ Request resource
   { "uri": "csv://example-links.csv" }

2. MCP Server
   ↓ Parse URI → filename
   ↓ Call CSV processor

3. CSV Processor
   ↓ Read and process CSV
   ↓ Extract and organize URLs

4. MCP Server
   ↓ Format as resource content
   ↓ Return with mime type

5. Claude Desktop
   ← Resource content
   { "mimeType": "application/json", "text": "{...}" }
```

## MCP Protocol

### Tools Schema

```json
{
  "name": "get_urls_from_csv",
  "description": "Extract and organize URLs from a CSV file",
  "inputSchema": {
    "type": "object",
    "properties": {
      "filename": {
        "type": "string",
        "description": "Name of the CSV file"
      }
    },
    "required": ["filename"]
  }
}
```

### Resources Schema

```json
{
  "uri": "csv://example-links.csv",
  "name": "example-links.csv",
  "description": "CSV file containing URLs: example-links.csv",
  "mimeType": "text/csv"
}
```

## Deployment Architecture

### Vercel Serverless

```
┌──────────────────────────────────────────────┐
│              Vercel Edge Network              │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │       Serverless Function          │     │
│  │       (Node.js 20.x)               │     │
│  │                                    │     │
│  │  ├── api/mcp.ts (HTTP endpoint)   │     │
│  │  ├── dist/index.js (MCP server)   │     │
│  │  └── data/*.csv (static files)    │     │
│  └────────────────────────────────────┘     │
│                                              │
│  Auto-deploy on:                            │
│  • Push to main branch                      │
│  • Pull request (preview)                   │
└──────────────────────────────────────────────┘
         ↑
         │ GitHub webhook
         │
┌────────┴──────────┐
│   GitHub Repo     │
│   payboocmcp      │
└───────────────────┘
```

### Local Development

```
┌──────────────────────────────────────────────┐
│           Development Environment             │
│                                              │
│  src/ (TypeScript)                           │
│    ↓ tsc (TypeScript compiler)               │
│  dist/ (JavaScript)                          │
│    ↓ node dist/index.js                      │
│  MCP Server (stdio)                          │
│    ↓ stdin/stdout                            │
│  Claude Desktop                              │
└──────────────────────────────────────────────┘
```

## Technology Stack Layers

```
┌─────────────────────────────────────┐
│        Application Layer            │
│  • MCP Server (index.ts)            │
│  • CSV Processor (csv-processor.ts) │
└──────────────┬──────────────────────┘
               ↓
┌──────────────────────────────────────┐
│         Framework Layer              │
│  • @modelcontextprotocol/sdk         │
│  • csv-parse                         │
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│          Runtime Layer               │
│  • Node.js 18+                       │
│  • TypeScript 5.7.2                  │
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│       Infrastructure Layer           │
│  • Vercel (serverless)               │
│  • GitHub (version control)          │
└──────────────────────────────────────┘
```

## Error Handling Flow

```
Error occurs in CSV Processor
         ↓
Try-catch in index.ts
         ↓
Format error message
         ↓
Return with isError: true
         ↓
Claude Desktop displays error
```

**Error Types**:
- File not found: `Failed to read CSV file ${filename}`
- Parse error: `Failed to parse CSV content`
- Unknown tool: `Unknown tool: ${name}`
- Invalid arguments: `Filename is required`

## Performance Characteristics

**CSV Parsing**:
- Time complexity: O(n) where n = file size
- Memory: Full file loaded into memory
- Optimal: Files < 10MB

**URL Extraction**:
- Time complexity: O(n*m) where m = avg row length
- Regex pattern matching: Fast for 1000s of URLs
- Deduplication: O(n) using Set

**MCP Communication**:
- Transport: stdio (low latency)
- Protocol: JSON-RPC 2.0
- Overhead: Minimal (~100ms per request)

## Security Model

```
┌──────────────────────────────────────┐
│         Trust Boundary               │
│                                      │
│  Claude Desktop                      │
│         ↕ stdio (trusted)            │
│  MCP Server                          │
│         ↕ filesystem (local)         │
│  CSV Files (data/)                   │
└──────────────────────────────────────┘
```

**Security Layers**:
1. **File Access**: Restricted to data/ directory
2. **Input Validation**: Filename sanitization
3. **Error Messages**: No sensitive info leak
4. **No Network**: Local-only operation (stdio)
5. **No Auth**: Trusted local environment

## Extension Points

**Add New Tools**:
```typescript
// In index.ts
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ... existing tools
      {
        name: 'validate_urls',
        description: 'Check if URLs are valid',
        inputSchema: { /* ... */ }
      }
    ]
  };
});
```

**Add Custom Processing**:
```typescript
// In csv-processor.ts
export function validateURLs(urls: string[]): ValidationResult {
  // Custom validation logic
}
```

**Add New Resource Types**:
```typescript
// Support JSON, XML, etc.
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const csvFiles = await getCSVFiles();
  const jsonFiles = await getJSONFiles(); // New

  return {
    resources: [
      ...csvFiles.map(/* csv:// */),
      ...jsonFiles.map(/* json:// */)
    ]
  };
});
```

## Monitoring & Observability

**Local Development**:
- Console logs: `console.error('PaybooCMCP MCP Server running')`
- Error messages: Returned in MCP responses
- Claude Desktop logs: Check IDE console

**Vercel Production**:
- Deployment logs: Build output
- Runtime logs: Function execution
- Analytics: Traffic metrics
- Error tracking: Automatic error logging

## Future Architecture Enhancements

1. **Caching Layer**: Cache parsed CSV data
2. **Streaming**: Support large files with streams
3. **Validation**: URL validation and metadata
4. **Database**: PostgreSQL for URL storage
5. **API Layer**: REST API for HTTP access
6. **Authentication**: API key or OAuth
7. **Rate Limiting**: Prevent abuse
8. **Webhooks**: Notify on CSV updates

---

**Current Architecture**: Simple, reliable, maintainable
**Design Principle**: Start simple, add complexity only when needed
**Performance**: Optimized for typical use cases (< 10MB CSV files)
