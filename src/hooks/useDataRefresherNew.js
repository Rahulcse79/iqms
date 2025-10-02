import { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { refreshRepliedQueriesNew } from '../actions/repliedQueryActionNew';
import { refreshPendingQueriesNew } from '../actions/pendingQueryActionNew';
import { refreshTransferredQueriesNew } from '../actions/transferredQueryActionNew';

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

export const useDataRefresher = () => {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      const deptPrefix = 'U';
      const personnelType = 'A';
      const roleDigitForTab = { creator: '1', approver: '2', verifier: '3' };

      const pendingPromises = Object.values(roleDigitForTab).map((digit) => {
        const pendingWith = `${deptPrefix}${digit}${personnelType}`;
        return dispatch(refreshPendingQueriesNew({ cat: 1, pendingWith }));
      });

      const transferredPromises = Object.values(roleDigitForTab).map((digit) => {
        const pendingWith = `${deptPrefix}${digit}${personnelType}`;
        return dispatch(refreshTransferredQueriesNew({ cat: 1, pendingWith }));
      });

      await Promise.all([
        dispatch(refreshRepliedQueriesNew()),
        ...pendingPromises,
        ...transferredPromises,
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('Performing background data refresh...');
      refreshData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [refreshData]);

  return { refreshing, refreshData };
};
