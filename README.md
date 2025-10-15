# PaybooCMCP - Remote MCP Server

TypeScript-based Remote MCP server for processing CSV files and extracting organized URL links. Works with Claude Desktop from anywhere via Vercel.

## 🌐 What is This?

A **Remote MCP (Model Context Protocol) server** that:
- Processes CSV files containing URLs
- Extracts and organizes URLs by category
- Works with Claude Desktop over HTTPS
- Hosted on Vercel (no local server needed)

## 🚀 Quick Start

### For Claude Desktop Users

1. **Clone this repository**:
   ```bash
   git clone https://github.com/newbieYond/payboocmcp.git
   cd payboocmcp
   ```

2. **Configure Claude Desktop**:

   Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "payboocmcp-remote": {
         "command": "node",
         "args": [
           "/ABSOLUTE/PATH/TO/payboocmcp/mcp-proxy.cjs"
         ]
       }
     }
   }
   ```

   Replace `/ABSOLUTE/PATH/TO/payboocmcp` with your actual path.

3. **Restart Claude Desktop** (Cmd + Q, then reopen)

4. **Test it**:
   - Ask Claude: "CSV 파일 목록을 보여줘"
   - Ask Claude: "example-links.csv에서 URL을 추출해줘"

## 📋 Features

- ✅ **Remote Access**: Works from anywhere with internet
- ✅ **No Local Server**: Runs on Vercel serverless
- ✅ **3 MCP Tools**:
  - `list_csv_files` - List available CSV files
  - `get_urls_from_csv` - Extract URLs from specific file
  - `get_all_urls` - Get all URLs from all files
- ✅ **CSV Resources**: Access via `csv://filename.csv` URIs
- ✅ **Auto Categorization**: URLs organized by category/type
- ✅ **Zero Configuration**: Just add to Claude Desktop

## 🗂️ Project Structure

```
payboocmcp/
├── api/
│   └── mcp-server.ts       # Remote MCP endpoint (Vercel)
├── src/
│   ├── index.ts            # Local MCP server (optional)
│   └── csv-processor.ts    # CSV parsing logic
├── data/
│   ├── example-links.csv   # Sample CSV with categories
│   └── sample-urls.csv     # Simple CSV format
├── mcp-proxy.cjs           # HTTP-to-stdio proxy for Claude Desktop
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

## 📝 CSV File Format

### With Categories

```csv
category,title,url,description
Documentation,TypeScript,https://typescriptlang.org,Official docs
Tools,GitHub,https://github.com,Code hosting
```

### Simple Format

```csv
name,link
TypeScript,https://typescriptlang.org
GitHub,https://github.com
```

URLs can be in **any column** - the parser automatically detects them.

## 🔧 How It Works

```
Claude Desktop (local)
    ↓ stdio
mcp-proxy.cjs (local proxy)
    ↓ HTTPS
Vercel MCP Server (https://payboocmcp.vercel.app/api/mcp-server)
    ↓
CSV files processing
    ↓
Organized URLs returned
```

## 📖 Available Tools

### 1. list_csv_files

Lists all CSV files in the data directory.

**Usage in Claude**:
```
"What CSV files are available?"
```

**Response**:
```json
[
  "example-links.csv",
  "sample-urls.csv"
]
```

### 2. get_urls_from_csv

Extracts URLs from a specific CSV file, organized by category.

**Usage in Claude**:
```
"Get URLs from example-links.csv"
```

**Response**:
```json
{
  "urls": ["https://...", "https://..."],
  "categorized": {
    "Documentation": ["https://..."],
    "Tools": ["https://..."]
  },
  "total": 8
}
```

### 3. get_all_urls

Gets all URLs from all CSV files.

**Usage in Claude**:
```
"Show me all URLs from all CSV files"
```

## 🛠️ Development

### Local Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run local MCP server (optional)
npm run dev
```

### Testing Remote MCP

```bash
# Test the proxy
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp-proxy.cjs
```

### Adding Your Own CSV Files

1. Add CSV file to `data/` directory
2. Commit and push to GitHub
3. Vercel automatically redeploys
4. URLs available immediately in Claude Desktop

## 🌍 Deployment

This project is automatically deployed to Vercel:

- **MCP Endpoint**: https://payboocmcp.vercel.app/api/mcp-server
- **Protocol**: JSON-RPC 2.0 over HTTPS
- **Auto-deploy**: Every push to `main` branch

## 📚 Documentation

- **[REMOTE_MCP_SETUP.md](REMOTE_MCP_SETUP.md)** - Detailed setup guide with troubleshooting

## 🔐 Security

- HTTPS only (Vercel automatic SSL)
- CORS enabled for cross-origin requests
- No authentication (public read-only access)
- CSV files are version-controlled

## 🆚 Remote vs Local MCP

| Feature | Remote MCP | Local MCP |
|---------|-----------|-----------|
| Setup | Simple (proxy only) | Complex (build + config) |
| Access | Anywhere | Local only |
| Speed | ~100-500ms | ~10ms |
| Sharing | Easy (same URL) | Hard (each setup) |
| Updates | Auto (Vercel) | Manual rebuild |

## 🤝 Contributing

1. Fork the repository
2. Add your CSV files to `data/`
3. Create a pull request

## 📄 License

MIT

## 🔗 Links

- **GitHub**: https://github.com/newbieYond/payboocmcp
- **Remote MCP Server**: https://payboocmcp.vercel.app/api/mcp-server
- **MCP Specification**: https://spec.modelcontextprotocol.io/

---

**Built with**: TypeScript, Vercel, Model Context Protocol
**Generated with**: Claude Code
**Ready for**: Production use with Claude Desktop
