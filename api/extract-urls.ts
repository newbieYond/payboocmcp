import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get filename from query param or body
    const filename = req.method === 'GET'
      ? req.query.filename as string
      : req.body?.filename;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required',
        usage: 'GET /api/extract-urls?filename=example.csv or POST /api/extract-urls with JSON body'
      });
    }

    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }

    const filePath = join(process.cwd(), 'data', filename);
    const fileContent = readFileSync(filePath, 'utf-8');

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const result = organizeURLs(records);

    return res.status(200).json({
      success: true,
      filename,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process CSV file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
