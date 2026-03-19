import { useQuery } from '@tanstack/react-query';
import { statsService } from '../services/api';

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => statsService.get().then((r) => r.data),
    refetchInterval: 30_000,
  });
}
