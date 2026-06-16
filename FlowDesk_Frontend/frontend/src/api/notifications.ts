import api from './axios';
import { type NotificationDto } from '../types';

export const notificationService = {
  getUnread: async (): Promise<NotificationDto[]> => {
    const response = await api.get<NotificationDto[]>('/Notifications/unread');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/Notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/Notifications/read-all');
  },
};