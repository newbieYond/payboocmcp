import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readdirSync, readFileSync } from 'fs';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dataDir = join(process.cwd(), 'data');
    const files = readdirSync(dataDir).filter(file => file.endsWith('.csv'));

    const allUrls: Record<string, OrganizedURLs> = {};

    for (const file of files) {
      const filePath = join(dataDir, file);
      const fileContent = readFileSync(filePath, 'utf-8');

      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      allUrls[file] = organizeURLs(records);
    }

    return res.status(200).json({
      success: true,
      count: files.length,
      data: allUrls
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process CSV files',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
