import api from './axios';
import { type AITaskSuggestion } from '../types';

export const aiService = {
  parseTask: async (input: string): Promise<AITaskSuggestion> => {
    const response = await api.post<AITaskSuggestion>('/AI/parse-task', { input });
    return response.data;
  },
};