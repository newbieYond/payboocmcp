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

interface TrackingLink {
  campaign: string;
  adMaterial: string;
  content: string;
  keyword: string;
  deepLink: string;
  trackingLink: string;
}

interface SearchResult {
  query: string;
  matches: TrackingLink[];
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

function searchTrackingLinks(query: string): SearchResult {
  const filePath = join(DATA_DIR, 'links.csv');
  const fileContent = readFileSync(filePath, 'utf-8');
  const rows = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const normalizedQuery = query.toLowerCase().trim();
  const matches: TrackingLink[] = [];

  for (const row of rows) {
    const campaign = row['캠페인'] || '';
    const adMaterial = row['광고 소재'] || '';
    const content = row['콘텐츠'] || '';
    const keyword = row['키워드'] || '';
    const deepLink = row['딥링크'] || '';
    const trackingLink = row['트래킹 링크'] || '';

    // Search in all fields
    const searchText = `${campaign} ${adMaterial} ${content} ${keyword} ${deepLink} ${trackingLink}`.toLowerCase();

    if (searchText.includes(normalizedQuery)) {
      matches.push({
        campaign,
        adMaterial,
        content,
        keyword,
        deepLink,
        trackingLink,
      });
    }
  }

  return {
    query,
    matches,
    total: matches.length,
  };
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
      name: '링크찾기',
      version: '1.0.0',
      description: '페이북 트래킹 링크 검색 서버',
      protocol: 'mcp',
      message: 'Send POST requests with JSON-RPC 2.0 format',
    });
  }

  try {
    // Debug logging
    console.log('Request body type:', typeof req.body);
    console.log('Request body:', JSON.stringify(req.body).substring(0, 200));

    // Parse body if it's a string, handle empty body
    let request;

    if (!req.body || (typeof req.body === 'string' && req.body.trim() === '')) {
      console.error('Empty body received');
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
        console.error('JSON parse error:', e);
        return res.status(400).json({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: `Parse error: ${e instanceof Error ? e.message : 'Invalid JSON'}`,
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
          },
          serverInfo: {
            name: '링크찾기',
            version: '1.0.0',
          },
        },
      });
    }

    // Handle initialized (notification - no response needed)
    if (method === 'notifications/initialized') {
      // Notifications don't get responses, just acknowledge
      return res.status(204).end();
    }

    // Handle prompts/list
    if (method === 'prompts/list') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: {
          prompts: [],
        },
      });
    }

    // Handle tools/list
    if (method === 'tools/list') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'search_links',
              description: '텍스트로 페이북 트래킹 링크 검색 (캠페인, 콘텐츠, 키워드 등으로 검색)',
              inputSchema: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: '검색할 텍스트 (예: "카드", "이벤트", "lotto" 등)',
                  },
                },
                required: ['query'],
              },
            },
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

      if (toolName === 'search_links') {
        const query = args.query;
        if (!query) {
          return res.status(200).json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'Invalid params: query is required',
            },
          });
        }

        const results = searchTrackingLinks(query);

        return res.status(200).json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(results, null, 2),
              },
            ],
          },
        });
      }

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

    // Handle resources/list - return empty for now (CSV format not supported in Claude Desktop)
    if (method === 'resources/list') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: {
          resources: [],
        },
      });
    }

    // Handle resources/read
    if (method === 'resources/read') {
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: 'Resources not supported - use search_links tool instead',
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
