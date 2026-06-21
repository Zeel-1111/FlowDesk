export interface User {
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
}

export const Priority = {
  Low: 1,
  Medium: 2,
  High: 3,
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

export const TaskStatus = {
  Todo: 1,
  InProgress: 2,
  InReview: 3,
  Done: 4,
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export const NotificationType = {
  DueIn24Hours: 1,
  DueIn1Hour: 2,
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export interface NotificationDto {
  id: string;
  taskId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface AITaskSuggestion {
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
}

export interface ParseTaskRequest {
  input: string;
}