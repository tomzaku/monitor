import { useQuery } from '@tanstack/react-query';
import { fetchDamSenListings, type ChototListing } from '../services/chotot';

export function useDamSenListings() {
  return useQuery<ChototListing[]>({
    queryKey: ['dam-sen-listings'],
    queryFn: fetchDamSenListings,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
