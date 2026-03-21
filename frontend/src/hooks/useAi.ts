'use client';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { aiService, ChatMessage } from '@/services/ai.service';

export function useAiChat(repoId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();

  const ask = useMutation({
    mutationFn: (question: string) => aiService.ask(repoId, question, sessionId),
    onMutate: (question) => {
      setMessages((prev) => [...prev, { role: 'user', content: question, timestamp: new Date().toISOString() }]);
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer, timestamp: new Date().toISOString() },
      ]);
    },
  });

  const clearChat = () => { setMessages([]); setSessionId(undefined); };

  return { messages, ask, sessionId, clearChat, isLoading: ask.isPending };
}

export function useOnboarding(repoId: string) {
  return useQuery({ queryKey: ['onboarding', repoId], queryFn: () => aiService.getOnboarding(repoId), enabled: !!repoId });
}

export function useAiSessions(repoId: string) {
  return useQuery({ queryKey: ['ai-sessions', repoId], queryFn: () => aiService.getSessions(repoId), enabled: !!repoId });
}
