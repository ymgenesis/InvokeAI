import { logger } from 'app/logging/logger';
import { parseify } from 'common/util/serialize';
import { controlAdapterImageProcessed } from 'features/controlAdapters/store/actions';
import {
  controlAdapterImageChanged,
  controlAdapterProcessedImageChanged,
  pendingControlImagesCleared,
  selectControlAdapterById,
} from 'features/controlAdapters/store/controlAdaptersSlice';
import { isControlNetOrT2IAdapter } from 'features/controlAdapters/store/types';
import { SAVE_IMAGE } from 'features/nodes/util/graphBuilders/constants';
import { addToast } from 'features/system/store/systemSlice';
import { t } from 'i18next';
import { imagesApi } from 'services/api/endpoints/images';
import { queueApi } from 'services/api/endpoints/queue';
import { isImageOutput } from 'services/api/guards';
import { BatchConfig, ImageDTO } from 'services/api/types';
import { socketInvocationComplete } from 'services/events/actions';
import { startAppListening } from '..';

export const addControlNetImageProcessedListener = () => {
  startAppListening({
    actionCreator: controlAdapterImageProcessed,
    effect: async (action, { dispatch, getState, take }) => {
      const log = logger('session');
      const { id } = action.payload;
      const ca = selectControlAdapterById(getState().controlAdapters, id);

      if (!ca?.controlImage || !isControlNetOrT2IAdapter(ca)) {
        log.error('Unable to process ControlNet image');
        return;
      }

      if (ca.processorType === 'none' || ca.processorNode.type === 'none') {
        return;
      }

      // ControlNet one-off procressing graph is just the processor node, no edges.
      // Also we need to grab the image.

      const enqueueBatchArg: BatchConfig = {
        prepend: true,
        batch: {
          graph: {
            nodes: {
              [ca.processorNode.id]: {
                ...ca.processorNode,
                is_intermediate: true,
                image: { image_name: ca.controlImage },
              },
              [SAVE_IMAGE]: {
                id: SAVE_IMAGE,
                type: 'save_image',
                is_intermediate: true,
                use_cache: false,
              },
            },
            edges: [
              {
                source: {
                  node_id: ca.processorNode.id,
                  field: 'image',
                },
                destination: {
                  node_id: SAVE_IMAGE,
                  field: 'image',
                },
              },
            ],
          },
          runs: 1,
        },
      };

      try {
        const req = dispatch(
          queueApi.endpoints.enqueueBatch.initiate(enqueueBatchArg, {
            fixedCacheKey: 'enqueueBatch',
          })
        );
        const enqueueResult = await req.unwrap();
        req.reset();
        log.debug(
          { enqueueResult: parseify(enqueueResult) },
          t('queue.graphQueued')
        );

        const [invocationCompleteAction] = await take(
          (action): action is ReturnType<typeof socketInvocationComplete> =>
            socketInvocationComplete.match(action) &&
            action.payload.data.queue_batch_id ===
              enqueueResult.batch.batch_id &&
            action.payload.data.source_node_id === SAVE_IMAGE
        );

        // We still have to check the output type
        if (isImageOutput(invocationCompleteAction.payload.data.result)) {
          const { image_name } =
            invocationCompleteAction.payload.data.result.image;

          // Wait for the ImageDTO to be received
          const [{ payload }] = await take(
            (action) =>
              imagesApi.endpoints.getImageDTO.matchFulfilled(action) &&
              action.payload.image_name === image_name
          );

          const processedControlImage = payload as ImageDTO;

          log.debug(
            { controlNetId: action.payload, processedControlImage },
            'ControlNet image processed'
          );

          // Update the processed image in the store
          dispatch(
            controlAdapterProcessedImageChanged({
              id,
              processedControlImage: processedControlImage.image_name,
            })
          );
        }
      } catch (error) {
        log.error(
          { enqueueBatchArg: parseify(enqueueBatchArg) },
          t('queue.graphFailedToQueue')
        );

        // handle usage-related errors
        if (error instanceof Object) {
          if ('data' in error && 'status' in error) {
            if (error.status === 403) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const detail = (error.data as any)?.detail || 'Unknown Error';
              dispatch(
                addToast({
                  title: t('queue.graphFailedToQueue'),
                  status: 'error',
                  description: detail,
                  duration: 15000,
                })
              );
              dispatch(pendingControlImagesCleared());
              dispatch(controlAdapterImageChanged({ id, controlImage: null }));
              return;
            }
          }
        }

        dispatch(
          addToast({
            title: t('queue.graphFailedToQueue'),
            status: 'error',
          })
        );
      }
    },
  });
};
