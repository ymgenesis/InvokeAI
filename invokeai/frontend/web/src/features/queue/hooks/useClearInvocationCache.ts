import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { addToast } from 'features/system/store/systemSlice';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useClearInvocationCacheMutation,
  useGetInvocationCacheStatusQuery,
} from 'services/api/endpoints/appInfo';

export const useClearInvocationCache = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { data: cacheStatus } = useGetInvocationCacheStatusQuery();
  const isConnected = useAppSelector((state) => state.system.isConnected);
  const [trigger, { isLoading }] = useClearInvocationCacheMutation({
    fixedCacheKey: 'clearInvocationCache',
  });

  const isDisabled = useMemo(
    () => !cacheStatus?.size || !isConnected,
    [cacheStatus?.size, isConnected]
  );

  const clearInvocationCache = useCallback(async () => {
    if (isDisabled) {
      return;
    }

    try {
      await trigger().unwrap();
      dispatch(
        addToast({
          title: t('invocationCache.clearSucceeded'),
          status: 'success',
        })
      );
    } catch {
      dispatch(
        addToast({
          title: t('invocationCache.clearFailed'),
          status: 'error',
        })
      );
    }
  }, [isDisabled, trigger, dispatch, t]);

  return { clearInvocationCache, isLoading, cacheStatus, isDisabled };
};
