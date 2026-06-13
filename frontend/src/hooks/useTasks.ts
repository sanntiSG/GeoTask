import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.service.js';
import { Task, TaskStatus } from '../types/index.js';

interface TaskFilters {
  locationId?: string;
  status?: TaskStatus;
}

export function useTasks(filters?: TaskFilters) {
  return useQuery<Task[]>({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.locationId) params.set('locationId', filters.locationId);
      if (filters?.status) params.set('status', filters.status);
      const { data } = await api.get<Task[]>(`/tasks?${params}`);
      return data;
    },
    staleTime: 30 * 1000,
  });
}

export interface CreateTaskPayload {
  title: string;
  emoji: string;
  locationId: string;
  color: string;
  priority: string;
  recurrence: { enabled: boolean; days: number[] };
  notifyAgainAfter: number;
  notifyAgainEnabled: boolean;
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => api.post<Task>('/tasks', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Task> & { id: string }) =>
      api.patch<Task>(`/tasks/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/tasks/${id}`, { status: 'done' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
