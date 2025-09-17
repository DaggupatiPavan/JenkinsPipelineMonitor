import { Server } from 'socket.io';

export interface PipelineUpdate {
  id: string;
  name: string;
  status: 'running' | 'success' | 'failed' | 'pending';
  progress?: number;
  stage?: string;
  timestamp: string;
  message?: string;
}

export interface NotificationUpdate {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  pipelineId?: string;
}

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join rooms for specific pipeline monitoring
    socket.on('join-pipeline', (pipelineId: string) => {
      socket.join(`pipeline-${pipelineId}`);
      console.log(`Client ${socket.id} joined pipeline ${pipelineId}`);
    });

    // Leave pipeline rooms
    socket.on('leave-pipeline', (pipelineId: string) => {
      socket.leave(`pipeline-${pipelineId}`);
      console.log(`Client ${socket.id} left pipeline ${pipelineId}`);
    });

    // Join general notifications room
    socket.on('join-notifications', () => {
      socket.join('notifications');
      console.log(`Client ${socket.id} joined notifications room`);
    });

    // Handle pipeline status updates
    socket.on('pipeline-update', (update: PipelineUpdate) => {
      // Broadcast to all clients monitoring this pipeline
      io.to(`pipeline-${update.id}`).emit('pipeline-update', update);
      
      // Also broadcast to general monitoring room
      io.to('monitoring').emit('pipeline-update', update);
    });

    // Handle notification broadcasts
    socket.on('notification', (notification: NotificationUpdate) => {
      // Broadcast to all clients in notifications room
      io.to('notifications').emit('notification', notification);
      
      // If notification is pipeline-specific, also send to pipeline room
      if (notification.pipelineId) {
        io.to(`pipeline-${notification.pipelineId}`).emit('notification', notification);
      }
    });

    // Handle system alerts
    socket.on('system-alert', (alert: {
      type: string;
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      timestamp: string;
    }) => {
      // Broadcast to all connected clients
      io.emit('system-alert', alert);
    });

    // Handle Jenkins status updates
    socket.on('jenkins-status', (status: {
      connected: boolean;
      lastUpdate: string;
      pipelineCount: number;
      error?: string;
    }) => {
      // Broadcast Jenkins status to all monitoring clients
      io.to('monitoring').emit('jenkins-status', status);
    });

    // Handle real-time log updates
    socket.on('log-update', (logData: {
      pipelineId: string;
      stage: string;
      level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
      message: string;
      timestamp: string;
    }) => {
      // Broadcast to clients monitoring this pipeline
      io.to(`pipeline-${logData.pipelineId}`).emit('log-update', logData);
    });

    // Handle bulk pipeline updates
    socket.on('bulk-pipeline-updates', (updates: PipelineUpdate[]) => {
      // Broadcast to monitoring room
      io.to('monitoring').emit('bulk-pipeline-updates', updates);
    });

    // Handle failure analysis updates
    socket.on('failure-analysis', (analysis: {
      pipelineId: string;
      failureReason: string;
      category: string;
      confidence: number;
      suggestedActions: string[];
      timestamp: string;
    }) => {
      // Broadcast to clients monitoring this pipeline
      io.to(`pipeline-${analysis.pipelineId}`).emit('failure-analysis', analysis);
      
      // Also broadcast to general monitoring room for analytics
      io.to('monitoring').emit('failure-analysis', analysis);
    });

    // Handle heartbeat/ping for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message with available rooms
    socket.emit('connected', {
      message: 'Connected to Jenkins Pipeline Monitor WebSocket',
      timestamp: new Date().toISOString(),
      availableRooms: [
        'monitoring',
        'notifications',
        'pipeline-{pipelineId}'
      ]
    });
  });
};