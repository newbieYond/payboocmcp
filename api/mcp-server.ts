import type { VercelRequest, VercelResponse } from '@vercel/node';
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

//  MCP JSON-RPC handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(200).json({
      name: 'payboocmcp-remote',
      version: '1.0.0',
      description: 'MCP server for CSV URL processing',
      protocol: 'mcp',
      message: 'Send POST requests with JSON-RPC 2.0 format',
    });
  }

  try {
    // Parse body if it's a string, handle empty body
    let request;

    if (!req.body || (typeof req.body === 'string' && req.body.trim() === '')) {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error: Empty request body',
        },
      });
    }

    if (typeof req.body === 'string') {
      try {
        request = JSON.parse(req.body);
      } catch (e) {
        return res.status(400).json({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error: Invalid JSON',
          },
        });
      }
    } else {
      request = req.body;
    }

    if (!request || request.jsonrpc !== '2.0') {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: request?.id || null,
        error: {
          code: -32600,
          message: 'Invalid Request',
        },
      });
    }

    const { method, params, id } = request;

    // Handle initialize (MCP handshake)
    if (method === 'initialize') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
          },
          serverInfo: {
            name: 'payboocmcp-remote',
            version: '1.0.0',
          },
        },
      });
    }

    // Handle initialized (notification)
    if (method === 'notifications/initialized') {
      return res.status(200).end();
    }

    // Handle tools/list
    if (method === 'tools/list') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: {
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
        },
      });
    }

    // Handle tools/call
    if (method === 'tools/call') {
      const toolName = params?.name;
      const args = params?.arguments || {};

      if (toolName === 'list_csv_files') {
        const files = getCSVFiles();
        return res.status(200).json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(files, null, 2),
              },
            ],
          },
        });
      }

      if (toolName === 'get_urls_from_csv') {
        const filename = args.filename;
        if (!filename) {
          return res.status(200).json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'Invalid params: filename is required',
            },
          });
        }

        const data = readCSVFile(filename);
        const urls = organizeURLs(data);

        return res.status(200).json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(urls, null, 2),
              },
            ],
          },
        });
      }

      if (toolName === 'get_all_urls') {
        const files = getCSVFiles();
        const allUrls: Record<string, OrganizedURLs> = {};

        for (const file of files) {
          const data = readCSVFile(file);
          allUrls[file] = organizeURLs(data);
        }

        return res.status(200).json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(allUrls, null, 2),
              },
            ],
          },
        });
      }

      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Unknown tool: ${toolName}`,
        },
      });
    }

    // Handle resources/list
    if (method === 'resources/list') {
      const files = getCSVFiles();
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: {
          resources: files.map((file) => ({
            uri: `csv://${file}`,
            name: file,
            description: `CSV file: ${file}`,
            mimeType: 'text/csv',
          })),
        },
      });
    }

    // Handle resources/read
    if (method === 'resources/read') {
      const uri = params?.uri;
      if (!uri) {
        return res.status(200).json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32602,
            message: 'Invalid params: uri is required',
          },
        });
      }

      const filename = uri.replace('csv://', '');
      const data = readCSVFile(filename);
      const urls = organizeURLs(data);

      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(urls, null, 2),
            },
          ],
        },
      });
    }

    // Method not found
    return res.status(200).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
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
