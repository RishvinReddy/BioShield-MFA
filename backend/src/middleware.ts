import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyToken } from './authUtils';

// Custom Error Class
export class AppError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

// --- RATE LIMITER ---
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 429,
      message: 'Too many requests, please try again later.'
    }
  }
});

// --- AUTHENTICATION ---
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Unauthorized: Missing or invalid token format'));
  }

  const token = authHeader.split(' ')[1];

  // Decode token
  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new AppError(403, 'Forbidden: Token expired or invalid'));
  }

  // Populate req.user
  (req as any).user = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role as 'USER' | 'ADMIN' | 'AUDITOR'
  };
  next();
};

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user || !allowedRoles.includes((req as any).user.role)) {
      return next(new AppError(403, `Access Denied: Requires one of roles [${allowedRoles.join(', ')}]`));
    }
    next();
  };
};

// --- VALIDATION ---
export const validateEnrollment = (req: Request, res: Response, next: NextFunction) => {
  const { userId, modality } = req.body;
  const validModalities = ['face', 'voice', 'palm', 'behavioral'];

  if (!userId || typeof userId !== 'string') {
    return next(new AppError(400, 'Validation Error: userId is required and must be a string'));
  }

  if (!modality || !validModalities.includes(modality)) {
    return next(new AppError(400, `Validation Error: Invalid modality. Allowed: ${validModalities.join(', ')}`));
  }

  next();
};

// --- ERROR HANDLER ---
export const errorHandler = (err: any, req: any, res: any, next: NextFunction) => {
  console.error('❌ Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode,
      message: message
    }
  });
};