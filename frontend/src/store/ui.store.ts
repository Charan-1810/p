import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  activeTab: string;
  selectedFileId: string | null;
  selectedSessionId: string | null;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  setSelectedFileId: (id: string | null) => void;
  setSelectedSessionId: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  activeTab: 'files',
  selectedFileId: null,
  selectedSessionId: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedFileId: (id) => set({ selectedFileId: id }),
  setSelectedSessionId: (id) => set({ selectedSessionId: id }),
}));
