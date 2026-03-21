import { apiClient } from '@/lib/api-client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
}

export const aiService = {
  async ask(repoId: string, question: string, sessionId?: string) {
    const res = await apiClient.post(`/ai/repos/${repoId}/ask`, { question, sessionId });
    return res.data.data as { answer: string; sessionId: string; sources: string[] };
  },
  async getOnboarding(repoId: string) {
    const res = await apiClient.get(`/ai/repos/${repoId}/onboarding`);
    return res.data.data as { guide: string };
  },
  async getSessions(repoId: string) {
    const res = await apiClient.get(`/ai/repos/${repoId}/sessions`);
    return res.data.data as { sessions: ChatSession[] };
  },
  async getSession(sessionId: string) {
    const res = await apiClient.get(`/ai/sessions/${sessionId}`);
    return res.data.data as { messages: ChatMessage[] };
  },
};
