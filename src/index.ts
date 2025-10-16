#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { searchTrackingLinks } from './csv-processor.js';

const server = new Server(
  {
    name: '페이북 정보',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
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

  console.error('페이북 정보 MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
