# Usage Guide

How to use the PaybooCMCP server with Claude Desktop and MCP clients.

## Quick Start

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Configure Claude Desktop** (see [DEPLOYMENT.md](DEPLOYMENT.md#step-5-local-mcp-usage))

3. **Restart Claude Desktop**

4. **Use MCP tools** in Claude conversations

## MCP Tools

### 1. get_urls_from_csv

Extract URLs from a specific CSV file.

**Usage in Claude**:
```
Can you get URLs from example-links.csv?
```

**Direct MCP call**:
```json
{
  "name": "get_urls_from_csv",
  "arguments": {
    "filename": "example-links.csv"
  }
}
```

**Response**:
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

### 2. list_csv_files

List all CSV files available in the data directory.

**Usage in Claude**:
```
What CSV files are available?
```

**Direct MCP call**:
```json
{
  "name": "list_csv_files",
  "arguments": {}
}
```

**Response**:
```json
[
  "example-links.csv",
  "sample-urls.csv"
]
```

### 3. get_all_urls

Get URLs from all CSV files, organized by filename.

**Usage in Claude**:
```
Show me all URLs from all CSV files
```

**Direct MCP call**:
```json
{
  "name": "get_all_urls",
  "arguments": {}
}
```

**Response**:
```json
{
  "example-links.csv": {
    "urls": ["https://...", "https://..."],
    "categorized": { "Documentation": [...] },
    "total": 8
  },
  "sample-urls.csv": {
    "urls": ["https://...", "https://..."],
    "categorized": { "Tutorial": [...] },
    "total": 4
  }
}
```

## MCP Resources

Access CSV files as resources with `csv://` URI scheme.

**Available resources**:
- `csv://example-links.csv`
- `csv://sample-urls.csv`

**Read resource**:
```json
{
  "uri": "csv://example-links.csv"
}
```

Returns organized URL data from the specified CSV file.

## CSV File Format

### Standard Format

```csv
category,title,url,description
Documentation,TypeScript Docs,https://www.typescriptlang.org/docs/,Official TypeScript documentation
Tools,GitHub,https://github.com,Code hosting platform
```

**Fields**:
- `category` or `type`: Used for organizing URLs (optional)
- `url` or `link`: URL column (can be in any column)
- Other columns: Any additional data

### Flexible Format

URLs can appear in **any column**. The parser automatically detects URLs using pattern matching.

```csv
name,website,notes
TypeScript,https://typescriptlang.org,Programming language
Node.js,https://nodejs.org,JavaScript runtime
```

### Multiple URLs per Row

```csv
resource,primary_url,backup_url,documentation
API,https://api.example.com,https://backup.example.com,https://docs.example.com
```

All URLs are extracted and deduplicated.

## Adding Your Own CSV Files

1. **Create CSV file** in `data/` directory:
   ```bash
   touch data/my-links.csv
   ```

2. **Add content**:
   ```csv
   category,name,url
   Blog,Tech Blog,https://techblog.example.com
   Tutorial,MCP Guide,https://mcp-tutorial.example.com
   ```

3. **Rebuild** (if needed):
   ```bash
   npm run build
   ```

4. **Restart Claude Desktop**

5. **Use the file**:
   ```
   Get URLs from my-links.csv
   ```

## Environment Variables

### CSV_DATA_DIR

Override the default data directory location.

**Claude Desktop config**:
```json
{
  "mcpServers": {
    "payboocmcp": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "CSV_DATA_DIR": "/custom/path/to/csv/files"
      }
    }
  }
}
```

## Example Conversations

### Example 1: Research Links

**User**: "I need to organize research links for my project"

**Claude**: "I can help! First, let me see what CSV files you have available."
*[Uses list_csv_files tool]*

**Claude**: "I found example-links.csv and sample-urls.csv. Would you like me to get URLs from a specific file, or all of them?"

**User**: "Get all URLs"

**Claude**: *[Uses get_all_urls tool]* "Here are all your URLs organized by category..."

### Example 2: Add New Links

**User**: "Can you help me create a CSV file for my bookmarks?"

**Claude**: "Sure! What categories of bookmarks do you want to organize?"

**User**: "Development tools, documentation, and tutorials"

**Claude**: "I'll create a CSV file structure for you. You can add it to the data/ directory..."

## Integration Examples

### With Other MCP Servers

Combine with other MCP servers for enhanced workflows:

```
User: "Fetch the content from the URLs in example-links.csv and summarize them"

Claude:
1. Uses PaybooCMCP to get URLs
2. Uses web-fetch MCP to retrieve content
3. Summarizes the content
```

### Programmatic Usage

```typescript
import { readCSVFile, organizeURLs } from './csv-processor.js';

const data = await readCSVFile('example-links.csv');
const urls = organizeURLs(data);

console.log(`Found ${urls.total} URLs`);
console.log('Categories:', Object.keys(urls.categorized));
```

## Troubleshooting

### "File not found" Error

**Cause**: CSV file doesn't exist in data directory

**Solution**:
```bash
ls data/  # Check what files exist
# Ensure filename matches exactly (case-sensitive)
```

### "No URLs found" Message

**Cause**: CSV doesn't contain valid URLs

**Solution**:
- Ensure URLs start with `http://` or `https://`
- Check CSV is properly formatted
- Verify data isn't corrupted

### Server Not Responding

**Cause**: Server not running or misconfigured

**Solution**:
1. Rebuild: `npm run build`
2. Check Claude Desktop config paths
3. Restart Claude Desktop
4. Check logs in Claude Desktop console

## Performance Notes

- **CSV Parsing**: Fast for files up to 10MB
- **URL Extraction**: Regex-based, handles 1000s of URLs efficiently
- **Memory**: Loads entire CSV into memory (consider for very large files)

## Best Practices

1. **Organize by Category**: Use `category` column for better organization
2. **Descriptive Names**: Use clear CSV filenames
3. **Regular Updates**: Rebuild after adding new CSV files
4. **Version Control**: Commit CSV files to track changes
5. **Validation**: Check CSV format before adding to data directory

## API Reference

See [README.md](README.md#mcp-tools) for complete API documentation.

## Next Steps

- Customize URL extraction logic in [csv-processor.ts](src/csv-processor.ts)
- Add validation for CSV structure
- Implement caching for large CSV files
- Add support for remote CSV URLs
