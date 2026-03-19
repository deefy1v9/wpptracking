import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../services/api';
import type { Settings } from '../types';
import toast from 'react-hot-toast';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get().then((r) => r.data),
  });
}

export function useWebhookUrls() {
  return useQuery({
    queryKey: ['webhook-urls'],
    queryFn: () => settingsService.getWebhookUrls().then((r) => r.data),
  });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Settings>) =>
      settingsService.save(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Configurações salvas!');
    },
    onError: () => {
      toast.error('Erro ao salvar configurações');
    },
  });
}
