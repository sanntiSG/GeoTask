import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '../services/api.service.js';
import { useAuthStore } from '../stores/auth.store.js';
import { User } from '../types/index.js';

const isDev = import.meta.env.DEV;
const API_URL = isDev ? (import.meta.env.VITE_API_URL ?? 'http://localhost:5000') : '';

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading: queryLoading } = useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get<User>('/auth/me');
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setUser(data ?? null);
    setLoading(queryLoading);
  }, [data, queryLoading, setUser, setLoading]);

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
      setUser(null);
      window.location.href = '/login';
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    loginUrl: `${API_URL}/api/auth/google`,
    logout: () => logoutMutation.mutate(),
  };
}
