import 'express';

declare module 'express' {
  interface Request {
    requestId?: string;
    user?: {
      id?: number;
      name?: string;
      email?: string;
      role?: string;
    };
  }
}

export {};
