import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.service.js';
import { Location, Coordinates } from '../types/index.js';

export function useLocations() {
  return useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data } = await api.get<Location[]>('/locations');
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export interface CreateLocationPayload {
  name: string;
  address?: string;
  coordinates: Coordinates;
  radius?: number;
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLocationPayload) => api.post<Location>('/locations', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Location> & { id: string }) =>
      api.patch<Location>(`/locations/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
