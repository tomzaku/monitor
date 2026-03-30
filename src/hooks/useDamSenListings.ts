import { useQuery } from '@tanstack/react-query';
import { getDamSenListings, type ChototListing } from '../services/chotot';

export function useDamSenListings() {
  return useQuery<ChototListing[]>({
    queryKey: ['dam-sen-listings'],
    queryFn: getDamSenListings,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
