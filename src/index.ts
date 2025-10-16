#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readCSVFile, getCSVFiles, organizeURLs, searchTrackingLinks } from './csv-processor.js';

const server = new Server(
  {
    name: 'payboocmcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_links',
        description: '페이북 트래킹 링크를 텍스트로 검색합니다 (캠페인, 콘텐츠, 키워드 등)',
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
              description: 'Name of the CSV file to process (without path)',
            },
          },
          required: ['filename'],
        },
      },
      {
        name: 'list_csv_files',
        description: 'List all available CSV files in the data directory',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_all_urls',
        description: 'Get all URLs from all CSV files, organized by file',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'search_links') {
      const query = args?.query as string;
      if (!query) {
        throw new Error('Query is required');
      }

      const results = await searchTrackingLinks(query);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } else if (name === 'get_urls_from_csv') {
      const filename = args?.filename as string;
      if (!filename) {
        throw new Error('Filename is required');
      }

      const data = await readCSVFile(filename);
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
      const files = await getCSVFiles();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(files, null, 2),
          },
        ],
      };
    } else if (name === 'get_all_urls') {
      const files = await getCSVFiles();
      const allUrls: Record<string, any> = {};

      for (const file of files) {
        const data = await readCSVFile(file);
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

// List resources (CSV files as resources)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const files = await getCSVFiles();

  return {
    resources: files.map((file) => ({
      uri: `csv://${file}`,
      name: file,
      description: `CSV file containing URLs: ${file}`,
      mimeType: 'text/csv',
    })),
  };
});

// Read resource (get URLs from a specific CSV file)
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const filename = uri.replace('csv://', '');

  try {
    const data = await readCSVFile(filename);
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

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'find-paybooc-links',
        description: '페이북 트래킹 링크를 검색합니다',
        arguments: [
          {
            name: 'keyword',
            description: '검색할 키워드 (선택사항)',
            required: false,
          },
        ],
      },
    ],
  };
});

// Get prompt
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'find-paybooc-links') {
    const keyword = args?.keyword as string | undefined;

    if (keyword) {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `페이북 링크 찾아줘: ${keyword}`,
            },
          },
        ],
      };
    } else {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: '페이북 링크 찾아줘',
            },
          },
        ],
      };
    }
  }

  throw new Error(`Unknown prompt: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('PaybooCMCP MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
