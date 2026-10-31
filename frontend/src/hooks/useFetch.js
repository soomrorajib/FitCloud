// Page load par API se data lata hai aur loading / error / data ki state sambhalta hai.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/api';

export default function useFetch(fetcher, deps = [], errorTitle = 'Failed to load data') {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current; // purani slow request naye data ko overwrite na kare
    setState((previous) => ({ ...previous, loading: true, error: '' }));
    try {
      const data = await fetcher();
      if (requestId === latestRequest.current) setState({ data, loading: false, error: '' });
    } catch (error) {
      if (requestId === latestRequest.current) {
        setState({ data: null, loading: false, error: `${errorTitle}. ${getErrorMessage(error, '')}`.trim() });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { ...state, reload: load };
}
