import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';

// Dummy WhatsApp controller for production (bot runs separately)

export const getQRCode = async (req: Request, res: Response) => {
  res.json({ 
    message: 'WhatsApp bot runs separately in chat-auto service',
    connected: false 
  });
};

export const getConnectionStatus = async (req: Request, res: Response) => {
  res.json({ 
    connected: false,
    message: 'WhatsApp bot runs separately in chat-auto service'
  });
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  res.json({ 
    success: false,
    message: 'WhatsApp bot runs separately in chat-auto service'
  });
};

export const disconnect = async (req: Request, res: Response) => {
  res.json({ 
    success: false,
    message: 'WhatsApp bot runs separately in chat-auto service'
  });
};

export const reconnect = async (req: Request, res: Response) => {
  res.json({ 
    success: false,
    message: 'WhatsApp bot runs separately in chat-auto service'
  });
};
