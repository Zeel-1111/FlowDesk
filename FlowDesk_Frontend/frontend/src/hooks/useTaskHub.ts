import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { type Task, type NotificationDto } from '../types';

interface UseTaskHubProps {
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (id: string) => void;
  onNotificationReceived: (notification: NotificationDto) => void;
}

export function useTaskHub({
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onNotificationReceived,
}: UseTaskHubProps) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (connectionRef.current) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL?.replace('/api', '')}/hubs/tasks`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection.on('TaskCreated', (task: Task) => onTaskCreated(task));
    connection.on('TaskUpdated', (task: Task) => onTaskUpdated(task));
    connection.on('TaskDeleted', (id: string) => onTaskDeleted(id));
    connection.on('NotificationReceived', (notification: NotificationDto) => {
      console.log('🔔 Notification received:', notification);
      onNotificationReceived(notification);
    });

    connectionRef.current = connection;

    connection.start()
      .then(() => console.log('✅ SignalR connected:', connection.state))
      .catch((err) => {
        if (err.message && err.message.includes('stopped during negotiation')) {
          // This is a harmless error caused by React StrictMode unmounting the component
          // while the connection is still starting up.
          return;
        }
        console.error('SignalR connection error:', err);
      });

    return () => {
      connection.stop();
      connectionRef.current = null;
    };
  }, []);
}