import { queueApi } from 'services/api/endpoints/queue';
import { startAppListening } from '..';

export const addAnyEnqueuedListener = () => {
  startAppListening({
    matcher: queueApi.endpoints.enqueueBatch.matchFulfilled,
    effect: async (_, { dispatch, getState }) => {
      const { data } = queueApi.endpoints.getQueueStatus.select()(getState());

      if (!data || data.processor.is_started) {
        return;
      }

      dispatch(
        queueApi.endpoints.resumeProcessor.initiate(undefined, {
          fixedCacheKey: 'resumeProcessor',
        })
      );
    },
  });
};
