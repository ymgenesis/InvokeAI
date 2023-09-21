import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { addToast } from 'features/system/store/systemSlice';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useClearQueueMutation,
  useGetQueueStatusQuery,
} from 'services/api/endpoints/queue';
import { listCursorChanged, listPriorityChanged } from '../store/queueSlice';

export const useClearQueue = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { data: queueStatus } = useGetQueueStatusQuery();
  const isConnected = useAppSelector((state) => state.system.isConnected);
  const [trigger, { isLoading }] = useClearQueueMutation({
    fixedCacheKey: 'clearQueue',
  });

  const clearQueue = useCallback(async () => {
    if (!queueStatus?.queue.total) {
      return;
    }

    try {
      await trigger().unwrap();
      dispatch(
        addToast({
          title: t('queue.clearSucceeded'),
          status: 'success',
        })
      );
      dispatch(listCursorChanged(undefined));
      dispatch(listPriorityChanged(undefined));
    } catch {
      dispatch(
        addToast({
          title: t('queue.clearFailed'),
          status: 'error',
        })
      );
    }
  }, [queueStatus?.queue.total, trigger, dispatch, t]);

  const isDisabled = useMemo(
    () => !isConnected || !queueStatus?.queue.total,
    [isConnected, queueStatus?.queue.total]
  );

  return { clearQueue, isLoading, queueStatus, isDisabled };
};
