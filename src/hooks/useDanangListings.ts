import { useQuery } from '@tanstack/react-query';
import { fetchDanangListings, type ChototListing } from '../services/chotot';

export function useDanangListings(category: 'all' | 'house' | 'land' = 'all') {
  return useQuery<ChototListing[]>({
    queryKey: ['danang-listings', category],
    queryFn: () => fetchDanangListings(category),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}
