import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readdirSync } from 'fs';
import { join } from 'path';

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

    return res.status(200).json({
      success: true,
      count: files.length,
      files: files
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to list CSV files',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
