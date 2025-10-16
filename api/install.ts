import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const scriptPath = join(process.cwd(), 'public', 'install.sh');
    const script = readFileSync(scriptPath, 'utf-8');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename=payboocmcp-install.sh');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    return res.status(200).send(script);
  } catch (error) {
    return res.status(404).json({
      error: 'Install script not found',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
