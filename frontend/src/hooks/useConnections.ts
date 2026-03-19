import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionsService } from '../services/api';
import type { Connection } from '../types';
import toast from 'react-hot-toast';

export function useConnections() {
  return useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionsService.list().then((r) => r.data),
  });
}

export function useCreateConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Connection>) => connectionsService.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connections'] });
      toast.success('Conexão criada!');
    },
    onError: () => toast.error('Erro ao criar conexão'),
  });
}

export function useUpdateConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Connection> }) =>
      connectionsService.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connections'] });
      toast.success('Conexão atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar conexão'),
  });
}

export function useDeleteConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => connectionsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connections'] });
      toast.success('Conexão removida!');
    },
    onError: () => toast.error('Erro ao remover conexão'),
  });
}
