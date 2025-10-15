# PaybooCMCP - CSV URL Processor MCP Server

TypeScript-based Model Context Protocol (MCP) server for processing CSV files and extracting organized URL links.

## Features

- **CSV File Processing**: Read and parse CSV files from the `data/` directory
- **URL Extraction**: Automatically extract URLs from any column in CSV files
- **Categorization**: Organize URLs by category (if present in CSV)
- **MCP Tools**: Three main tools for accessing CSV data
- **MCP Resources**: Expose CSV files as resources with URI scheme `csv://`

## Project Structure

```
payboocmcp/
├── src/
│   ├── index.ts           # Main MCP server implementation
│   └── csv-processor.ts   # CSV parsing and URL extraction logic
├── data/                  # CSV files directory
│   ├── example-links.csv
│   └── sample-urls.csv
├── api/                   # Vercel serverless functions
│   └── mcp.ts
├── dist/                  # Compiled JavaScript output
├── package.json
├── tsconfig.json
├── vercel.json            # Vercel deployment configuration
└── README.md
```

## Installation

```bash
npm install
```

## Development

Run the server in development mode with auto-reload:

```bash
npm run dev
```

## Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

## Usage

### MCP Tools

The server provides three tools:

1. **get_urls_from_csv**
   - Extract URLs from a specific CSV file
   - Input: `{ filename: "example-links.csv" }`
   - Returns: Organized URLs with categories and totals

2. **list_csv_files**
   - List all available CSV files in the data directory
   - Input: `{}`
   - Returns: Array of CSV filenames

3. **get_all_urls**
   - Get all URLs from all CSV files
   - Input: `{}`
   - Returns: Object with URLs organized by filename

### MCP Resources

CSV files are exposed as resources with the URI scheme:
- `csv://example-links.csv`
- `csv://sample-urls.csv`

### CSV File Format

CSV files should have headers and can include URLs in any column. Optional `category` column for organization:

```csv
category,title,url,description
Documentation,TypeScript,https://www.typescriptlang.org/docs/,Official docs
Tools,GitHub,https://github.com,Code hosting
```

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "payboocmcp": {
      "command": "node",
      "args": ["/absolute/path/to/payboocmcp/dist/index.js"],
      "env": {
        "CSV_DATA_DIR": "/absolute/path/to/payboocmcp/data"
      }
    }
  }
}
```

### Environment Variables

- `CSV_DATA_DIR`: Path to the directory containing CSV files (default: `./data`)

## Deployment

### Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Production Deployment**:
   ```bash
   vercel --prod
   ```

### GitHub Integration

1. **Create GitHub Repository**:
   ```bash
   git add .
   git commit -m "Initial commit: TypeScript MCP server for CSV URL processing"
   git branch -M main
   git remote add origin https://github.com/yourusername/payboocmcp.git
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure build settings (auto-detected from `vercel.json`)
   - Deploy

3. **Auto-Deploy on Push**:
   - Every push to `main` triggers automatic deployment
   - Pull requests create preview deployments

## Technical Details

### Dependencies

- `@modelcontextprotocol/sdk`: MCP server implementation
- `csv-parse`: Fast and reliable CSV parsing
- `typescript`: Type-safe development
- `tsx`: Development runner for TypeScript

### MCP Capabilities

- **Tools**: Three tools for CSV file interaction
- **Resources**: Dynamic resource listing of CSV files

### URL Extraction

The server uses regex pattern matching to extract URLs from any CSV column:
- Supports `http://` and `https://` protocols
- Deduplicates URLs automatically
- Categorizes based on CSV columns (`category`, `type`, etc.)

## Example Output

```json
{
  "urls": [
    "https://www.typescriptlang.org/docs/",
    "https://nodejs.org/en/docs/",
    "https://github.com/modelcontextprotocol/sdk"
  ],
  "categorized": {
    "Documentation": [
      "https://www.typescriptlang.org/docs/",
      "https://nodejs.org/en/docs/"
    ],
    "MCP": [
      "https://github.com/modelcontextprotocol/sdk"
    ]
  },
  "total": 3
}
```

## License

MIT

## Notes

- MCP servers typically run via stdio transport, not HTTP
- The Vercel deployment provides an API endpoint but is primarily for code hosting
- Local usage via Claude Desktop is the recommended integration method
