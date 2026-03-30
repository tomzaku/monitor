import { useQuery } from '@tanstack/react-query';
import { getDanangListings, type ChototListing } from '../services/chotot';

export function useDanangListings(category: 'all' | 'house' | 'land' = 'all') {
  return useQuery<ChototListing[]>({
    queryKey: ['danang-listings', category],
    queryFn: () => getDanangListings(category),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
