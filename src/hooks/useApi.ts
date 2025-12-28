import { useState, useCallback, useEffect } from 'react';
import { ApiResponse } from '../types';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiResult<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
}

/**
 * Generic hook for API calls with loading and error states
 *
 * @example
 * const { data: items, loading, error, refetch } = useApi(
 *   () => itemsApi.list(),
 *   []
 * );
 */
export function useApi<T>(
  fetchFn: () => Promise<ApiResponse<T>>,
  deps: React.DependencyList = []
): UseApiResult<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const response = await fetchFn();

    if (response.data !== undefined) {
      setState({ data: response.data, loading: false, error: null });
    } else {
      setState({ data: null, loading: false, error: response.error || 'Unknown error' });
    }
  }, [fetchFn]);

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ...state,
    refetch: fetch,
  };
}

/**
 * Hook for API calls with polling
 *
 * @example
 * const { data: events, loading, error } = usePollingApi(
 *   () => eventsApi.list(),
 *   10000, // Poll every 10 seconds
 *   [seasonId]
 * );
 */
export function usePollingApi<T>(
  fetchFn: () => Promise<ApiResponse<T>>,
  intervalMs: number,
  deps: React.DependencyList = []
): UseApiResult<T> {
  const result = useApi(fetchFn, deps);

  useEffect(() => {
    if (intervalMs <= 0) return;

    const interval = setInterval(() => {
      result.refetch();
    }, intervalMs);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, intervalMs]);

  return result;
}

/**
 * Hook for mutations (POST, PUT, DELETE)
 *
 * @example
 * const { mutate, loading, error } = useMutation(
 *   (data: CreateItemInput) => itemsApi.create(data)
 * );
 *
 * const handleSubmit = async (data: CreateItemInput) => {
 *   const result = await mutate(data);
 *   if (result.data) {
 *     // Success
 *   }
 * };
 */
export function useMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<ApiResponse<TOutput>>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (input: TInput): Promise<ApiResponse<TOutput>> => {
      setLoading(true);
      setError(null);

      const response = await mutationFn(input);

      if (response.error) {
        setError(response.error);
      }

      setLoading(false);
      return response;
    },
    [mutationFn]
  );

  return {
    mutate,
    loading,
    error,
  };
}
