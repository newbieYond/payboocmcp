import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(200).json({
    message: 'MCP Server endpoint',
    note: 'This is a placeholder for Vercel deployment. MCP servers typically run via stdio, not HTTP.',
    documentation: 'See README.md for local usage instructions'
  });
}
