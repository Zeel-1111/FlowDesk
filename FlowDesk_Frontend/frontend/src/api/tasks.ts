import api from './axios';
import type { Task, CreateTaskDto } from '../types/index';

export const taskService = {
  getAll: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/Tasks');
    return response.data;
  },

  create: async (data: CreateTaskDto): Promise<Task> => {
    const response = await api.post<Task>('/Tasks', data);
    return response.data;
  },

  update: async (id: string, data: CreateTaskDto): Promise<Task> => {
    const response = await api.put<Task>(`/Tasks/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/Tasks/${id}`);
  },
};