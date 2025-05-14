import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

// Types
export interface WebhookEvent {
  event: 'email_opened' | 'link_clicked' | 'form_submitted' | 'email_reported';
  email: string;
  campaignId: string;
  campaignName?: string;
  userId?: string;
  details?: {
    message?: string;
    payload?: any;
  };
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

// Create socket connection
let socket: Socket | null = null;

// Initialize socket
export const initSocket = () => {
  if (socket) return socket;
  
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  
  socket = io(SOCKET_URL, {
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: true,
    withCredentials: true,
    transports: ['websocket', 'polling']
  });
  
  // Connection events
  socket.on('connect', () => {
    console.log('Connected to WebSocket');
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  // Webhook event handler
  socket.on('webhook-event', (data: WebhookEvent) => {
    const eventTypes: Record<string, { message: string, type: 'success' | 'info' | 'warning' | 'error' }> = {
      'email_opened': { 
        message: `${data.email} opened the email`, 
        type: 'info' 
      },
      'link_clicked': { 
        message: `${data.email} clicked a link`, 
        type: 'warning' 
      },
      'form_submitted': { 
        message: `${data.email} submitted credentials`, 
        type: 'success' 
      },
      'email_reported': { 
        message: `${data.email} reported the email`, 
        type: 'error' 
      }
    };
    
    const eventInfo = eventTypes[data.event] || { 
      message: `New event for ${data.email}`, 
      type: 'info' 
    };
    
    toast[eventInfo.type](eventInfo.message, {
      description: `Campaign: ${data.campaignName || data.campaignId}`
    });
    
    // Dispatch custom event for components to listen to
    const customEvent = new CustomEvent('gophish-webhook', { detail: data });
    window.dispatchEvent(customEvent);
  });
  
  return socket;
};

// Get socket instance
export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initSocket,
  getSocket,
  disconnectSocket
}; 