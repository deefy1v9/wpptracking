import type { Request, Response, NextFunction } from 'express';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[error]', err);
  res.status(500).json({ error: err.message ?? 'Erro interno do servidor' });
}
