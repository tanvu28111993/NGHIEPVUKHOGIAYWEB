import { useQuery } from '@tanstack/react-query';
import { ExpectedScheduleService } from '../services/expectedSchedule';

export const useExpectedScheduleQuery = () => {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['expectedSchedule'],
    queryFn: ExpectedScheduleService.fetchExpectedSchedule,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    expectedSchedule: data || [],
    isLoading,
    isFetching,
    refresh: refetch,
  };
};
