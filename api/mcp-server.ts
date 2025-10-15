import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

interface CSVRow {
  [key: string]: string;
}

interface OrganizedURLs {
  urls: string[];
  categorized: Record<string, string[]>;
  total: number;
}

const DATA_DIR = join(process.cwd(), 'data');

function extractURLs(data: CSVRow[]): string[] {
  const urlPattern = /https?:\/\/[^\s]+/g;
  const urls: string[] = [];

  for (const row of data) {
    for (const value of Object.values(row)) {
      if (typeof value === 'string') {
        const matches = value.match(urlPattern);
        if (matches) {
          urls.push(...matches);
        }
      }
    }
  }

  return [...new Set(urls)];
}

function organizeURLs(data: CSVRow[]): OrganizedURLs {
  const urls = extractURLs(data);
  const categorized: Record<string, string[]> = {};

  for (const row of data) {
    const category = row.category || row.Category || row.type || row.Type || 'uncategorized';

    if (!categorized[category]) {
      categorized[category] = [];
    }

    for (const value of Object.values(row)) {
      if (typeof value === 'string') {
        const urlPattern = /https?:\/\/[^\s]+/g;
        const matches = value.match(urlPattern);
        if (matches) {
          categorized[category].push(...matches);
        }
      }
    }
  }

  Object.keys(categorized).forEach(key => {
    categorized[key] = [...new Set(categorized[key])];
  });

  return {
    urls,
    categorized,
    total: urls.length,
  };
}

function readCSVFile(filename: string): CSVRow[] {
  const filePath = join(DATA_DIR, filename);
  const fileContent = readFileSync(filePath, 'utf-8');
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function getCSVFiles(): string[] {
  return readdirSync(DATA_DIR).filter(file => file.endsWith('.csv'));
}

// Create MCP server instance
const server = new Server(
  {
    name: 'payboocmcp-remote',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Set up tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_urls_from_csv',
        description: 'Extract and organize URLs from a CSV file',
        inputSchema: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Name of the CSV file to process',
            },
          },
          required: ['filename'],
        },
      },
      {
        name: 'list_csv_files',
        description: 'List all available CSV files',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_all_urls',
        description: 'Get all URLs from all CSV files',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'get_urls_from_csv') {
      const filename = args?.filename as string;
      if (!filename) {
        throw new Error('Filename is required');
      }

      const data = readCSVFile(filename);
      const urls = organizeURLs(data);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(urls, null, 2),
          },
        ],
      };
    } else if (name === 'list_csv_files') {
      const files = getCSVFiles();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(files, null, 2),
          },
        ],
      };
    } else if (name === 'get_all_urls') {
      const files = getCSVFiles();
      const allUrls: Record<string, OrganizedURLs> = {};

      for (const file of files) {
        const data = readCSVFile(file);
        allUrls[file] = organizeURLs(data);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(allUrls, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const files = getCSVFiles();

  return {
    resources: files.map((file) => ({
      uri: `csv://${file}`,
      name: file,
      description: `CSV file: ${file}`,
      mimeType: 'text/csv',
    })),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const filename = uri.replace('csv://', '');

  try {
    const data = readCSVFile(filename);
    const urls = organizeURLs(data);

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(urls, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to read resource ${uri}: ${errorMessage}`);
  }
});

// HTTP handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'This is an MCP server endpoint. Use POST with JSON-RPC 2.0 format.',
    });
  }

  try {
    const request = req.body;

    // Handle MCP protocol requests
    if (request.jsonrpc === '2.0' && request.method) {
      // Process the request through the MCP server
      let result;

      if (request.method === 'tools/list') {
        const handler = server['requestHandlers'].get(ListToolsRequestSchema);
        result = await handler(request);
      } else if (request.method === 'tools/call') {
        const handler = server['requestHandlers'].get(CallToolRequestSchema);
        result = await handler(request);
      } else if (request.method === 'resources/list') {
        const handler = server['requestHandlers'].get(ListResourcesRequestSchema);
        result = await handler(request);
      } else if (request.method === 'resources/read') {
        const handler = server['requestHandlers'].get(ReadResourceRequestSchema);
        result = await handler(request);
      } else {
        return res.status(400).json({
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: 'Method not found',
          },
        });
      }

      return res.status(200).json({
        jsonrpc: '2.0',
        id: request.id,
        result,
      });
    }

    return res.status(400).json({
      error: 'Invalid request format',
      message: 'Expected JSON-RPC 2.0 request',
    });
  } catch (error) {
    return res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
