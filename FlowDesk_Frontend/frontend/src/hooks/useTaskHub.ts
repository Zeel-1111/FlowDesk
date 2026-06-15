import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { type Task } from '../types';

interface UseTaskHubProps {
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (id: string) => void;
}

export function useTaskHub({ onTaskCreated, onTaskUpdated, onTaskDeleted }: UseTaskHubProps) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  
  // Use a ref to store the latest callbacks so we don't need to reconnect on callback changes
  const callbacksRef = useRef({ onTaskCreated, onTaskUpdated, onTaskDeleted });
  
  useEffect(() => {
    callbacksRef.current = { onTaskCreated, onTaskUpdated, onTaskDeleted };
  }, [onTaskCreated, onTaskUpdated, onTaskDeleted]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7219/hubs/tasks', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection.on('TaskCreated', (task: Task) => callbacksRef.current.onTaskCreated(task));
    connection.on('TaskUpdated', (task: Task) => callbacksRef.current.onTaskUpdated(task));
    connection.on('TaskDeleted', (id: string) => callbacksRef.current.onTaskDeleted(id));

    connectionRef.current = connection;

    // Delay start slightly to avoid AbortError in React 18 Strict Mode
    // where components mount and unmount immediately.
    const startTimer = setTimeout(() => {
      connection.start().catch((err) => {
        console.error('SignalR connection error:', err);
      });
    }, 50);

    return () => {
      clearTimeout(startTimer);
      if (connection.state !== signalR.HubConnectionState.Disconnected) {
        connection.stop();
      }
      connectionRef.current = null;
    };
  }, []);
}