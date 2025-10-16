import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const proxyPath = join(process.cwd(), 'public', 'mcp-proxy.cjs');
    const proxy = readFileSync(proxyPath, 'utf-8');

    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename=mcp-proxy.cjs');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    return res.status(200).send(proxy);
  } catch (error) {
    return res.status(404).json({
      error: 'Proxy script not found',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
