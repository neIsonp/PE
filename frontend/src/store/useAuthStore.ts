"use client";

import { create } from 'zustand';
import type { PublicUser } from '@/types/auth';
import { getStoredUser, getValidToken, clearSession } from '@/lib/storage';
import { getCurrentUser } from '@/services/api';

interface AuthState {
  user: PublicUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  init: () => Promise<void>;
  setUser: (user: PublicUser | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  
  init: async () => {
    // 1. Verificar se há token e cache local imediatamente (Síncrono)
    const token = getValidToken();
    const cachedUser = getStoredUser();
    
    if (token && cachedUser) {
      set({ user: cachedUser, isAuthenticated: true });
      
      // 2. Validar a sessão real com a API em background (Assíncrono)
      try {
        const { user } = await getCurrentUser();
        set({ user, isAuthenticated: true, isInitialized: true });
      } catch (error) {
        // Se o token for inválido no servidor, limpa tudo
        clearSession();
        set({ user: null, isAuthenticated: false, isInitialized: true });
      }
    } else {
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  clearUser: () => {
    clearSession();
    set({ user: null, isAuthenticated: false });
  },
}));
