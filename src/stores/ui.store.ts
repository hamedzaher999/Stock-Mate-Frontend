import { create } from "zustand";
interface UiState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleMobileSidebar: () =>
    set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
  setMobileSidebarOpen: (v) => set({ mobileSidebarOpen: v }),
}));

// Generic list-page state factory
export interface ListPageState {
  page: number;
  limit: number;
  search: string;
  filters: Record<string, string>;
  setPage: (p: number) => void;
  setLimit: (l: number) => void;
  setSearch: (s: string) => void;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
}

export function createListPageStore() {
  return create<ListPageState>((set) => ({
    page: 1,
    limit: 20,
    search: "",
    filters: {},
    setPage: (page) => set({ page }),
    setLimit: (limit) => set({ limit, page: 1 }),
    setSearch: (search) => set({ search, page: 1 }),
    setFilter: (key, value) =>
      set((s) => ({ filters: { ...s.filters, [key]: value }, page: 1 })),
    clearFilters: () => set({ filters: {}, search: "", page: 1 }),
  }));
}
